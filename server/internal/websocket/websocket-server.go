package websocketServer

import (
	"coffee-bud/internal/models"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Hub struct {
	clients   map[*websocket.Conn]bool
	mutex     sync.RWMutex
	Broadcast chan models.WebSocketPayload
}

func NewHub() *Hub {
	return &Hub{
		clients:   make(map[*websocket.Conn]bool),
		Broadcast: make(chan models.WebSocketPayload),
	}
}

func (hub *Hub) HandleMessage() {
	for {
		// receive message from channel
		payload := <-hub.Broadcast

		// send data to client
		hub.mutex.RLock()
		for client := range hub.clients {
			if err := client.WriteJSON(payload); err != nil {
				if err := client.Close(); err != nil {
					log.Fatal("error closing connection: ", err.Error())
					return
				}
				delete(hub.clients, client)
			}
		}
		hub.mutex.RUnlock()
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// origin := r.Header.Get("Origin")
		// return origin == ""
		return true
	},
}

func WebSocketHandler(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.Status(http.StatusInternalServerError)
			c.Error(fmt.Errorf("error upgrading to websocket: %v", err))
			return
		}

		// add new client connection
		hub.mutex.Lock()
		hub.clients[conn] = true
		hub.mutex.Unlock()

		var data models.WebSocketPayload

		// remove connection when client disconnects
		for {
			if err := conn.ReadJSON(&data); err != nil {
				hub.mutex.Lock()
				delete(hub.clients, conn)
				hub.mutex.Unlock()

				conn.Close()
				break
			}
		}
	}

}
