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

func GetHabitRuleByUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		rule, err := repositories.GetHabitRuleByUser(
			ctx,
			db,
			userId.(uuid.UUID),
		)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				c.Status(http.StatusNotFound)
				c.Error(errors.New("habit rule is not set"))
				return
			}

			c.Status(http.StatusNotFound)
			c.Error(
				fmt.Errorf(
					"failed to retrieve habit rules -- %v",
					err.Error(),
				),
			)
			return
		}

		middleware.SuccessResponse(c, 200, rule)
	}
}

func UpdateHabitRuleHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		var json models.HabitRule

		if err := c.ShouldBindJSON(&json); err != nil {
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

		json.UserId = userId.(uuid.UUID)

		rule, err := repositories.UpdateHabitRule(ctx, db, json)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(
				fmt.Errorf(
					"failed to update habit rule -- %v",
					err.Error(),
				),
			)
			return
		}
		middleware.SuccessResponse(c, 201, rule)
	}
}
