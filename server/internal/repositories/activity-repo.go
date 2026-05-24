package repositories

import (
	"coffee-bud/internal/models"
	"coffee-bud/internal/utils"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

func AddActivity(ctx context.Context, db *sql.DB, data models.ActivityEvent) error {
	device, err := GetDeviceById(ctx, db, data.DeviceId)
	if err != nil {
		return err
	}

	userId := device.UserId

	config, err := GetConfigByUser(ctx, db, userId)
	if err != nil {
		return err
	}

	startTime := utils.GetDateTime(data.Timestamp, config.WakeUpTime, config.Timezone)

	var interval float64
	// get the latest activity before this activity in the same day
	latest, err := GetLatestActivityByType(
		ctx,
		db,
		data.ActivityType,
		userId,
		startTime,
		data.Timestamp,
	)
	log.Println("activity timestamp: ", data.Timestamp)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) { // if no activity since the start of the day
			interval = data.Timestamp.Sub(startTime).Minutes()
			log.Println("no prev activity -- start time ", startTime, " and interval ", interval)
		} else {
			return err
		}
	} else {
		interval = data.Timestamp.Sub(latest.Timestamp).Minutes()
		log.Println("there is prev activity -- interval ", interval)
	}

	result, err := db.ExecContext(
		ctx,
		"INSERT INTO activity_events (device_id, user_id, activity_type, timestamp, interval_since_last) VALUES ($1, $2, $3, $4, $5)",
		data.DeviceId,
		userId,
		data.ActivityType,
		data.Timestamp,
		int(interval),
	)

	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows != 1 {
		return fmt.Errorf("expected signle row affected, got %d rows affected", rows)
	}

	return nil
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
			&activity.IntervalMinutes,
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
		"SELECT * FROM activity_events WHERE user_id=$1 AND activity_type=$2 AND timestamp >= $3 AND timestamp < $4 ORDER BY timestamp DESC",
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
			&activity.IntervalMinutes,
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

func GetLatestActivityByType(
	ctx context.Context,
	db *sql.DB,
	activityType string,
	userId uuid.UUID,
	startTime time.Time,
	endTime time.Time,
) (models.ActivityEvent, error) {
	var activity models.ActivityEvent

	row := db.QueryRowContext(
		ctx,
		"SELECT * FROM activity_events WHERE user_id=$1 AND activity_type=$2 AND timestamp >= $3 AND  timestamp < $4 ORDER BY timestamp DESC LIMIT 1",
		userId,
		activityType,
		startTime,
		endTime,
	)

	err := row.Scan(
		&activity.Timestamp,
		&activity.DeviceId,
		&activity.UserId,
		&activity.ActivityType,
		&activity.IntervalMinutes,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return activity, err
		}
		return activity, fmt.Errorf("error getting most recent activity: %v", err)
	}

	return activity, nil
}
