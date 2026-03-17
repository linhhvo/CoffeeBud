CREATE TABLE IF NOT EXISTS users(
    user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar (50) UNIQUE NOT NULL,
    PASSWORD varchar (50) NOT NULL
);

CREATE TABLE IF NOT EXISTS devices(
    device_id varchar(50) PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    battery_level smallint,
    last_synced_at timestamp
);

CREATE TABLE IF NOT EXISTS habit_rules(
    user_id uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    water_intake_goal smallint DEFAULT 10,
    coffee_limit smallint DEFAULT 10,
    break_interval_minutes smallint DEFAULT 120
);

CREATE TABLE IF NOT EXISTS pet_states(
    user_id uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    avatar_id varchar(50) DEFAULT 'default_avatar',
    current_mood varchar(50) DEFAULT 'happy'
);

CREATE TABLE activity_events (
    time timestamp NOT NULL,
    user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_id varchar(50) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    action_type varchar(50) NOT NULL
);

SELECT
    create_hypertable('activity_events', 'time');
