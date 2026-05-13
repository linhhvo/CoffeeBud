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

func GetDateTime(dataTimestamp time.Time, configTime *time.Time) time.Time {
	return time.Date(
		dataTimestamp.Year(),
		dataTimestamp.Month(),
		dataTimestamp.Day(),
		configTime.Hour(),
		configTime.Minute(), 0, 0,
		dataTimestamp.Location(),
	)
}
