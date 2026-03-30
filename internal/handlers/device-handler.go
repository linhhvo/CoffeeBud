package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

/**
  - device makes a POST request to endpoint /api/devices
    {
    "deviceId": "device123-456",
    "battery_level": 100
    }
  - server receives the request -> check if device is paired
  	- if not paired, send device payload to frontend to list as an available device then return 202
	- if paired, add a new device record to devices table then return 201
		- when user clicks connect, send a POST request to endpoint /api/devices/pair
		{
		"userId": "12312-123423-1231",
		"device":
			{
			"deviceId": "device123-456",
			"battery_level": 100
			}
		}
		- server adds a record to device_user table and add a record to devices table then return 201
		- UI sends a GET request to /api/devices/:username to retrieve the device info
*/

func UpdateDeviceHandler(db *sql.DB) gin.HandlerFunc {
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
			if errors.Is(err, sql.ErrNoRows) { // if device is not paired
				// TODO: send payload to frontend for pairing
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
			if err.Error() == "device not found" {
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
