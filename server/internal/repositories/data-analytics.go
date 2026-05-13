package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"fmt"
	"log"
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

	config, err := GetConfigByUser(ctx, db, userId)
	if err != nil {
		return stat, fmt.Errorf("error geting config for this user: %v", err)
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
			intervalSum += b.IntervalSeconds
		}
		stat.Break = intervalSum / len(breaks)
	} else { // if there are no break activities, calculate the interval since wakeup time only
		if time.Now().After(startTime) {
			stat.Break = int(time.Now().Sub(startTime).Seconds())
		} else {
			stat.Break = 0
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
			intervalSum += w.IntervalSeconds
		}
		stat.Water = intervalSum / len(waters)
	} else { // if there are no water activities, calculate the interval since wakeup time only
		if time.Now().After(startTime) {
			stat.Water = int(time.Now().Sub(startTime).Seconds())
		} else {
			stat.Water = 0
		}
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
