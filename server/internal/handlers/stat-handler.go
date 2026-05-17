package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetDailyStatHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var dailyStat models.DailyStats
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		requestedTime, err := time.Parse(time.DateOnly, c.Query("date"))
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error parsing URL date param: %v", err))
			return
		}

		dailyStat, err = repositories.CalculateMood(ctx, db, userId.(uuid.UUID), requestedTime)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error getting daily stat: %v", err))
			return
		}

		middleware.SuccessResponse(c, 200, dailyStat)
	}
}

func GetWeeklyStatHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var weeklyStat []models.DailyStats
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		requestedTime, err := time.Parse(time.DateOnly, c.Query("date"))
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error parsing URL date param: %v", err))
			return
		}

		weeklyStat, err = repositories.GetWeeklyStat(ctx, db, userId.(uuid.UUID), requestedTime)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error getting daily stat: %v", err))
			return
		}

		middleware.SuccessResponse(c, 200, weeklyStat)
	}
}
