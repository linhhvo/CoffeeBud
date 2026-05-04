package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

var ErrNoDevice = errors.New("device not found")

func AddDevice(
	ctx context.Context,
	db *sql.DB,
	data models.Device,
) (models.Device, error) {
	var device models.Device

	row := db.QueryRowContext(
		ctx,
		"INSERT INTO devices (device_id, user_id, battery_level) VALUES ($1,$2, $3) RETURNING device_id, user_id, status",
		data.DeviceId,
		data.UserId,
		data.BatteryLevel,
	)

	err := row.Scan(
		&device.DeviceId,
		&device.UserId,
		&device.Status,
	)
	if err != nil {
		if strings.Contains(err.Error(), "violates foreign key constraint") {
			return device, ErrNoUser
		}
		return device, err
	}

	return device, nil
}

func UpdateDevice(
	ctx context.Context,
	db *sql.DB,
	data models.Device,
) (models.Device, error) {
	var device models.Device

	row := db.QueryRowContext(
		ctx,
		"UPDATE devices SET battery_level=$1, status=(CASE WHEN $2 = '' THEN status ELSE $2 END), last_synced_at=CURRENT_TIMESTAMP, paired_at=(CASE WHEN $2 = '' THEN paired_at ELSE CURRENT_TIMESTAMP END) WHERE device_id=$3 RETURNING device_id, user_id, status, battery_level, last_synced_at, paired_at",
		data.BatteryLevel,
		data.Status,
		data.DeviceId,
	)

	err := row.Scan(
		&device.DeviceId,
		&device.UserId,
		&device.Status,
		&device.BatteryLevel,
		&device.LastSyncTime,
		&device.PairedTime,
	)
	if err != nil {
		return device, err
	}

	return device, nil
}

func GetDeviceById(
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
		&device.Status,
		&device.BatteryLevel,
		&device.LastSyncTime,
		&device.PairedTime,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return device, ErrNoDevice
		}
		return device, err
	}

	// check if user_id is a valid UUID
	if device.UserId == uuid.Nil {
		return device, fmt.Errorf("user ID is invalid")
	}

	return device, nil
}

func GetDeviceByUser(ctx context.Context, db *sql.DB, userId uuid.UUID) ([]models.Device, error) {
	var devices []models.Device

	rows, err := db.QueryContext(ctx, "SELECT * FROM devices WHERE user_id = $1", userId)
	if err != nil {
		return devices, err
	}

	for rows.Next() {
		var device models.Device
		err := rows.Scan(
			&device.DeviceId,
			&device.UserId,
			&device.Status,
			&device.BatteryLevel,
			&device.LastSyncTime,
			&device.PairedTime,
		)
		if err != nil {
			return devices, err
		}

		devices = append(devices, device)
	}

	return devices, nil
}

func DeleteDevice(
	ctx context.Context,
	db *sql.DB,
	deviceId string,
) (models.Device, error) {
	var deletedDevice models.Device

	row := db.QueryRowContext(
		ctx,
		"DELETE FROM devices WHERE device_id=$1 RETURNING device_id, user_id, status,battery_level, last_synced_at, paired_at",
		deviceId,
	)

	err := row.Scan(
		&deletedDevice.DeviceId,
		&deletedDevice.UserId,
		&deletedDevice.Status,
		&deletedDevice.BatteryLevel,
		&deletedDevice.LastSyncTime,
		&deletedDevice.PairedTime,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return deletedDevice, ErrNoDevice
		}
		return deletedDevice, fmt.Errorf(
			"error scanning returned row after deleting device: %v",
			err,
		)
	}

	_, err = GetDeviceById(ctx, db, deviceId)
	if errors.Is(err, ErrNoDevice) {
		return deletedDevice, nil
	}

	return deletedDevice, fmt.Errorf(
		"error getting device after deleting: %v",
		err,
	)
}
