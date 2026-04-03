package middleware

import (
	"coffee-bud/internal/session"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, err := c.Cookie(session.CookieName)
		if err != nil {
			c.Status(http.StatusUnauthorized)
			c.Error(fmt.Errorf("missing cookie %s", session.CookieName))
			c.Abort()
			return
		}

		claims, err := session.VerifyToken(tokenStr)
		if err != nil {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid token"))
			c.Abort()
			return
		}

		err = session.IsSessionValid(tokenStr)
		if err != nil {
			c.Status(http.StatusUnauthorized)
			c.Error(err)
			c.Abort()
			return
		}

		c.Set("userId", claims.Subject)
		c.Next()
	}
}
