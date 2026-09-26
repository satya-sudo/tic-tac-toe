package main

import (
	"fmt"
	"log"
	"net/http"
	"tictactoe/tictactoe/tictactoe"

	"github.com/gorilla/websocket"
)

func main() {
	gameManager := tictactoe.NewGameManager()
	connManager := tictactoe.NewConnectionManager()
	upgrader := &websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	handler := tictactoe.NewGameHandler(gameManager, connManager, upgrader)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /games", handler.CreateGame)
	mux.HandleFunc("GET /games/{gameId}", handler.GetGame)
	mux.HandleFunc("POST /games/{gameId}/join", handler.JoinGame)
	mux.HandleFunc("POST /games/{gameId}/start", handler.StartGame)
	mux.HandleFunc("POST /games/{gameId}/moves", handler.Move)
	mux.HandleFunc("GET /games/{gameId}/ws", handler.WebSocket)
	port := "8080"
	fmt.Println("tic-tac-toe server running on :" + port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}

}
