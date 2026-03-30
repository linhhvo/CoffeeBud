package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
)

var ErrNoUser = errors.New("user not found")

func AddUser(
	ctx context.Context,
	db *sql.DB,
	data models.User,
) (models.User, error) {
	var newUser models.User

	data.UserId = uuid.New()

	row := db.QueryRowContext(
		ctx,
		"INSERT INTO users (user_id, username, password) VALUES ($1, $2, $3) RETURNING user_id, username, created_at",
		data.UserId,
		data.Username,
		data.Password,
	)

	err := row.Scan(&newUser.UserId, &newUser.Username, &newUser.CreatedTime)
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

	err := row.Scan(
		&foundUser.UserId,
		&foundUser.Username,
		&foundUser.Password,
		&foundUser.CreatedTime,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return foundUser, ErrNoUser
		}
		return foundUser, err
	}

	return foundUser, nil
}
