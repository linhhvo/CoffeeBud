package session

import (
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var CookieName = os.Getenv("COOKIE_NAME")
var sessions = make(map[string]uuid.UUID)

func SetCookie(c *gin.Context, userId uuid.UUID) error {
	newToken, err := IssueNewToken(userId)
	if err != nil {
		return err
	}

	cookie := http.Cookie{
		Name:     CookieName,
		Value:    newToken,
		Path:     "/",
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}

	c.SetCookieData(&cookie)

	sessions[newToken] = userId
	return nil
}

func IsSessionValid(tokenStr string) error {
	_, exists := sessions[tokenStr]
	if !exists {
		return errors.New("no saved token")
	}
	return nil
}

func ClearSessions(c *gin.Context, tokenId string) {
	emptyCookie := http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	}

	c.SetCookieData(&emptyCookie)

	delete(sessions, tokenId)
}
