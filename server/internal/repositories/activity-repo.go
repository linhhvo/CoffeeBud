package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

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

func GetActivitiesByTypeTime(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	activityType string,
	startTime time.Time, endTime time.Time,
) ([]models.ActivityEvent, error) {
	var activities []models.ActivityEvent

	rows, err := db.QueryContext(
		ctx,
		"SELECT * FROM activity_events WHERE user_id=$1 AND activity_type=$2 AND timestamp >= $3 AND timestamp < $4",
		userId,
		activityType,
		startTime,
		endTime,
	)
	if err != nil {
		return activities, fmt.Errorf("error getting %s activities: %v", activityType, err)
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
			return activities, fmt.Errorf("error getting %s activities: %v", activityType, err)
		}

		activities = append(activities, activity)
	}

	if err = rows.Close(); err != nil {
		return activities, fmt.Errorf("error closing activity events database rows: %v", err)
	}

	// last error encountered by Rows.Scan
	if err := rows.Err(); err != nil {
		return activities, err
	}

	return activities, nil
}

func GetMostRecentActivityByType(
	ctx context.Context,
	db *sql.DB,
	activity_type string,
	userId uuid.UUID,
) (models.ActivityEvent, error) {
	var activity models.ActivityEvent

	row := db.QueryRowContext(
		ctx,
		"SELECT * FROM activity_events WHERE user_id=$1 AND activity_type=$2 ORDER BY timestamp DESC LIMIT 1",
		userId,
		activity_type,
	)

	err := row.Scan(
		&activity.Timestamp,
		&activity.DeviceId,
		&activity.UserId,
		&activity.ActivityType,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return activity, nil
		}
		return activity, fmt.Errorf("error getting most recent activity: %v", err)
	}

	return activity, nil
}
