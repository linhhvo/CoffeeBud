package middleware

import (
	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Code    int  `json:"code"`
	Success bool `json:"success"`
	Data    any  `json:"data,omitempty"`  // Data returned on success, omitted if empty
	Error   any  `json:"error,omitempty"` // Specific error info on failure, omitted if empty
}

func SuccessResponse(c *gin.Context, code int, data any) {
	c.JSON(code, APIResponse{
		Code:    code,
		Success: true,
		Data:    data,
	})
}

func ErrorResponse(c *gin.Context, code int, err error) {
	c.JSON(code, APIResponse{
		Code:    code,
		Success: false,
		Error:   err.Error(),
	})
}

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next() // Process the request first

		// Check if any errors were added to the context
		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err
			ErrorResponse(c, c.Writer.Status(), err)
			c.Abort()
		}
	}
}
