package database

import (
	"database/sql"
	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
	"log"
	"os"
)

func ConnectDatabase() *sql.DB {
	var db *sql.DB
	db_url := os.Getenv("APP_POSTGRES_URL")

	var err error

	db, err = sql.Open("postgres", db_url)

	if err != nil {
		log.Fatalf("error connecting to database:\n%s", err)
	}

	pingErr := db.Ping()
	if pingErr != nil {
		log.Fatalf("can't ping db:\n%s", err)
	}

	return db
}
