package tictactoe

import (
	"sync"

	"github.com/google/uuid"
)

type GameManager struct {
	games map[string]*Game
	mu    sync.RWMutex
}

func NewGameManager() *GameManager {
	return &GameManager{
		games: make(map[string]*Game),
		mu:    sync.RWMutex{},
	}
}
func (gm *GameManager) CreateGame() string {
	gm.mu.Lock()
	defer gm.mu.Unlock()
	gameId := uuid.New().String()
	game := NewGame(
		gameId,
	)
	gm.games[gameId] = game
	return game.GameId
}

func (gm *GameManager) JoinGame(player *Player, gameId string) error {
	gm.mu.Lock()
	defer gm.mu.Unlock()
	game, exists := gm.games[gameId]
	if !exists {
		return GameNotExistsError
	}
	err := game.AddPlayer1(player)
	if err != nil {
		err = game.AddPlayer2(player)
		if err != nil {
			return TooManyPlayerError
		}
	}
	return nil
}

func (gm *GameManager) StartGame(gameId string) error {
	gm.mu.RLock()
	game, ok := gm.games[gameId]
	gm.mu.RUnlock()

	if !ok {
		return GameNotExistsError
	}

	return game.StartGame()
}

func (gm *GameManager) GetGame(gameId string) (*Game, error) {
	gm.mu.RLock()
	defer gm.mu.RUnlock()
	game, ok := gm.games[gameId]
	if !ok {
		return nil, InvalidGameId
	}
	return game, nil
}
func (gm *GameManager) DeleteGame(gameId string) bool {
	gm.mu.Lock()
	defer gm.mu.Unlock()
	if _, ok := gm.games[gameId]; !ok {
		return false
	}
	delete(gm.games, gameId)
	return true
}
