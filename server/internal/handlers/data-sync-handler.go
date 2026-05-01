package handlers

import (
	"coffee-bud/internal/middleware"
	"coffee-bud/internal/models"
	"coffee-bud/internal/repositories"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func SyncDataHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var json []models.ActivityEvent

		var device models.Device

		if err := c.ShouldBindUri(&device); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return
		}

		if err := c.ShouldBindQuery(&device); err != nil {
			c.Status(http.StatusBadRequest)
			c.Error(err)
			return

		}
		// check if device is already in the system
		_, err := repositories.GetDevice(ctx, db, device.DeviceId)
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
		rulesChanged, err := repositories.HasPendingRuleChanges(ctx, db, device.DeviceId)

		// update device info
		_, err = repositories.UpdateDevice(ctx, db, device)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(err)
			return
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
			_, err := repositories.AddActivity(ctx, db, data)
			if err != nil {
				c.Status(http.StatusInternalServerError)
				c.Error(fmt.Errorf("failed to add activity -- %v", err.Error()))
				return
			}
		}

		// TODO: get pet mood based on new data

		// TODO: get pet name and avatar

		c.Header("Rules-Need-Update", strconv.Itoa(rulesChanged))
		middleware.SuccessResponse(c, 200, nil)
	}
}
