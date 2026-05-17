package repositories

import (
	"coffee-bud/internal/models"
	"coffee-bud/internal/utils"
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

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
		weekStat[i], err = CalculateMood(ctx, db, userId, d)
		if err != nil {
			return weekStat, fmt.Errorf("error getting stat for %s: %v", d.Weekday(), err)
		}
	}
	return weekStat, nil
}

func CalculateAvgInterval(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	activityType string,
	startTime time.Time,
	endTime time.Time,
) *int {
	activities, err := GetActivitiesByTypeTime(ctx, db, userId, activityType, startTime, endTime)
	if err != nil {
		return nil
	}

	avgInterval := new(int)
	intervalSum := 0
	// if there are activities, add up the intervals to calculate average
	if len(activities) > 0 {
		for _, a := range activities {
			intervalSum += a.IntervalMinutes
		}
		// add the interval from the last activity to end time
		intervalSum += int(endTime.Sub(activities[0].Timestamp).Minutes())
		*avgInterval = intervalSum / (len(activities) + 1)

	} else {
		// if there are no activities, calculate the interval since wakeup time
		if utils.IsSameDate(time.Now(), endTime) && time.Now().Before(endTime) {
			log.Println("start time ", startTime)
			*avgInterval = int(time.Since(startTime).Minutes())
		} else {
			avgInterval = nil
		}
	}

	return avgInterval
}
