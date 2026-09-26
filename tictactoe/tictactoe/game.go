package tictactoe

import (
	"sync"
)

type boardStatus int
type gameStatus int

const (
	IN_PROGRESS gameStatus = iota
	PLAYER1_WON
	PLAYER2_WON
	DRAW
	WAITING_FOR_PLAYERS
)

const (
	emptyCell boardStatus = iota
	player1
	player2
)

type Position struct {
	X, Y int
}

type Board struct {
	board [][]boardStatus
}

func NewBoard() Board {
	board := make([][]boardStatus, 3)
	for i := range 3 {
		board[i] = make([]boardStatus, 3)
	}
	return Board{
		board: board,
	}
}

type Game struct {
	GameId     string
	player1    *Player
	player2    *Player
	board      *Board
	turn       string
	gameStatus gameStatus
	mu         sync.RWMutex
}

func NewGame(gameId string) *Game {
	board := NewBoard()
	game := Game{
		GameId:     gameId,
		board:      &board,
		gameStatus: WAITING_FOR_PLAYERS,
		mu:         sync.RWMutex{},
	}
	return &game
}

func (g *Game) AddPlayer1(Player1 *Player) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.player1 == nil {
		g.player1 = Player1
		return nil
	}
	return PlayerOneAlreadyPresentError
}

func (g *Game) AddPlayer2(Player2 *Player) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.player2 == nil {
		g.player2 = Player2
		return nil
	}
	return PlayerTwoAlreadyPresentError
}

func (g *Game) StartGame() error {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.player1 == nil || g.player2 == nil {
		return NotEnoughPlayerError
	}
	g.gameStatus = IN_PROGRESS
	g.turn = g.player1.id
	return nil
}

func (g *Game) GetGameTurn() string {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.turn
}

func (g *Game) GetGameStatus() gameStatus {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.gameStatus
}

func (g *Game) GetBoard() [][]boardStatus {
	g.mu.RLock()
	defer g.mu.RUnlock()
	boardCopy := make([][]boardStatus, 3)

	for i := range 3 {
		boardCopy[i] = make([]boardStatus, 3)
		copy(boardCopy[i], g.board.board[i])
	}
	return boardCopy
}

func (g *Game) GetPlayer1() *Player {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.player1
}

func (g *Game) GetPlayer2() *Player {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.player2
}

func (g *Game) PlayTurn(playerId string, position Position) (bool, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.gameStatus != IN_PROGRESS {
		return false, GamefinishError
	}
	if position.X < 0 || position.X >= 3 || position.Y < 0 || position.Y >= 3 {
		return false, InvalidMoveError
	}
	if g.turn != playerId {
		return false, InvalidPlayerIdError
	}
	boardPointerStatus := emptyCell
	if g.player1.id == playerId {
		boardPointerStatus = player1
	} else {
		boardPointerStatus = player2
	}
	if g.board.board[position.X][position.Y] != emptyCell {
		return false, InvalidMoveError
	}

	g.board.board[position.X][position.Y] = boardPointerStatus

	g.checkWinner()
	if g.gameStatus == IN_PROGRESS {
		if g.player1.id == playerId {
			g.turn = g.player2.id
		} else {
			g.turn = g.player1.id
		}
	}
	return true, nil
}

func (g *Game) checkWinner() {
	board := g.board.board

	check := func(a, b, c boardStatus) boardStatus {
		if a != emptyCell && a == b && b == c {
			return a
		}
		return emptyCell
	}

	// Rows
	for i := 0; i < 3; i++ {
		if winner := check(board[i][0], board[i][1], board[i][2]); winner != emptyCell {
			if winner == player1 {
				g.gameStatus = PLAYER1_WON
				return
			}
			g.gameStatus = PLAYER2_WON
			return
		}
	}

	// Columns
	for i := 0; i < 3; i++ {
		if winner := check(board[0][i], board[1][i], board[2][i]); winner != emptyCell {
			if winner == player1 {
				g.gameStatus = PLAYER1_WON
				return
			}
			g.gameStatus = PLAYER2_WON
			return
		}
	}

	// Diagonals
	if winner := check(board[0][0], board[1][1], board[2][2]); winner != emptyCell {
		if winner == player1 {
			g.gameStatus = PLAYER1_WON
			return
		}
		g.gameStatus = PLAYER2_WON
		return
	}

	if winner := check(board[0][2], board[1][1], board[2][0]); winner != emptyCell {
		if winner == player1 {
			g.gameStatus = PLAYER1_WON
			return
		}
		g.gameStatus = PLAYER2_WON
		return
	}

	// Check if board is full
	full := true
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if board[i][j] == emptyCell {
				full = false
				break
			}
		}
	}

	if full {
		g.gameStatus = DRAW
		return
	}
}
