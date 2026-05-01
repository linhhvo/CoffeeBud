package database

import (
	"database/sql"
	"errors"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

func ConnectDatabase() *sql.DB {
	dbUrl := os.Getenv("DATABASE_URL")

	migratePath := "file://migrations"
	// migratePath := "file:///usr/local/bin/migrations"

	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatalf("error connecting to database:\n%s", err)
	}

	pingErr := db.Ping()
	if pingErr != nil {
		log.Fatalf("can't ping db before migration:\n%s", err)
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		log.Fatalf("error applying driver for migrations: %s", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		migratePath,
		"postgres",
		driver,
	)
	if err != nil {
		log.Fatalf("error running migrations: %s", err)
	}

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Println("Database up to date.")
			return db
		}
		log.Fatalf("error running migrations: %s", err)
	}

	pingErr = db.Ping()
	if pingErr != nil {
		log.Fatalf("can't ping db after migration:\n%s", err)
	}
	return db
}
