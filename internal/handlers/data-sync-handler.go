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

func SyncDataHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var json models.DataSyncPayload

		if err := c.ShouldBindJSON(&json); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(
				fmt.Errorf(
					"failed to parse payload data -- %v",
					err.Error(),
				),
			)
			return
		}

		// check if device is already in the system
		_, err := repositories.GetDevice(
			ctx,
			db,
			json.DeviceInfo.DeviceId,
		)

		if err != nil {
			// if device is not paired
			if errors.Is(err, repositories.ErrNoDevice) {
				// TODO: send payload to frontend for pairing
				middleware.SuccessResponse(
					c,
					202,
					fmt.Sprintf(
						"device %s is available for pairing",
						json.DeviceInfo.DeviceId,
					),
				)
				return
			}
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		// TODO: add device info
		// if device is already paired
		_, err = repositories.UpdateDevice(
			ctx,
			db,
			json.DeviceInfo,
		)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
		}

		// TODO: add activity events
		for _, data := range json.Activities {
			_, err := repositories.AddActivity(ctx, db, data)
			if err != nil {
				c.Status(http.StatusInternalServerError)
				c.Error(fmt.Errorf("failed to add activity -- %v", err.Error()))
				return
			}
		}

		// TODO: get habit rules

		// TODO: get pet mood based on new data

		// TODO: get pet name and avatar

		middleware.SuccessResponse(c, 201, "data updated")
	}
}
