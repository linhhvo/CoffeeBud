package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
)

func AddDeviceInfo(
	ctx context.Context,
	db *sql.DB,
	data models.Device,
) (models.Device, error) {
	var newDevice models.Device

	row := db.QueryRowContext(
		ctx,
		"INSERT INTO devices (device_id, battery_level) VALUES ($1,$2) RETURNING device_id, battery_level, last_synced_at",
		data.DeviceId,
		data.BatteryLevel,
	)

	err := row.Scan(
		&newDevice.DeviceId,
		&newDevice.BatteryLevel,
		&newDevice.LastSyncTime,
	)
	if err != nil {
		return newDevice, err
	}

	return newDevice, nil
}

func AddDevicePairing(
	ctx context.Context,
	db *sql.DB,
	data models.DevicePairing,
) (models.DevicePairing, error) {
	var newPairing models.DevicePairing

	row := db.QueryRowContext(
		ctx,
		"INSERT INTO device_user (device_id, user_id) VALUES ($1,$2) RETURNING device_id, user_id, paired_at",
		data.PairedDevice.DeviceId,
		data.UserId,
	)

	err := row.Scan(
		&newPairing.PairedDevice.DeviceId,
		&newPairing.UserId,
		&newPairing.PairedTime,
	)
	if err != nil {
		return newPairing, err
	}

	var deviceInfo models.Device

	deviceInfo, err = AddDeviceInfo(ctx, db, data.PairedDevice)
	if err != nil {
		return newPairing, err
	}

	newPairing.PairedDevice = deviceInfo

	return newPairing, nil
}

func GetDevicePairing(
	ctx context.Context,
	db *sql.DB,
	deviceId string,
) (models.DevicePairing, error) {
	var devicePair models.DevicePairing

	row := db.QueryRowContext(
		ctx,
		"SELECT * FROM device_user WHERE device_id = $1",
		deviceId,
	)

	if err := row.Scan(
		&devicePair.PairedDevice.DeviceId,
		&devicePair.UserId,
	); err != nil {
		return devicePair, err
	}

	// check if user_id is a valid UUID
	if devicePair.UserId != uuid.Nil {
		return devicePair, fmt.Errorf("user ID is invalid")
	}

	return devicePair, nil
}
