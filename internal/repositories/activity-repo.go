package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
)

func AddActivity(
	ctx context.Context,
	db *sql.DB,
	data models.AcitivityEvent,
) (models.AcitivityEvent, error) {
	var newActivity models.AcitivityEvent

	row := db.QueryRowContext(
		ctx,
		"INSERT INTO activity_events (device_id, action_type, timestamp) VALUES ($1, $2, $3)",
		data.DeviceId,
		data.ActionType,
		data.Timestamp,
	)

	err := row.Scan(
		&newActivity.Timestamp,
		&newActivity.DeviceId,
		&newActivity.ActionType,
	)
	if err != nil {
		return newActivity, err
	}

	return newActivity, nil
}

func GetAllActivities(
	ctx context.Context,
	db *sql.DB,
) ([]models.AcitivityEvent, error) {
	var foundActivities []models.AcitivityEvent

	rows, err := db.QueryContext(ctx, "SELECT * FROM activity_events")

	if err != nil {
		return foundActivities, err
	}
	defer rows.Close()

	for rows.Next() {
		var activity models.AcitivityEvent
		err = rows.Scan(
			&activity.Timestamp,
			&activity.DeviceId,
			&activity.ActionType,
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
