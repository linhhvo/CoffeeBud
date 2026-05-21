ALTER TABLE pet_states
    DROP COLUMN device_id;

ALTER TABLE activity_events
    ADD CONSTRAINT device_id FOREIGN KEY (device_id) REFERENCES devices (device_id);