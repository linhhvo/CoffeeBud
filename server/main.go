package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"slices"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
)

var db *sql.DB

type User struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type Device struct {
	DeviceId     string    `json:"device_id" binding:"required"`
	BatteryLevel int       `json:"battery_level"`
	LastSyncTime time.Time `json:"last_sync_time"`
}

type AcitivityEvent struct {
	DeviceId   string    `json:"device_id" binding:"required"`
	ActionType string    `json:"action_type" binding:"required,validActionType"`
	Timestamp  time.Time `json:"time" binding:"required"`
}

var validActionType validator.Func = func(fl validator.FieldLevel) bool {
	validTypes := []string{"coffee", "water", "break"}

	actionType, ok := fl.Field().Interface().(string)
	if ok {
		if !slices.Contains(validTypes, actionType) {
			return false
		}
	}
	return true
}

func main() {
	/** DATABASE **/
	db_url := os.Getenv("APP_POSTGRES_URL")

	var err error

	db, err = sql.Open("postgres", db_url)

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

	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("validActionType", validActionType)
	}

	router.POST("/activity", addActivity)
	router.POST("/signup", addUser)

	router.Run(":8080")
}

func addUser(c *gin.Context) {
	var json User

	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	result, err := db.Exec("insert into users (username, password) values ($1, $2)", json.Username, json.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	c.JSON(http.StatusOK, gin.H{"status": "user added", "new id": id})

}

func addActivity(c *gin.Context) {
	var json AcitivityEvent

	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userId, err := getUser(json.DeviceId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	result, err := db.Exec("insert into activity_events (device_id, user_id, action_type, time) values ($1, $2, $3, $4)", json.DeviceId, userId, json.ActionType, json.Timestamp)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := result.LastInsertId()

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return

	}

	c.JSON(http.StatusOK, gin.H{"status": "activity added", "new id": id})

}

func getUser(deviceId string) (string, error) {
	var userId string
	row := db.QueryRow("select user_id from devices where device_id = $1", deviceId)

	if err := row.Scan(&userId); err != nil {
		if err == sql.ErrNoRows {
			return userId, fmt.Errorf("can't find user for device %s", deviceId)
		}
		return userId, fmt.Errorf("error getting user for device: %v", err.Error())
	}
	return userId, nil
}
