ALTER TABLE configs
    ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';