package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"

	"github.com/google/uuid"
)

func AddUser(
	ctx context.Context,
	db *sql.DB,
	data models.User,
) (string, error) {
	var newUser string

	data.UserId = uuid.New()

	row := db.QueryRowContext(
		ctx,
		"INSERT INTO users (user_id, username, password) VALUES ($1, $2, $3) returning username",
		data.UserId,
		data.Username,
		data.Password,
	)

	err := row.Scan(&newUser)
	if err != nil {
		return newUser, err
	}

	return newUser, nil
}

func GetUser(
	ctx context.Context,
	db *sql.DB,
	data models.User,
) (models.User, error) {
	var foundUser models.User

	row := db.QueryRowContext(
		ctx,
		"SELECT * FROM users WHERE username = $1 AND password = $2",
		data.Username,
		data.Password,
	)

	err := row.Scan(&foundUser.UserId, &foundUser.Username, &foundUser.Password)
	if err != nil {
		return foundUser, err
	}

	return foundUser, nil
}
