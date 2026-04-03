package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
			if errors.Is(err, repositories.ErrNoDevice) {
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

// func GetAllActivitiesHandler(db *sql.DB) gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		ctx := c.Request.Context()
//
// 		activities, err := repositories.GetAllActivities(ctx, db)
// 		if err != nil {
// 			c.Status(http.StatusInternalServerError)
// 			c.Error(err)
// 			return
// 		}
//
// 		middleware.SuccessResponse(c, http.StatusOK, activities)
// 	}
// }

func GetActivitiesByUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		activities, err := repositories.GetActivitiesByUser(
			ctx,
			db,
			userId.(uuid.UUID),
		)
		if err != nil {
			if strings.Contains(err.Error(), "invalid input") {
				c.Status(http.StatusBadRequest)
				c.Error(err)
				return
			}

			if errors.Is(err, repositories.ErrNoUser) {
				c.Status(http.StatusNotFound)
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
