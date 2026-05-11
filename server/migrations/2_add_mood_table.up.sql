CREATE TABLE IF NOT EXISTS pet_mood_history
(
    user_id   uuid NOT NULL REFERENCES users (user_id),
    mood      varchar(50),
    timestamp timestamptz DEFAULT CURRENT_TIMESTAMP
);