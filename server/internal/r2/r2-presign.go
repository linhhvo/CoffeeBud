package r2

import (
	"coffee-bud/internal/middleware"
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var accessKeyId string
var accessKeySecret string
var endpoint string

func Init() {
	accessKeyId = os.Getenv("R2_ACCESS_KEY_ID")
	accessKeySecret = os.Getenv("R2_ACCESS_SECRET")
	endpoint = os.Getenv("R2_ENDPOINT")
}

func GetR2UrlHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		mood := c.Query("mood")

		bucketName := "coffeebud"

		cfg, err := config.LoadDefaultConfig(
			context.TODO(),
			config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyId, accessKeySecret, "")),
			config.WithRegion("auto"),
		)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error loading config for R2: %v", err))
			return
		}

		client := s3.NewFromConfig(
			cfg, func(o *s3.Options) {
				o.BaseEndpoint = aws.String(endpoint)
			},
		)

		presignClient := s3.NewPresignClient(client)
		objectKey := userId.(uuid.UUID).String() + "/" + mood + ".bmp"

		presignedReq, err := presignClient.PresignPutObject(
			context.TODO(), &s3.PutObjectInput{
				Bucket: aws.String(bucketName),
				Key:    aws.String(objectKey),
			}, s3.WithPresignExpires(15*time.Minute),
		)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error getting R2 presign URL: %v", err))
			return
		}

		middleware.SuccessResponse(c, http.StatusOK, gin.H{"upload_url": presignedReq.URL, "object_key": objectKey})
	}
}
