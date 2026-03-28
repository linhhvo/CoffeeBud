package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	"database/sql"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AddActivityHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var json models.AcitivityEvent

		if err := c.ShouldBindJSON(&json); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		activity, err := repositories.AddActivity(ctx, db, json)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate") {
				c.Status(http.StatusConflict)
				c.Error(err)
				return
			}

			if strings.Contains(err.Error(), "user account") {
				c.Status(http.StatusNotFound)
				c.Error(err)
				return
			}

			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, 201, activity)
	}
}

func GetAllActivitiesHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		var activities []models.AcitivityEvent

		activities, err := repositories.GetAllActivities(ctx, db)
		if err != nil {
			if err == sql.ErrNoRows {
				c.Status(http.StatusUnauthorized)
				c.Error(err)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, http.StatusOK, activities)
	}
}
