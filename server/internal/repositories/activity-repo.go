package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
)

func AddActivity(
	ctx context.Context,
	db *sql.DB,
	data models.ActivityEvent,
) (models.ActivityEvent, error) {
	var newActivity models.ActivityEvent

	device, err := GetDeviceById(ctx, db, data.DeviceId)
	if err != nil {
		return newActivity, err
	}

	userId := device.UserId

	row := db.QueryRowContext(
		ctx,
		"INSERT INTO activity_events (device_id, user_id, activity_type, timestamp) VALUES ($1, $2, $3, $4) RETURNING device_id, user_id, activity_type, timestamp",
		data.DeviceId,
		userId,
		data.ActivityType,
		data.Timestamp,
	)

	err = row.Scan(
		&newActivity.DeviceId,
		&newActivity.UserId,
		&newActivity.ActivityType,
		&newActivity.Timestamp,
	)
	if err != nil {
		return newActivity, err
	}

	return newActivity, nil
}

// func GetAllActivities(
// 	ctx context.Context,
// 	db *sql.DB,
// ) ([]models.AcitivityEvent, error) {
// 	var foundActivities []models.AcitivityEvent
//
// 	rows, err := db.QueryContext(ctx, "SELECT * FROM activity_events")
//
// 	if err != nil {
// 		return foundActivities, err
// 	}
// 	defer rows.Close()
//
// 	for rows.Next() {
// 		var activity models.AcitivityEvent
// 		err = rows.Scan(
// 			&activity.Timestamp,
// 			&activity.DeviceId,
// 			&activity.UserId,
// 			&activity.ActionType,
// 		)
// 		if err != nil {
// 			return foundActivities, err
// 		}
//
// 		foundActivities = append(foundActivities, activity)
// 	}
//
// 	if err := rows.Err(); err != nil {
// 		return foundActivities, err
// 	}
//
// 	return foundActivities, nil
// }

func GetActivitiesByUser(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
) ([]models.ActivityEvent, error) {
	var foundActivities []models.ActivityEvent

	err := db.QueryRowContext(
		ctx,
		"SELECT user_id FROM users WHERE user_id = $1",
		userId,
	).Scan(&userId)
	if errors.Is(err, sql.ErrNoRows) {
		return foundActivities, ErrNoUser
	}

	rows, err := db.QueryContext(
		ctx,
		"SELECT * FROM activity_events WHERE user_id =$1",
		userId,
	)

	if err != nil {
		return foundActivities, err
	}
	defer rows.Close()

	for rows.Next() {
		var activity models.ActivityEvent
		err = rows.Scan(
			&activity.Timestamp,
			&activity.DeviceId,
			&activity.UserId,
			&activity.ActivityType,
		)
		if err != nil {
			return foundActivities, err
		}

		foundActivities = append(foundActivities, activity)
	}

	if err := rows.Err(); err != nil {
		return foundActivities, err
	}

	return foundActivities, nil
}
