package repositories

import (
	"coffee-bud/internal/models"
	"coffee-bud/internal/utils"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
)

func AddDefaultPet(ctx context.Context, db *sql.DB, userId uuid.UUID) error {
	_, err := db.ExecContext(
		ctx,
		"INSERT INTO pet_states (user_id, happy_avatar_url, neutral_avatar_url, sad_avatar_url) VALUES ($1, $2, $3, $4)",
		userId,
		"https://coffeebud-assets.linhvo.me/default-happy.bmp",
		"https://coffeebud-assets.linhvo.me/default-neutral.bmp",
		"https://coffeebud-assets.linhvo.me/default-sad.bmp",
	)
	if err != nil {
		return err
	}
	return nil
}

func AssignDeviceToPet(ctx context.Context, db *sql.DB, deviceId string, userId uuid.UUID) error {
	_, err := db.ExecContext(
		ctx,
		"UPDATE pet_states SET device_id=$1, last_updated=CURRENT_TIMESTAMP WHERE user_id = $2",
		deviceId,
		userId,
	)
	if err != nil {
		return err
	}
	return nil
}

func RemoveDeviceFromPet(ctx context.Context, db *sql.DB, deviceId string, userId uuid.UUID) error {
	_, err := db.ExecContext(
		ctx,
		"UPDATE pet_states SET device_id = NULL, last_updated=CURRENT_TIMESTAMP WHERE user_id=$1 AND device_id=$2",
		userId,
		deviceId,
	)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	return nil
}

// CalculateMood calculate pet mood after data sync
func CalculateMood(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	targetTime time.Time,
) (models.DailyStats, error) {
	var stat models.DailyStats

	stat.Date = targetTime

	// get user habit rules
	config, err := GetConfigByUser(ctx, db, userId)
	if err != nil {
		return stat, err
	}

	startTime := utils.GetDateTime(targetTime, config.WakeUpTime, config.Timezone)
	endTime := utils.GetDateTime(targetTime, config.SleepTime, config.Timezone)

	// if attemp to calculate mood before start of the day, return because there is no data to calculate
	if time.Now().Before(startTime) {
		return stat, nil
	}

	if time.Now().Before(endTime) {
		endTime = time.Now()
	}

	// stores each habit rule state: true if goal is met and false if goal is not met
	states := make(map[string]bool)

	// check coffee intake
	coffeeActivities, err := GetActivitiesByTypeTime(ctx, db, userId, "coffee", startTime, endTime)
	if err != nil {
		return stat, err
	}
	states["coffee"] = len(coffeeActivities) <= config.CoffeeLimit
	stat.Coffee = len(coffeeActivities)

	// check avg break interval
	avgBreakInterval := CalculateAvgInterval(ctx, db, userId, "break", startTime, endTime)
	if avgBreakInterval != nil {
		states["break"] = *avgBreakInterval <= config.BreakInterval
		stat.Break = avgBreakInterval
	} else {
		states["break"] = false
	}

	// check avg water interval
	avgWaterInterval := CalculateAvgInterval(ctx, db, userId, "water", startTime, endTime)
	if avgWaterInterval != nil {
		states["water"] = *avgWaterInterval <= config.WaterInterval
		stat.Water = avgWaterInterval
	} else {
		states["water"] = false
	}

	count := 0
	for _, v := range states {
		if !v {
			count++
		}
	}

	switch count {
	case 0:
		stat.Mood = "happy"
	case 3:
		stat.Mood = "sad"
	default:
		stat.Mood = "neutral"
	}

	return stat, nil
}

func UpdateMood(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	targetTime time.Time,
) (models.PetState, models.DailyStats, error) {
	var pet models.PetState

	stat, err := CalculateMood(ctx, db, userId, targetTime)
	if err != nil {
		return pet, stat, fmt.Errorf("error calculating mood: %v", err)
	}

	row := db.QueryRowContext(
		ctx,
		"UPDATE pet_states SET current_mood=$1, last_updated=CURRENT_TIMESTAMP WHERE user_id=$2 RETURNING user_id, current_mood, last_updated",
		stat.Mood,
		userId,
	)

	err = row.Scan(&pet.UserId, &pet.Mood, &pet.LastUpdateTime)
	if err != nil {
		return pet, stat, fmt.Errorf("error updating pet mood: %v", err)
	}

	_, err = db.ExecContext(
		ctx,
		"INSERT INTO pet_mood_history (user_id, mood) VALUES ($1, $2)",
		userId,
		stat.Mood,
	)
	if err != nil {
		return pet, stat, fmt.Errorf("error adding mood to history: %v", err)

	}

	return pet, stat, nil
}

func GetPetAvatarByDevice(ctx context.Context, db *sql.DB, deviceId string, mood string) (string, error) {
	var url string

	moods := []string{"happy", "neutral", "sad"}

	if !slices.Contains(moods, mood) {
		return "", errors.New("invalid mood")
	}

	dbField := mood + "_avatar_url"
	query := fmt.Sprintf("SELECT %s FROM pet_states WHERE device_id =$1", dbField)

	row := db.QueryRowContext(ctx, query, deviceId)

	err := row.Scan(&url)
	if err != nil {
		if strings.Contains(err.Error(), "Scan error on column index 0") {
			return "", fmt.Errorf("%s avatar is not set", mood)
		}

		if strings.Contains(err.Error(), "no rows in result set") {
			return "", fmt.Errorf("device is not assigned to a pet")
		}
		return "", err
	}

	return url, nil
}

func UpdatePetAvatars(ctx context.Context, db *sql.DB, pet models.PetState) error {
	result, err := db.ExecContext(
		ctx,
		"UPDATE pet_states SET happy_avatar_url = $1, neutral_avatar_url = $2, sad_avatar_url = $3, last_updated=CURRENT_TIMESTAMP WHERE user_id=$4",
		pet.HappyAvatarUrl,
		pet.NeutralAvatarUrl,
		pet.SadAvatarUrl,
		pet.UserId,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return errors.New("no pet updated")
	}

	if rows != 1 {
		return fmt.Errorf("expected single row affected, got %d rows affected", rows)
	}

	return nil
}

func GetPetAvatars(ctx context.Context, db *sql.DB, userId uuid.UUID) (models.PetState, error) {
	var pet models.PetState

	row := db.QueryRowContext(ctx, "SELECT * FROM pet_states WHERE user_id = $1", userId)

	err := row.Scan(
		&pet.UserId,
		&pet.Mood,
		&pet.LastUpdateTime,
		&pet.DeviceId,
		&pet.HappyAvatarUrl,
		&pet.NeutralAvatarUrl,
		&pet.SadAvatarUrl,
	)
	if err != nil {
		return pet, err
	}

	return pet, nil
}
