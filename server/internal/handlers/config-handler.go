package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/repositories"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetConfigByUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		config, err := repositories.GetConfigByUser(ctx, db, userId.(uuid.UUID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				c.Status(http.StatusNotFound)
				c.Error(errors.New("config is not set"))
				return
			}

			c.Status(http.StatusNotFound)
			c.Error(fmt.Errorf("failed to retrieve configs -- %v", err.Error()))
			return
		}

		middleware.SuccessResponse(c, 200, config)
	}
}

func GetConfigByDeviceHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		deviceId := c.Param("deviceId")

		config, err := repositories.GetConfigByDevice(ctx, db, deviceId)
		if err != nil {
			if errors.Is(err, repositories.ErrNoDevice) {
				c.Status(http.StatusNotFound)
				c.Error(errors.New("device doesn't exist"))
				return
			}

			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, 200, config)
	}
}

func UpdateConfigHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		config, err := repositories.GetConfigByUser(ctx, db, userId.(uuid.UUID))
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error getting config for this user: %v", err))
			return
		}

		if err := c.ShouldBindJSON(&config); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		config.UserId = userId.(uuid.UUID)

		err = repositories.UpdateConfig(ctx, db, config)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("failed to update config -- %v", err.Error()))
			return
		}
		middleware.SuccessResponse(c, 201, nil)
	}
}
