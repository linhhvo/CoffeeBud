package main

import (
	"coffee-bud/internal/database"
	"coffee-bud/internal/handlers"
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/validators"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
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
	api := router.Group("/api")

	// user authentication from client
	api.POST("/auth/register", handlers.RegisterUserHandler(db))
	api.POST("/auth/login", handlers.UserLogInHandler(db))
	api.POST("/auth/logout", handlers.UserLogOutHandler())

	// receive device information from physical device
	api.POST("/devices", handlers.UpdateDeviceHandler(db))

	// receive activity events from physical device
	api.POST("/activities", handlers.AddActivityHandler(db))
	// api.GET("/activities", handlers.GetAllActivitiesHandler(db))

	// endpoints that require token from client
	api.Use(middleware.Authenticate())
	{
		// connect a device to user account
		api.POST("/devices/pair", handlers.PairDeviceHandler(db))

		// disconnect a device from user account
		api.DELETE("/devices/:deviceId", handlers.RemoveDeviceHandler(db))

		// retrieve activity events for specific user account
		api.GET("/activities", handlers.GetActivitiesByUserHandler(db))
		// api.GET(
		// 	"/users/:userId/activities",
		// 	handlers.GetActivitiesByUserHandler(db),
		// )
	}

	err := router.Run(":8080")
	if err != nil {
		fmt.Printf("error running router: %v", err.Error())
		return
	}
}
