package session

import (
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var CookieName string
var sessions = make(map[string]uuid.UUID)

func Init() {
	CookieName = os.Getenv("COOKIE_NAME")
	secret = []byte(os.Getenv("JWT_SECRET"))
}

func SetCookie(c *gin.Context, userId uuid.UUID) error {
	newToken, err := IssueNewToken(userId)
	if err != nil {
		return err
	}

	jwtCookie := http.Cookie{
		Name:     CookieName,
		Value:    newToken,
		Path:     "/",
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteNoneMode,
	}

	authFlagCookie := http.Cookie{
		Name:     "is_authenticated",
		Value:    "true",
		Path:     "/",
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
	}

	c.SetCookieData(&jwtCookie)
	c.SetCookieData(&authFlagCookie)

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
		SameSite: http.SameSiteNoneMode,
		MaxAge:   -1,
	}

	emptyFlagCookie := http.Cookie{
		Name:     "is_authenticated",
		Value:    "",
		Path:     "/",
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   -1,
	}

	c.SetCookieData(&emptyCookie)
	c.SetCookieData(&emptyFlagCookie)

	delete(sessions, tokenId)
}
