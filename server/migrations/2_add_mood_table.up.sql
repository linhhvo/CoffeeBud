CREATE TABLE IF NOT EXISTS pet_mood_history
(
    user_id   uuid NOT NULL REFERENCES users (user_id),
    mood      varchar(50),
    timestamp timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE activity_events
    ADD COLUMN interval_since_last int;

ALTER TABLE habit_rules
    RENAME TO configs;

ALTER TABLE configs
    ADD wakeup_time time,
    ADD sleep_time  time;