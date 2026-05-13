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

func GetHabitRuleByUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		rules, err := repositories.GetHabitRuleByUser(ctx, db, userId.(uuid.UUID))
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				c.Status(http.StatusNotFound)
				c.Error(errors.New("habit rule is not set"))
				return
			}

			c.Status(http.StatusNotFound)
			c.Error(fmt.Errorf("failed to retrieve habit rules -- %v", err.Error()))
			return
		}

		middleware.SuccessResponse(c, 200, rules)
	}
}

func GetHabitRuleByDeviceHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		deviceId := c.Param("deviceId")

		rules, err := repositories.GetHabitRuleByDevice(ctx, db, deviceId)
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

		middleware.SuccessResponse(c, 200, rules)
	}
}

func UpdateHabitRuleHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		config, err := repositories.GetHabitRuleByUser(ctx, db, userId.(uuid.UUID))
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

		err = repositories.UpdateHabitRule(ctx, db, config)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("failed to update habit rule -- %v", err.Error()))
			return
		}
		middleware.SuccessResponse(c, 201, nil)
	}
}
