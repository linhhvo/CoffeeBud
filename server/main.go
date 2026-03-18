package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
)

func main() {
	/** DATABASE **/
	db_url := os.Getenv("APP_POSTGRES_URL")

	db, err := sql.Open("postgres", db_url)

	if err != nil {
		log.Fatalf("error connecting to database:\n%s", err)
	}

	defer func() {
		if err := db.Close(); err != nil {
			log.Fatal("error closing database")
		}
	}()

	pingErr := db.Ping()
	if pingErr != nil {
		log.Fatalf("can't ping db:\n%s", err)
	}

	/** API **/
	// gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "test GET message")
	})

	router.Run(":8080")
}
