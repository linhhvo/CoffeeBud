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

func GetDailyStat(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	targetTime time.Time,
) (models.DailyStats, error) {
	var stat models.DailyStats
	stat.Break = new(int)
	stat.Water = new(int)

	config, err := GetConfigByUser(ctx, db, userId)
	if err != nil {
		return stat, fmt.Errorf("error geting config for this user: %v", err)
	}

	startTime := utils.GetDateTime(targetTime, config.WakeUpTime)
	endTime := utils.GetDateTime(targetTime, config.SleepTime)

	stat.UserId = userId
	stat.Date = targetTime

	// get total coffee intake in the given date
	coffee, err := GetActivitiesByTypeTime(ctx, db, userId, "coffee", startTime, endTime)
	if err != nil {
		return stat, err
	}
	stat.Coffee = len(coffee)

	// get average break interval
	breaks, err := GetActivitiesByTypeTime(ctx, db, userId, "break", startTime, endTime)
	if err != nil {
		return stat, err
	}

	intervalSum := 0
	// if there are break activities, add up the intervals to calculate average
	if len(breaks) > 0 {
		for _, b := range breaks {
			intervalSum += b.IntervalSeconds / 60
		}
		*stat.Break = intervalSum / len(breaks)
	} else { // if there are no break activities, calculate the interval since wakeup time only
		if time.Now().After(startTime) {
			stat.Break = nil
		} else {
			*stat.Break = 0
		}
	}

	// get average break interval
	waters, err := GetActivitiesByTypeTime(ctx, db, userId, "water", startTime, endTime)
	if err != nil {
		return stat, err
	}
	intervalSum = 0
	// if there are water activities, add up the intervals to calculate average
	if len(waters) > 0 {
		for _, w := range waters {
			intervalSum += w.IntervalSeconds / 60
		}
		*stat.Water = intervalSum / len(waters)
	} else { // if there are no water activities, calculate the interval since wakeup time only
		if time.Now().After(startTime) {
			stat.Water = nil
		} else {
			*stat.Water = 0
		}
	}

	pet, err := CalculateMood(ctx, db, userId, targetTime)
	if err != nil {
		return stat, err
	}
	stat.Mood = pet.Mood

	return stat, nil
}

func GetWeeklyStat(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	targetDate time.Time,
) ([]models.DailyStats, error) {
	weekStat := make([]models.DailyStats, 7)
	week := utils.GetWeekDates(targetDate)

	for i, d := range week {
		var err error
		weekStat[i], err = GetDailyStat(ctx, db, userId, d)
		if err != nil {
			return weekStat, fmt.Errorf("error getting stat for %s: %v", d.Weekday(), err)
		}
	}
	return weekStat, nil

}
