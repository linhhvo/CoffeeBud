package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"

	"github.com/google/uuid"
)

func AddUser(ctx context.Context, db *sql.DB, data models.User) (string, error) {
	var newUser string

	data.UserId = uuid.New()

	row := db.QueryRowContext(ctx, "insert into users (user_id, username, password) values ($1, $2, $3) returning username", data.UserId, data.Username, data.Password)

	err := row.Scan(&newUser)
	if err != nil {
		return newUser, err
	}

	return newUser, nil
}

func GetUser(ctx context.Context, db *sql.DB, data models.User) (models.User, error) {
	var foundUser models.User

	row := db.QueryRowContext(ctx, "select * from users where username = $1 and password = $2", data.Username, data.Password)

	err := row.Scan(&foundUser.UserId, &foundUser.Username, &foundUser.Password)
	if err != nil {
		return foundUser, err
	}

	return foundUser, nil
}

func GetUserByDeviceId(ctx context.Context, db *sql.DB, deviceId string) (string, error) {
	var userId string
	row := db.QueryRowContext(ctx, "select user_id from devices where device_id = $1", deviceId)

	if err := row.Scan(&userId); err != nil {
		if err == sql.ErrNoRows {
			return userId, err
		}
		return userId, err
	}
	return userId, nil
}
