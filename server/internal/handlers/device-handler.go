package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	websocketServer "coffee-bud/internal/websocket"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func AddDeviceHandler(hub *websocketServer.Hub, db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var device models.Device

		// Bind device ID
		if err := c.ShouldBindUri(&device); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		// Bind battery level
		if err := c.ShouldBindQuery(&device); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		// check if device is already in the system
		_, err := repositories.GetDeviceById(ctx, db, device.DeviceId)

		if err != nil {
			if errors.Is(err, repositories.ErrNoDevice) {
				// if device is not paired, display device on client side for pairing
				hub.Broadcast <- models.WebSocketPayload{
					EventType: "NEW_DEVICE",
					EventData: device,
				}

				middleware.SuccessResponse(
					c,
					202,
					device.DeviceId,
				)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		// if device is already paired
		device.Status = "confirmed"
		device, err = repositories.UpdateDevice(ctx, db, device)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		hub.Broadcast <- models.WebSocketPayload{
			EventType: "DEVICE_PAIRED",
			EventData: device,
		}

		middleware.SuccessResponse(c, 201, device)
	}
}

func PairDeviceHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var data models.Device

		if err := c.ShouldBindUri(&data); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		data.UserId = userId.(uuid.UUID)

		pairing, err := repositories.AddDevice(ctx, db, data)
		if err != nil {
			c.Status(http.StatusNotFound)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, 201, pairing)
	}
}

func RemoveDeviceHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		var device models.Device

		if err := c.ShouldBindUri(&device); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		log.Println("remove device \"", device.DeviceId, "\"")

		device, err := repositories.DeleteDevice(ctx, db, device.DeviceId)
		if err != nil {
			if errors.Is(err, repositories.ErrNoDevice) {
				c.Status(http.StatusNotFound)
				c.Error(errors.New("can't find device to remove"))
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, 200, device)
	}

}

func GetDevicesByUser(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		userId, exists := c.Get("userId")
		if !exists {
			c.Status(http.StatusUnauthorized)
			c.Error(errors.New("invalid user"))
			return
		}

		devices, err := repositories.GetDeviceByUser(ctx, db, userId.(uuid.UUID))
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("can't retrieve device list: %v", err))
			return
		}

		middleware.SuccessResponse(c, 200, devices)
	}
}
