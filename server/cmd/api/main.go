package main

import (
	"coffee-bud/internal/database"
	"coffee-bud/internal/handlers"
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/r2"
	"coffee-bud/internal/session"
	"coffee-bud/internal/websocket"
	"fmt"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// if err := godotenv.Load("./.env", "../.env"); err != nil {
	// 	log.Fatalf("error loading environments: %v", err.Error())
	// }

	session.Init()
	r2.Init()

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

	router.Use(
		cors.New(
			cors.Config{
				AllowOrigins:     []string{"https://coffeebud-client.fly.dev"},
				AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
				AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
				ExposeHeaders:    []string{"Content-Length"},
				AllowCredentials: true,
				MaxAge:           12 * time.Hour,
			},
		),
	)

	router.Use(middleware.ErrorHandler())

	// validators.ConfigCustomValidators()

	api := router.Group("/api")

	/** ROUTES FOR PHYSICAL DEVICE INTERACTION **/
	api.POST("/sync/:deviceId", handlers.AddDeviceHandler(wsHub, db)) // pair new device
	api.PUT("/sync/:deviceId", handlers.SyncDataHandler(wsHub, db))
	api.GET("/sync/:deviceId/configs", handlers.GetConfigByDeviceHandler(db))
	api.GET("/sync/:deviceId/avatars/:mood", handlers.GetPetAvatarByDevice(db))

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

		// get a list of devices connected to user account
		api.GET("/devices", handlers.GetDevicesByUser(db))

		// retrieve activity events for specific user account
		api.GET("/activities", handlers.GetActivitiesByUserHandler(db))

		// retrieve configs for specific user account
		api.GET("/configs", handlers.GetConfigByUserHandler(db))

		// update configs
		api.POST("/configs", handlers.UpdateConfigHandler(db))

		// get presigned URL for R2 uploads
		api.GET("/pet/avatars/presign", r2.GetR2UrlHandler())

		// update pet avatars
		api.POST("/pet/avatars", handlers.UpdatePetAvatarsHandler(db))

		// get pet avatars
		api.GET("/pet/avatars", handlers.GetPetAvatars(db))

		// get daily stat
		api.GET("/stat/daily", handlers.GetDailyStatHandler(db))

		// get weekly stat
		api.GET("/stat/weekly", handlers.GetWeeklyStatHandler(db))
	}

	if err := router.Run(":8080"); err != nil {
		fmt.Printf("error running router: %v", err.Error())
		return
	}
}
