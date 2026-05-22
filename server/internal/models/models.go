package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	UserId      uuid.UUID `json:"user_id"`
	Username    string    `json:"username" binding:"required"`
	Password    string    `json:"password" binding:"required"`
	Timezone    string    `json:"timezone"`
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
	IntervalMinutes int       `json:"interval_since_last"`
}

type Config struct {
	UserId         uuid.UUID  `json:"user_id"`
	DeviceId       string     `json:"device_id"`
	WaterInterval  int        `json:"water_interval"`
	CoffeeLimit    int        `json:"coffee_limit"`
	BreakInterval  int        `json:"break_interval"`
	LastUpdateTime time.Time  `json:"last_update_time"`
	WakeUpTime     *time.Time `json:"wakeup_time"`
	SleepTime      *time.Time `json:"sleep_time"`
	Timezone       string     `json:"timezone"`
	NowTimestamp   time.Time  `json:"now_timestamp" binding:"omitempty"`
}

type PetState struct {
	UserId           uuid.UUID `json:"user_id"`
	DeviceId         *string   `json:"device_id"`
	HappyAvatarUrl   string    `json:"happy_avatar_url"`
	NeutralAvatarUrl string    `json:"neutral_avatar_url"`
	SadAvatarUrl     string    `json:"sad_avatar_url"`
	Mood             string    `json:"mood" binding:"omitempty,oneof=happy neutral sad"`
	LastUpdateTime   time.Time `json:"last_update_time"`
}

type WebSocketPayload struct {
	EventType string `json:"event_type"`
	EventData any    `json:"event_data"`
}

type DailyStats struct {
	UserId uuid.UUID `json:"user_id"`
	Date   time.Time `json:"date"`
	Coffee int       `json:"total_coffee"`       // total number of coffee
	Break  *int      `json:"avg_break_interval"` // average break interval
	Water  *int      `json:"avg_water_interval"` // average water interval
	Mood   string    `json:"avg_mood"`           // average mood
}
