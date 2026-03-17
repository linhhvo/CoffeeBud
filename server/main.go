package main

import (
	"database/sql"
	"log"
	// "net/http"
	"os"

	// "github.com/gin-gonic/gin"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
)

func main() {
	db_url := os.Getenv("POSTGRES_URL")

	db, err := sql.Open("postgres", db_url)

	if err != nil {
		log.Fatalf("error connecting to database:\n%s", err)
	}

	// defer func() {
	// 	if err := db.Close(); err != nil {
	// 		log.Fatal("error closing database")
	// 	}
	// }()

	pingErr := db.Ping()
	if pingErr != nil {
		log.Fatalf("can't ping db:\n%s", err)
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})

	if err != nil {
		log.Fatalf("error configuring driver:\n%s", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://./migrations",
		"postgres", driver)

	if err != nil {
		log.Fatalf("error migrating:\n%s", err)
	}

	err = m.Up()

	if err != nil {
		log.Fatalf("error migrating db:\n%s", err)
	}

	// router := gin.Default()
	//
	// router.GET("/test", func(c *gin.Context) {
	// 	c.String(http.StatusOK, "test GET message")
	// })
	//
	// router.Run(":8080")
}
