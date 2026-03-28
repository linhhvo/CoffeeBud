package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"fmt"
)

func AddActivity(ctx context.Context, db *sql.DB, data models.AcitivityEvent) (models.AcitivityEvent, error) {
	var newActivity models.AcitivityEvent

	userId, err := GetUserByDeviceId(ctx, db, data.DeviceId)
	if err != nil {
		return newActivity, fmt.Errorf("can't find connected user account for this device")
	}
	row := db.QueryRowContext(ctx, "insert into activity_events (device_id, user_id, action_type, timestamp) values ($1, $2, $3, $4)", data.DeviceId, userId, data.ActionType, data.Timestamp)

	err = row.Scan(&newActivity.Timestamp, &newActivity.UserId, &newActivity.DeviceId, &newActivity.ActionType)
	if err != nil {
		return newActivity, err
	}

	return newActivity, nil
}

func GetAllActivities(ctx context.Context, db *sql.DB) ([]models.AcitivityEvent, error) {
	var foundActivities []models.AcitivityEvent

	rows, err := db.QueryContext(ctx, "select * from activity_events")

	if err != nil {
		return foundActivities, err
	}
	defer rows.Close()

	for rows.Next() {
		var activity models.AcitivityEvent
		err = rows.Scan(&activity.Timestamp, &activity.UserId, &activity.DeviceId, &activity.ActionType)
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
