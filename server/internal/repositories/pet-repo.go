package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

func UpdateMood(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	mood string,
) (models.PetState, error) {

	var pet models.PetState

	row := db.QueryRowContext(
		ctx,
		"UPDATE pet_states SET current_mood=$1, last_updated=CURRENT_TIMESTAMP WHERE user_id=$2 RETURNING user_id, avatar_id, current_mood, last_updated",
		mood,
		userId,
	)

	err := row.Scan(&pet.UserId, &pet.AvatarUrl, &pet.Mood, &pet.LastUpdateTime)
	if err != nil {
		return pet, err
	}

	_, err = db.ExecContext(
		ctx,
		"INSERT INTO pet_mood_history (user_id, mood) VALUES ($1, $2)",
		userId,
		mood,
	)
	if err != nil {
		return pet, fmt.Errorf("error adding mood to history: %v", err)

	}

	return pet, nil
}

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
) (models.PetState, error) {
	var pet models.PetState

	// stores each habit rule state: true if goal is met and false if goal is not met
	states := make(map[string]bool)

	// get user habit rules
	config, err := GetConfigByUser(ctx, db, userId)
	if err != nil {
		return pet, err
	}

	startTime := time.Date(
		targetTime.Year(),
		targetTime.Month(),
		targetTime.Day(),
		config.WakeUpTime.Hour(),
		config.WakeUpTime.Minute(),
		config.WakeUpTime.Second(),
		config.WakeUpTime.Nanosecond(),
		targetTime.Location(),
	)

	endTime := time.Date(
		targetTime.Year(),
		targetTime.Month(),
		targetTime.Day(),
		config.SleepTime.Hour(),
		config.SleepTime.Minute(),
		config.SleepTime.Second(),
		config.SleepTime.Nanosecond(),
		targetTime.Location(),
	)

	// check coffee intake
	coffeeActivities, err := GetActivitiesByTypeTime(ctx, db, userId, "coffee", startTime, endTime)
	if err != nil {
		return pet, err
	}
	states["coffee"] = len(coffeeActivities) < config.CoffeeLimit

	// check water intake
	waterActivity, err := GetLatestActivityByType(ctx, db, "water", userId, targetTime)
	if err != nil {
		// if there is no water recorded during the active period, it fails to meet the target goal
		if errors.Is(err, sql.ErrNoRows) {
			states["water"] = false
		} else {
			return pet, err
		}
	} else {
		states["water"] = (waterActivity.IntervalSeconds / 60) < config.WaterInterval
	}

	// check break
	breakActivity, err := GetLatestActivityByType(ctx, db, "break", userId, targetTime)
	if err != nil {
		// if there is no break recorded during the active period, it fails to meet the target goal
		if errors.Is(err, sql.ErrNoRows) {
			states["break"] = false
		} else {
			return pet, err
		}
	} else {
		states["break"] = (breakActivity.IntervalSeconds / 60) < config.BreakInterval
	}

	count := 0
	for _, v := range states {
		if !v {
			count++
		}
	}

	var mood string
	switch count {
	case 0:
		mood = "happy"
	case 3:
		mood = "sad"
	default:
		mood = "neutral"
	}

	pet, err = UpdateMood(ctx, db, userId, mood)

	return pet, nil
}

func GetMoodsByDate(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	startTime time.Time,
	endTime time.Time,
) ([]string, error) {
	var moods []string

	rows, err := db.QueryContext(
		ctx,
		"SELECT mood FROM pet_mood_history WHERE user_id=$1 AND timestamp >= $2 AND timestamp < $3",
		userId,
		startTime,
		endTime,
	)
	if err != nil {
		return moods, err
	}

	defer rows.Close()

	for rows.Next() {
		var mood string
		err = rows.Scan(&mood)
		if err != nil {
			return moods, fmt.Errorf("error getting mood history: %v", err)
		}
		moods = append(moods, mood)
	}

	if err = rows.Close(); err != nil {
		return moods, fmt.Errorf("error closing mood history database rows: %v", err)
	}

	// last error encountered by Rows.Scan
	if err := rows.Err(); err != nil {
		return moods, err
	}

	return moods, nil
}
