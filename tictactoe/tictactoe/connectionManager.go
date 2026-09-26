package tictactoe

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	conn *websocket.Conn
}

type ConnectionManager struct {
	mu    sync.RWMutex
	games map[string][]*Client
}

func NewConnectionManager() *ConnectionManager {
	return &ConnectionManager{
		games: make(map[string][]*Client),
	}
}

func (cm *ConnectionManager) Connect(gameID string, client *Client) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.games[gameID] = append(cm.games[gameID], client)
	return nil

}
func (cm *ConnectionManager) Disconnect(gameID string, client *Client) error {
	cm.mu.Lock()
	clients, ok := cm.games[gameID]
	if !ok {
		cm.mu.Unlock()
		return GameNotExistsError
	}
	var found bool
	for i, allClient := range clients {
		if allClient == client {
			newClientList := append(clients[:i], clients[i+1:]...)
			cm.games[gameID] = newClientList
			found = true
			break
		}
	}
	cm.mu.Unlock()
	if !found {
		return clientNotFoundError
	}
	err := client.conn.Close()
	if err != nil {
		return err
	}
	return nil
}

func (cm *ConnectionManager) Broadcast(gameID string, message any) error {
	cm.mu.RLock()
	clients, ok := cm.games[gameID]
	if !ok {
		cm.mu.RUnlock()
		return GameNotExistsError
	}
	clientList := append([]*Client(nil), clients...)

	cm.mu.RUnlock()
	for _, client := range clientList {
		err := client.conn.WriteJSON(message)
		if err != nil {
			// handle later
		}
	}
	return nil
}
