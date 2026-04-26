package main

import (
	"coffee-bud/internal/database"
	"coffee-bud/internal/handlers"
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/session"
	"coffee-bud/internal/validators"
	websocketServer "coffee-bud/internal/websocket"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("./.env", "../.env"); err != nil {
		log.Fatalf("error loading environments: %v", err.Error())
	}

	session.Init()

	/** DATABASE CONNECTION **/
	db := database.ConnectDatabase()
	defer func() {
		if err := db.Close(); err != nil {
			log.Fatalf("error closing database:\n%v", err.Error())
		}
	}()

	/** WEBSOCKET  **/
	wsHub := websocketServer.NewHub()
	go wsHub.HandleMessage()

	/** API **/
	// gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	router.Use(middleware.ErrorHandler())

	validators.ConfigCustomValidators()

	// websocket endpoint
	router.GET(
		"/ws",
		middleware.Authenticate(),
		websocketServer.WebSocketHandler(wsHub),
	)

	api := router.Group("/api")

	// user authentication from client
	api.POST("/auth/register", handlers.RegisterUserHandler(db))
	api.POST("/auth/login", handlers.UserLogInHandler(db))
	api.POST("/auth/logout", handlers.UserLogOutHandler())

	// receive device information from physical device
	api.POST("/devices", handlers.UpdateDeviceHandler(wsHub, db))

	// receive activity events from physical device
	api.POST("/activities", handlers.AddActivityHandler(db))
	// api.GET("/activities", handlers.GetAllActivitiesHandler(db))

	api.POST("/sync", handlers.SyncDataHandler(db))

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

		// retrieve habit rules for specific user account
		api.GET("/habit-rules", handlers.GetHabitRuleByUserHandler(db))

		// update habit rules
		api.POST("/habit-rules", handlers.UpdateHabitRuleHandler(db))
	}

	if err := router.Run(":8080"); err != nil {
		fmt.Printf("error running router: %v", err.Error())
		return
	}
}
