package session

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var secret []byte

type CustomClaims struct {
	UserId uuid.UUID `json:"user_id"`
	jwt.RegisteredClaims
}

func IssueNewToken(userId uuid.UUID) (string, error) {
	claims := CustomClaims{
		userId, jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	fmt.Println("jwt secret", string(secret))

	return token.SignedString(secret)
}

func VerifyToken(tokenStr string) (*CustomClaims, error) {
	if len(secret) == 0 {
		return nil, errors.New("jwt secret is not set")
	}

	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	token, err := parser.ParseWithClaims(
		tokenStr, &CustomClaims{}, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return secret, nil
		},
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	exp := claims.ExpiresAt
	if exp != nil && time.Now().After(exp.Time) {
		return nil, errors.New("token expired")
	}

	return claims, nil
}
