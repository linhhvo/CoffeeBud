package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	UserId   uuid.UUID `json:"user_id"`
	Username string    `json:"username" binding:"required"`
	Password string    `json:"password" binding:"required"`
}

type Device struct {
	DeviceId     string    `json:"device_id" binding:"required"`
	BatteryLevel int       `json:"battery_level"`
	LastSyncTime time.Time `json:"last_sync_time"`
}

type AcitivityEvent struct {
	DeviceId   string    `json:"device_id" binding:"required"`
	UserId     uuid.UUID `json:"user_id"`
	ActionType string    `json:"action_type" binding:"required,validActionType"`
	Timestamp  time.Time `json:"timestamp" binding:"required"`
}
