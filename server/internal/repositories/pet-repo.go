package repositories

import (
	"coffee-bud/internal/models"
	"context"
	"database/sql"
	"fmt"

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
