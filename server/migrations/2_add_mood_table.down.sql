DROP TABLE IF EXISTS pet_mood_history;

ALTER TABLE activity_events
    DROP COLUMN interval_since_last;