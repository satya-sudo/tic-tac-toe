package tictactoe

type Player struct {
	id   string
	name string
}

func NewPlayer(id string, name string) *Player {
	return &Player{
		id:   id,
		name: name,
	}
}
