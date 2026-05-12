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
	DeviceId     string     `uri:"deviceId" json:"device_id" binding:"required"`
	UserId       uuid.UUID  `json:"user_id"`
	Status       string     `json:"status"`
	BatteryLevel int        `form:"battery" json:"battery_level"`
	LastSyncTime *time.Time `json:"last_sync_time"`
	PairedTime   *time.Time `json:"paired_time"`
}

type ActivityEvent struct {
	DeviceId        string    `uri:"deviceId" json:"device_id"`
	UserId          uuid.UUID `json:"user_id"`
	ActivityType    string    `json:"type" binding:"required,oneof=water coffee break"`
	Timestamp       time.Time `json:"timestamp" binding:"required"`
	IntervalSeconds int       `json:"interval_since_last"`
}

type HabitRule struct {
	UserId         uuid.UUID `json:"user_id"`
	DeviceId       string    `json:"device_id"`
	WaterInterval  int       `json:"water_interval"`
	CoffeeLimit    int       `json:"coffee_limit"`
	BreakInterval  int       `json:"break_interval"`
	LastUpdateTime time.Time `json:"last_update_time"`
}

type PetState struct {
	UserId         uuid.UUID `json:"user_id"`
	AvatarUrl      string    `json:"avatar_url"`
	Mood           string    `json:"mood" binding:"oneof=happy neutral sad"`
	LastUpdateTime time.Time `json:"last_update_time"`
}

type WebSocketPayload struct {
	EventType string `json:"event_type"`
	EventData any    `json:"event_data"`
}
