package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

func AddDevice(
	ctx context.Context,
	db *sql.DB,
	data models.Device,
) (models.Device, error) {
	var newDevice models.Device

	row := db.QueryRowContext(
		ctx,
		"INSERT INTO devices (device_id, user_id, battery_level) VALUES ($1,$2, $3) RETURNING device_id, user_id, battery_level, last_synced_at, paired_at",
		data.DeviceId,
		data.UserId,
		data.BatteryLevel,
	)

	err := row.Scan(
		&newDevice.DeviceId,
		&newDevice.UserId,
		&newDevice.BatteryLevel,
		&newDevice.LastSyncTime,
		&newDevice.PairedTime,
	)
	if err != nil {
		return newDevice, err
	}

	return newDevice, nil
}

func UpdateDevice(
	ctx context.Context,
	db *sql.DB,
	data models.Device,
) (models.Device, error) {
	var newDevice models.Device

	row := db.QueryRowContext(
		ctx,
		"UPDATE devices SET battery_level=$1, last_synced_at=CURRENT_TIMESTAMP WHERE device_id=$2 RETURNING device_id, user_id, battery_level, last_synced_at, paired_at",
		data.BatteryLevel,
		data.DeviceId,
	)

	err := row.Scan(
		&newDevice.DeviceId,
		&newDevice.UserId,
		&newDevice.BatteryLevel,
		&newDevice.LastSyncTime,
		&newDevice.PairedTime,
	)
	if err != nil {
		return newDevice, err
	}

	return newDevice, nil
}

func GetDevice(
	ctx context.Context,
	db *sql.DB,
	deviceId string,
) (models.Device, error) {
	var device models.Device

	row := db.QueryRowContext(
		ctx,
		"SELECT * FROM devices WHERE device_id = $1",
		deviceId,
	)

	err := row.Scan(
		&device.DeviceId,
		&device.UserId,
		&device.BatteryLevel,
		&device.LastSyncTime,
		&device.PairedTime,
	)
	if err != nil {
		return device, err
	}

	// check if user_id is a valid UUID
	if device.UserId == uuid.Nil {
		return device, fmt.Errorf("user ID is invalid")
	}

	return device, nil
}

func DeleteDevice(
	ctx context.Context,
	db *sql.DB,
	deviceId string,
) (models.Device, error) {
	var deletedDevice models.Device

	row := db.QueryRowContext(
		ctx,
		"DELETE FROM devices WHERE device_id=$1 RETURNING device_id, user_id, battery_level, last_synced_at, paired_at",
		deviceId,
	)

	err := row.Scan(
		&deletedDevice.DeviceId,
		&deletedDevice.UserId,
		&deletedDevice.BatteryLevel,
		&deletedDevice.LastSyncTime,
		&deletedDevice.PairedTime,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return deletedDevice, errors.New("device not found")
		}
		return deletedDevice, fmt.Errorf(
			"error scanning returned row after deleting device: %v",
			err,
		)
	}

	_, err = GetDevice(ctx, db, deviceId)
	if errors.Is(err, sql.ErrNoRows) {
		return deletedDevice, nil
	}

	return deletedDevice, fmt.Errorf(
		"error getting device after deleting: %v",
		err,
	)
}
