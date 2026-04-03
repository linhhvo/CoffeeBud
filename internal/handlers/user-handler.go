package handlers

import (
	"coffee-bud/internal/session"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
)

func RegisterUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		var json models.User

		if err := c.ShouldBindJSON(&json); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		passwordHash, err := bcrypt.GenerateFromPassword(
			[]byte(json.Password),
			bcrypt.DefaultCost,
		)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		json.Password = string(passwordHash)

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

func UserLogInHandler(db *sql.DB) gin.HandlerFunc {
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
			if errors.Is(err, repositories.ErrNoUser) {
				c.Status(http.StatusNotFound)
				c.Error(err)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		err = bcrypt.CompareHashAndPassword(
			[]byte(user.Password),
			[]byte(json.Password),
		)
		if err != nil {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid password"))
			return
		}

		err = session.SetCookie(c, user.UserId)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("failed to set cookie -- %v", err.Error()))
			return
		}

		middleware.SuccessResponse(c, http.StatusOK, user.Username)
	}
}

func UserLogOutHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, _ := c.Cookie(session.CookieName)
		session.ClearSessions(c, token)
		middleware.SuccessResponse(c, http.StatusOK, nil)
	}
}
