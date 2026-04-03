package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	UserId      uuid.UUID `json:"user_id"`
	Username    string    `json:"username" binding:"required"`
	Password    string    `json:"password" binding:"required"`
	CreatedTime time.Time `json:"created_at"`
}

type Device struct {
	DeviceId     string    `json:"device_id" binding:"required"`
	UserId       uuid.UUID `json:"user_id"`
	BatteryLevel int       `json:"battery_level"`
	LastSyncTime time.Time `json:"last_sync_time"`
	PairedTime   time.Time `json:"paired_time"`
}

type AcitivityEvent struct {
	DeviceId   string    `json:"device_id" binding:"required"`
	UserId     uuid.UUID `json:"user_id"`
	ActionType string    `json:"action_type" binding:"required,validActionType"`
	Timestamp  string    `json:"timestamp" binding:"required"`
}

type HabitRule struct {
	UserId          uuid.UUID `json:"user_id"`
	DeviceId        string    `json:"device_id"`
	WaterIntakeGoal int       `json:"water_intake_goal"`
	CoffeeLimit     int       `json:"coffee_limit"`
	BreakInterval   int       `json:"break_interval"`
}
