package database

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func ConnectDatabase() *sql.DB {
	var db *sql.DB
	dbUrl := os.Getenv("APP_POSTGRES_URL")

	var err error

	db, err = sql.Open("postgres", dbUrl)

	if err != nil {
		log.Fatalf("error connecting to database:\n%s", err)
	}

	pingErr := db.Ping()
	if pingErr != nil {
		log.Fatalf("can't ping db:\n%s", err)
	}

	return db
}
