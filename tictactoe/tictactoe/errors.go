package tictactoe

import "errors"

var GamefinishError = errors.New("Game already finished")
var InvalidMoveError = errors.New("Invalid move")
var InvalidPlayerIdError = errors.New("Invalid Player Id")
var InvalidGameId = errors.New("Invalid game Id")

var (
	PlayerOneAlreadyPresentError = errors.New("player one is already present")
	PlayerTwoAlreadyPresentError = errors.New("player two is already present")
	NotEnoughPlayerError         = errors.New("not enough players")
	TooManyPlayerError           = errors.New("too many players")
	GameNotExistsError           = errors.New("game does not exist")
	clientNotFoundError          = errors.New("Client not found")
)
