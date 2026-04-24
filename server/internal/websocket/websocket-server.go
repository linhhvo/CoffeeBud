package websocketServer

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// origin := r.Header.Get("Origin")
		// return origin == ""
		return true
	},
}

func WebSocketHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error handling websocket: %v", err))
			return
		}
		defer conn.Close()

		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				c.Status(http.StatusInternalServerError)
				c.Error(fmt.Errorf("error reading websocket message: %v", err))
				break
			}
			fmt.Println("message received: ", message)

			err = conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				c.Status(http.StatusInternalServerError)
				c.Error(fmt.Errorf("error echoing message: %v", err))
				break
			}
		}
	}

}
