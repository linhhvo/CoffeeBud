package utils

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

func GetTimeComponents(timeStr string) ([]int, error) {
	var components []int
	hM := strings.Split(timeStr, ":")

	h, err := strconv.Atoi(hM[0])
	if err != nil {
		return components, fmt.Errorf("error parsing hour: %v", err)
	}
	components = append(components, h)

	m, err := strconv.Atoi(hM[1])
	if err != nil {
		return components, fmt.Errorf("error parsing minute: %v", err)
	}
	components = append(components, m)

	return components, nil
}

func GetDateTime(dataTimestamp time.Time, configTime *time.Time, timezone string) time.Time {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return time.Time{}
	}
	return time.Date(
		dataTimestamp.Year(),
		dataTimestamp.Month(),
		dataTimestamp.Day(),
		configTime.Hour(),
		configTime.Minute(), 0, 0,
		loc,
	)
}

func GetWeekDates(targetDate time.Time) []time.Time {
	weekday := int(targetDate.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday
	}
	monday := targetDate.AddDate(0, 0, -(weekday - 1))

	week := make([]time.Time, 7)
	for i := range week {
		week[i] = monday.AddDate(0, 0, i)
	}
	return week
}

func IsSameDate(a, b time.Time) bool {
	ay, am, ad := a.Date()
	by, bm, bd := b.Date()
	return ay == by && am == bm && ad == bd
}
