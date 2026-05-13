package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	"coffee-bud/internal/websocket"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func SyncDataHandler(hub *websocketServer.Hub, db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var json []models.ActivityEvent

		var device models.Device

		// bind device Id
		if err := c.ShouldBindUri(&device); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		// bind battery level
		if err := c.ShouldBindQuery(&device); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return

		}
		// check if device is already in the system
		_, err := repositories.GetDeviceById(ctx, db, device.DeviceId)
		if err != nil {
			if errors.Is(err, repositories.ErrNoDevice) {
				c.Status(http.StatusNotFound)
				c.Error(errors.New("device hasn't been claimed by a user"))
				return
			}
			c.Status(http.StatusNotFound)
			c.Error(err)
			return
		}

		// check to see if there are changes to habit rules to notify device
		configChanged, err := repositories.HasPendingConfigChanges(ctx, db, device.DeviceId)

		// update device info
		device, err = repositories.UpdateDevice(ctx, db, device)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		hub.Broadcast <- models.WebSocketPayload{
			EventType: "DEVICE_UPDATED",
			EventData: device,
		}

		// parse list of activities
		if err := c.ShouldBindJSON(&json); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(fmt.Errorf("failed to parse payload data -- %v", err.Error()))
			return
		}

		// add activity events
		for _, data := range json {
			data.DeviceId = device.DeviceId
			err := repositories.AddActivity(ctx, db, data)
			if err != nil {
				c.Status(http.StatusInternalServerError)
				c.Error(fmt.Errorf("failed to add activity -- %v", err.Error()))
				return
			}
		}

		// TODO: get pet mood based on new data
		// this should run every hour whenever data sync happens
		// webapp can either calculate pet mood based on data sent from device
		// or delegate the calculation to device and only store mood history for data analytics
		_, err = repositories.CalculateMood(ctx, db, device.UserId, time.Now())
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		// TODO: get pet name and avatar

		c.Header("Rules-Need-Update", strconv.Itoa(configChanged))
		middleware.SuccessResponse(c, 200, nil)
	}
}
