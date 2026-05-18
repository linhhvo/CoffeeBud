package repositories

import (
	"coffee-bud/internal/models"
	"coffee-bud/internal/utils"
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

func AddDefaultPet(ctx context.Context, db *sql.DB, userId uuid.UUID) error {
	_, err := db.ExecContext(ctx, "INSERT INTO pet_states (user_id) VALUES ($1)", userId)
	if err != nil {
		return err
	}
	return nil

}

// calculate pet mood after data sync

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
		"UPDATE pet_states SET current_mood=$1, last_updated=CURRENT_TIMESTAMP WHERE user_id=$2 RETURNING user_id, avatar_id, current_mood, last_updated",
		stat.Mood,
		userId,
	)

	err = row.Scan(&pet.UserId, &pet.AvatarUrl, &pet.Mood, &pet.LastUpdateTime)
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
