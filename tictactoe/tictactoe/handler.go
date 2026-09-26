package tictactoe

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type GameHandler struct {
	gameManager *GameManager
	connManager *ConnectionManager
	upgrader    *websocket.Upgrader
}

func NewGameHandler(gameManager *GameManager, connManager *ConnectionManager, upgrader *websocket.Upgrader) *GameHandler {
	return &GameHandler{
		gameManager: gameManager,
		connManager: connManager,
		upgrader:    upgrader,
	}
}

func (h *GameHandler) CreateGame(w http.ResponseWriter, r *http.Request) {
	gameID := h.gameManager.CreateGame()

	response := CreateGameResponse{
		GameID: gameID,
		Status: "created",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(response)
}

func (h *GameHandler) JoinGame(w http.ResponseWriter, r *http.Request) {
	gameID := r.PathValue("gameId")

	_, err := h.gameManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "invalid game id", http.StatusNotFound)
		return
	}

	var req JoinGameRequest

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	player := NewPlayer(
		uuid.New().String(),
		req.PlayerName,
	)

	err = h.gameManager.JoinGame(player, gameID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := PlayerAddedResponse{
		PlayerName: player.name,
		PlayerID:   player.id,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(response)
}

func (h *GameHandler) StartGame(w http.ResponseWriter, r *http.Request) {
	gameID := r.PathValue("gameId")

	err := h.gameManager.StartGame(gameID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	game, err := h.gameManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "invalid game id", http.StatusNotFound)
		return
	}
	boardCastMessage := getGameState(game, gameID)
	err = h.connManager.Broadcast(gameID, boardCastMessage)
	if err != nil {
		//log the error
		fmt.Println(err.Error())
	}

	response := StartGameResponse{
		Status: game.GetGameStatus(),
		Turn:   game.GetGameTurn(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(response)
}

func (h *GameHandler) Move(w http.ResponseWriter, r *http.Request) {
	gameID := r.PathValue("gameId")

	game, err := h.gameManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "invalid game id", http.StatusNotFound)
		return
	}

	var req MoveRequest

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	position := Position{
		X: req.X,
		Y: req.Y,
	}

	_, err = game.PlayTurn(req.PlayerID, position)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	boardCastMessage := getGameState(game, gameID)
	err = h.connManager.Broadcast(gameID, boardCastMessage)
	if err != nil {
		//log the error
		fmt.Println(err.Error())
	}
	response := MoveResponse{
		Success:  true,
		NextTurn: game.GetGameTurn(),
		Status:   game.GetGameStatus(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(response)
}

func getGameState(game *Game, gameID string) GameResponse {
	var player1 *PlayerResponse
	if p := game.GetPlayer1(); p != nil {
		player1 = &PlayerResponse{
			ID:   p.id,
			Name: p.name,
		}
	}

	var player2 *PlayerResponse
	if p := game.GetPlayer2(); p != nil {
		player2 = &PlayerResponse{
			ID:   p.id,
			Name: p.name,
		}
	}

	boardCastMessage := GameResponse{
		GameID:  gameID,
		Status:  game.GetGameStatus(),
		Player1: player1,
		Player2: player2,
		Turn:    game.GetGameTurn(),
		Board:   game.GetBoard(),
	}
	return boardCastMessage
}

func (h *GameHandler) GetGame(w http.ResponseWriter, r *http.Request) {
	gameID := r.PathValue("gameId")

	game, err := h.gameManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "invalid game id", http.StatusNotFound)
		return
	}
	response := getGameState(game, gameID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(response)
}

func (h *GameHandler) WebSocket(w http.ResponseWriter, r *http.Request) {
	gameID := r.PathValue("gameId")

	game, err := h.gameManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "invalid game id", http.StatusNotFound)
		return
	}
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	client := &Client{
		conn: conn,
	}
	err = h.connManager.Connect(gameID, client)
	if err != nil {
		http.Error(w, "unable to connect user ", http.StatusInternalServerError)
		return
	}
	boardCastMessage := getGameState(game, gameID)
	err = h.connManager.Broadcast(gameID, boardCastMessage)
	if err != nil {
		//log the error
		fmt.Println(err.Error())
	}
	for {
		_, _, err := client.conn.ReadMessage()
		if err != nil {
			// client disconnected
			break
		}
	}
	h.connManager.Disconnect(gameID, client)
}
