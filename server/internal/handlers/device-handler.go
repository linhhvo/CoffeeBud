package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	websocketServer "coffee-bud/internal/websocket"
	"database/sql"
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func AddDeviceHandler(hub *websocketServer.Hub, db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var data models.Device

		if err := c.ShouldBindUri(&data); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		if err := c.ShouldBindQuery(&data); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		// check if device is already in the system
		_, err := repositories.GetDevice(ctx, db, data.DeviceId)

		if err != nil {
			if errors.Is(err, repositories.ErrNoDevice) {
				// if device is not paired, display device on client side for pairing
				hub.Broadcast <- models.WebSocketPayload{
					EventType: "NEW_DEVICE",
					EventData: data,
				}

				middleware.SuccessResponse(
					c,
					202,
					data.DeviceId,
				)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		// if device is already paired
		data.Status = "confirmed"
		hub.Broadcast <- models.WebSocketPayload{
			EventType: "DEVICE_PAIRED",
			EventData: data,
		}
		_, err = repositories.UpdateDevice(ctx, db, data)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, 201, data)
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

		log.Println("device id: \"", device.DeviceId, "\"")

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
