package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetPetAvatarByDevice(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		deviceId := c.Param("deviceId")
		mood := c.Param("mood")

		avatarUrl, err := repositories.GetPetAvatarByDevice(ctx, db, deviceId, mood)
		if err != nil {
			if err.Error() == "invalid mood" {
				c.Status(http.StatusBadRequest)
				c.Error(err)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error getting %s avatar url from database: %v", mood, err))
			return
		}

		res, err := http.Get(avatarUrl)
		if err != nil || res.StatusCode != http.StatusOK {
			c.Status(http.StatusServiceUnavailable)
			c.Error(fmt.Errorf("error getting avatar from storage: %v", err))
			return
		}

		reader := res.Body
		contentLength := res.ContentLength
		contentType := res.Header.Get("Content-Type")

		c.DataFromReader(http.StatusOK, contentLength, contentType, reader, nil)
	}
}

func UpdatePetAvatarsHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		var pet models.PetState

		if err := c.ShouldBindJSON(&pet); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		pet.UserId = userId.(uuid.UUID)

		err := repositories.UpdatePetAvatars(ctx, db, pet)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error updating pet avatars: %v", err))
			return
		}

		middleware.SuccessResponse(c, 200, nil)
	}
}

func GetPetAvatars(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		pet, err := repositories.GetPetAvatars(ctx, db, userId.(uuid.UUID))
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error getting avatar urls: %v", err))
			return
		}

		middleware.SuccessResponse(c, 200, pet)
	}
}
