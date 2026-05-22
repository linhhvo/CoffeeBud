ALTER TABLE pet_states
    DROP COLUMN avatar_id;

ALTER TABLE pet_states
    ADD COLUMN device_id          varchar(50),
    ADD COLUMN happy_avatar_url   text,
    ADD COLUMN neutral_avatar_url text,
    ADD COLUMN sad_avatar_url     text;

ALTER TABLE activity_events
    DROP CONSTRAINT activity_events_device_id_fkey;