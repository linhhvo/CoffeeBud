package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	websocketServer "coffee-bud/internal/websocket"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UpdateDeviceHandler(hub *websocketServer.Hub, db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var json models.Device

		if err := c.ShouldBindJSON(&json); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		// check if device is already in the system
		device, err := repositories.GetDevice(
			ctx,
			db,
			json.DeviceId,
		)

		if err != nil {
			if errors.Is(
				err,
				repositories.ErrNoDevice,
			) {
				// if device is not paired, display device on client side for pairing
				hub.Broadcast <- models.WebSocketPayload{
					Event: "new-device",
					Data:  json.DeviceId,
				}

				middleware.SuccessResponse(
					c,
					202,
					fmt.Sprintf(
						"device %s is available for pairing",
						json.DeviceId,
					),
				)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		// if device is already paired
		device, err = repositories.UpdateDevice(
			ctx,
			db,
			json,
		)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		middleware.SuccessResponse(c, 201, device)
	}
}

func PairDeviceHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var json models.Device

		if err := c.ShouldBindJSON(&json); err != nil {
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

		json.UserId = userId.(uuid.UUID)

		pairing, err := repositories.AddDevice(ctx, db, json)
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

		deviceId := c.Param("deviceId")

		device, err := repositories.DeleteDevice(ctx, db, deviceId)
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
