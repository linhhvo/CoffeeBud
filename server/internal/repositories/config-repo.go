package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
)

func GetConfigByUser(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
) (models.Config, error) {
	var config models.Config

	row := db.QueryRowContext(
		ctx,
		"SELECT * FROM configs WHERE user_id = $1",
		userId,
	)
	err := row.Scan(
		&config.UserId,
		&config.WaterInterval,
		&config.CoffeeLimit,
		&config.BreakInterval,
		&config.LastUpdateTime,
		&config.WakeUpTime,
		&config.SleepTime,
		&config.Timezone,
	)
	if err != nil {
		return config, err
	}

	return config, nil
}

func GetConfigByDevice(
	ctx context.Context,
	db *sql.DB,
	deviceId string,
) (models.Config, error) {
	var config models.Config

	var userId uuid.UUID

	err := db.QueryRowContext(
		ctx,
		"SELECT user_id FROM devices WHERE device_id = $1",
		deviceId,
	).Scan(&userId)
	if errors.Is(err, sql.ErrNoRows) {
		return config, ErrNoDevice
	}

	config, err = GetConfigByUser(ctx, db, userId)
	if err != nil {
		return config, err
	}

	config.DeviceId = deviceId
	return config, nil
}

func AddDefaultConfig(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	timezone string,
) error {
	log.Println("user timezone: ", timezone)

	wakeupTime, _ := time.Parse(time.TimeOnly, "08:00:00")
	sleepTime, _ := time.Parse(time.TimeOnly, "23:00:00")

	_, err := db.ExecContext(
		ctx,
		"INSERT INTO configs (user_id, wakeup_time, sleep_time, timezone) VALUES ($1, $2, $3, $4)",
		userId, wakeupTime, sleepTime, timezone,
	)

	if err != nil {
		return err
	}
	return nil
}

func UpdateConfig(
	ctx context.Context,
	db *sql.DB,
	data models.Config,
) error {
	_, err := db.ExecContext(
		ctx,
		"UPDATE configs SET water_interval_minutes=$1, coffee_limit=$2, break_interval_minutes=$3, last_updated=CURRENT_TIMESTAMP, wakeup_time=$4, sleep_time=$5, timezone=$6 WHERE user_id=$7",
		data.WaterInterval,
		data.CoffeeLimit,
		data.BreakInterval,
		data.WakeUpTime,
		data.SleepTime,
		data.Timezone,
		data.UserId,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			_, err := db.ExecContext(
				ctx,
				"INSERT INTO configs (user_id, water_interval_minutes, coffee_limit, break_interval_minutes, wakeup_time, sleep_time, timezone) VALUES ($1, $2, $3, $4, $5, $6, $7)",
				data.UserId,
				data.WaterInterval,
				data.CoffeeLimit,
				data.BreakInterval,
				data.WakeUpTime,
				data.SleepTime,
				data.Timezone,
			)
			if err != nil {
				return err
			}
		}
		return err
	}

	return nil
}

func HasPendingConfigChanges(
	ctx context.Context,
	db *sql.DB,
	deviceId string,
) (int, error) {
	var lastUpdateTime time.Time

	userId, err := GetUserIdByDevice(ctx, db, deviceId)
	if err != nil {
		return 0, err
	}

	row := db.QueryRowContext(
		ctx,
		"SELECT last_updated FROM configs WHERE user_id = $1",
		userId,
	)

	err = row.Scan(&lastUpdateTime)
	if err != nil {
		return 0, err
	}

	device, err := GetDeviceById(ctx, db, deviceId)
	if err != nil {
		return 0, err
	}

	if lastUpdateTime.After(*(device.LastSyncTime)) || device.PairedTime.Equal(*(device.LastSyncTime)) {
		return 1, nil
	}

	return 0, nil
}
