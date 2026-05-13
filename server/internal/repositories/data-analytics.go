package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/google/uuid"
)

func GetDailyStat(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
	date time.Time,
) (models.DailyStats, error) {
	var stat models.DailyStats

	startTime := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endTime := startTime.Add(24 * time.Hour)

	stat.UserId = userId
	stat.Date = date

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
	if len(breaks) > 0 {
		for _, b := range breaks {
			intervalSum += b.IntervalSeconds
		}
		stat.Break = intervalSum / len(breaks)
	} else {
		stat.Break = 0
	}

	// get average break interval
	waters, err := GetActivitiesByTypeTime(ctx, db, userId, "water", startTime, endTime)
	if err != nil {
		return stat, err
	}
	intervalSum = 0
	if len(waters) > 0 {
		for _, w := range waters {
			intervalSum += w.IntervalSeconds
		}
		stat.Water = intervalSum / len(waters)
	} else {
		stat.Water = 0
	}

	moods, err := GetMoodsByDate(ctx, db, userId, startTime, endTime)
	if err != nil {
		return stat, err
	}

	moodMap := make(map[string]int)

	for _, m := range moods {
		switch m {
		case "happy":
			moodMap[m] += 3
		case "neutral":
			moodMap[m] += 2
		case "sad":
			moodMap[m] += 1
		}
	}

	moodSum := 0
	for k, v := range moodMap {
		log.Println(k, " - ", v)
		moodSum += v
	}

	avg := float64(moodSum) / float64(len(moods))
	if avg >= 2.5 {
		stat.Mood = "happy"
	} else if avg >= 1.5 {
		stat.Mood = "neutral"
	} else {
		stat.Mood = "sad"
	}

	return stat, nil
}
