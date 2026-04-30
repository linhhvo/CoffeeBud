package main

import (
	"coffee-bud/internal/database"
	"coffee-bud/internal/handlers"
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/session"
	"coffee-bud/internal/validators"
	"coffee-bud/internal/websocket"
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

	api := router.Group("/api")

	/** ROUTES FOR PHYSICAL DEVICE INTERACTION **/
	api.POST("/sync/:deviceId", handlers.AddDeviceHandler(wsHub, db)) // pair new device
	api.PUT("/sync/:deviceId", handlers.SyncDataHandler(db))

	/** ROUTES FOR CLIENT INTERACTION **/
	// websocket endpoint
	router.GET(
		"/ws",
		middleware.Authenticate(),
		websocketServer.WebSocketHandler(wsHub),
	)

	api.POST("/auth/register", handlers.RegisterUserHandler(db))
	api.POST("/auth/login", handlers.UserLogInHandler(db))
	api.POST("/auth/logout", handlers.UserLogOutHandler())

	// endpoints that require token from client
	api.Use(middleware.Authenticate())
	{
		// connect a device to user account
		api.POST("/devices/pair/:deviceId", handlers.PairDeviceHandler(db))

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
