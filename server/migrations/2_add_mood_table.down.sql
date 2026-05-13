DROP TABLE IF EXISTS pet_mood_history;

ALTER TABLE activity_events
    DROP COLUMN interval_since_last;

ALTER TABLE configs
    DROP COLUMN wakeup_time,
    DROP COLUMN sleep_time;

ALTER TABLE configs
    RENAME TO habit_rules;