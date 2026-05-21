package handlers

import (
	"coffee-bud/internal/repositories"
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
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
