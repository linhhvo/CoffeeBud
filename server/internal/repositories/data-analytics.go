package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// calculate pet mood after data sync

func CalculateMood(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
) (models.PetState, error) {
	var pet models.PetState

	// stores each habit rule state: true if goal is met and false if goal is not met
	states := make(map[string]bool)

	// time period is the current date
	now := time.Now()
	startTime := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// get user habit rules
	rules, err := GetHabitRuleByUser(ctx, db, userId)

	// check coffee intake
	coffeeActivities, err := GetActivitiesByTypeTime(ctx, db, userId, "coffee", startTime, now)
	if err != nil {
		return pet, err
	}
	states["coffee"] = len(coffeeActivities) < rules.CoffeeLimit

	// check water intake
	waterActivity, err := GetMostRecentActivityByType(ctx, db, "water", userId)
	if err != nil {
		return pet, err
	}
	states["water"] = now.Sub(waterActivity.Timestamp).Minutes() < float64(rules.WaterInterval)

	// check break
	breakActivity, err := GetMostRecentActivityByType(ctx, db, "break", userId)
	if err != nil {
		return pet, err
	}
	states["break"] = now.Sub(breakActivity.Timestamp).Minutes() < float64(rules.BreakInterval)

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
