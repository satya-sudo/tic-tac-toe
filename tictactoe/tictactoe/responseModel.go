package tictactoe

type PlayerResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
type GameResponse struct {
	GameID  string          `json:"gameId"`
	Status  gameStatus      `json:"status"`
	Player1 *PlayerResponse `json:"player1"`
	Player2 *PlayerResponse `json:"player2"`
	Turn    string          `json:"turn"`
	Board   [][]boardStatus `json:"board"`
}

type MoveResponse struct {
	Success  bool       `json:"success"`
	NextTurn string     `json:"nextTurn"`
	Status   gameStatus `json:"status"`
}

type MoveRequest struct {
	PlayerID string `json:"playerId"`
	X        int    `json:"x"`
	Y        int    `json:"y"`
}

type StartGameResponse struct {
	Status gameStatus `json:"status"`
	Turn   string     `json:"turn"`
}

type CreateGameResponse struct {
	GameID string `json:"gameId"`
	Status string `json:"status"`
}

type JoinGameRequest struct {
	PlayerName string `json:"name"`
}

type PlayerAddedResponse struct {
	PlayerName string `json:"playerName"`
	PlayerID   string `json:"playerId"`
}
