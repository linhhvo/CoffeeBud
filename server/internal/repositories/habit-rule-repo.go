package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
)

func GetHabitRuleByUser(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
) (models.HabitRule, error) {
	var rule models.HabitRule

	row := db.QueryRowContext(
		ctx,
		"SELECT * FROM habit_rules WHERE user_id = $1",
		userId,
	)
	err := row.Scan(
		&rule.UserId,
		&rule.WaterIntakeGoal,
		&rule.CoffeeLimit,
		&rule.BreakInterval,
	)
	if err != nil {
		return rule, err
	}

	return rule, nil
}

func GetHabitRuleByDevice(
	ctx context.Context,
	db *sql.DB,
	deviceId string,
) (models.HabitRule, error) {
	var rule models.HabitRule

	var userId uuid.UUID

	err := db.QueryRowContext(
		ctx,
		"SELECT user_id FROM devices WHERE device_id = $1",
		deviceId,
	).Scan(&userId)
	if errors.Is(err, sql.ErrNoRows) {
		return rule, ErrNoDevice
	}

	return GetHabitRuleByUser(ctx, db, userId)
}

func AddDefaultHabitRule(
	ctx context.Context,
	db *sql.DB,
	userId uuid.UUID,
) error {
	var id uuid.UUID
	err := db.QueryRowContext(
		ctx,
		"INSERT INTO habit_rules (user_id) VALUES ($1) RETURNING user_id",
		userId,
	).Scan(&id)
	if err != nil {
		return err
	}
	return nil
}

func UpdateHabitRule(
	ctx context.Context,
	db *sql.DB,
	data models.HabitRule,
) (models.HabitRule, error) {
	var rule models.HabitRule

	row := db.QueryRowContext(
		ctx,
		"UPDATE habit_rules SET water_intake_goal=$1, coffee_limit=$2, break_interval_minutes=$3 WHERE user_id=$4 RETURNING user_id, water_intake_goal, coffee_limit, break_interval_minutes",
		data.WaterIntakeGoal,
		data.CoffeeLimit,
		data.BreakInterval,
		data.UserId,
	)

	err := row.Scan(
		&rule.UserId,
		&rule.WaterIntakeGoal,
		&rule.CoffeeLimit,
		&rule.BreakInterval,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			row := db.QueryRowContext(
				ctx,
				"INSERT INTO habit_rules (user_id, water_intake_goal, coffee_limit, break_interval_minutes) VALUES ($1, $2, $3, $4) RETURNING user_id, water_intake_goal, coffee_limit, break_interval_minutes",
				data.UserId,
				data.WaterIntakeGoal,
				data.CoffeeLimit,
				data.BreakInterval,
			)

			err = row.Scan(
				&rule.UserId,
				&rule.WaterIntakeGoal,
				&rule.CoffeeLimit,
				&rule.BreakInterval,
			)
			if err != nil {
				return rule, err
			}
		}
		return rule, err
	}

	return rule, nil
}
