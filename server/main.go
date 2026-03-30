package main

import (
	"coffee-bud/internal/database"
	"coffee-bud/internal/handlers"
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/validators"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	/** DATABASE CONNECTION **/
	db := database.ConnectDatabase()
	defer func() {
		if err := db.Close(); err != nil {
			log.Fatalf("error closing database:\n%v", err.Error())
		}
	}()

	/** API **/
	// gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	router.Use(middleware.ErrorHandler())

	validators.ConfigCustomValidators()

	router.POST("/api/auth/register", handlers.CreateUserHandler(db))
	router.POST("/api/auth/login", handlers.GetUserHandler(db))

	router.POST("/api/devices", handlers.UpdateDeviceHandler(db))
	router.POST("/api/devices/pair", handlers.PairDeviceHandler(db))
	router.DELETE("/api/devices/:deviceId", handlers.RemoveDeviceHandler(db))

	router.POST("/api/activities", handlers.AddActivityHandler(db))
	router.GET("/api/activities", handlers.GetAllActivitiesHandler(db))
	router.GET(
		"/api/users/:userId/activities",
		handlers.GetActivitiesByUserHandler(db),
	)

	err := router.Run(":8080")
	if err != nil {
		fmt.Printf("error running router: %v", err.Error())
		return
	}
}
