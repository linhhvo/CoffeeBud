package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
)

func CreateUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		var json models.User

		if err := c.ShouldBindJSON(&json); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		newUser, err := repositories.AddUser(ctx, db, json)

		if err != nil {
			if strings.Contains(err.Error(), "duplicate") {
				c.Status(http.StatusConflict)
				c.Error(err)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, 201, newUser)
	}
}

func GetUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		var json models.User

		if err := c.ShouldBindJSON(&json); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		user, err := repositories.GetUser(ctx, db, json)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				c.Status(http.StatusUnauthorized)
				c.Error(err)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, http.StatusOK, user.Username)
	}
}
