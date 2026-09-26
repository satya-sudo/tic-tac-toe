# Tic-Tac-Toe

A backend implementation of a multiplayer Tic-Tac-Toe game built in Go.

The purpose of this project is to build a small but complete backend system while practicing clean API design, concurrency, WebSockets, game state management, and separation of responsibilities.

## What this project does

The server provides APIs to:

* Create a game
* Fetch a game
* Join a game
* Start a game
* Make moves
* Connect to a game using WebSockets
* Broadcast game updates to connected players

The game state is maintained on the server, and WebSockets are used to push real-time updates to players.

## Tech Stack

* **Go**
* **net/http**
* **WebSockets**
* HTTP REST APIs
* In-memory game state

## API

### Create Game

```http
POST /games
```

Creates a new Tic-Tac-Toe game.

### Get Game

```http
GET /games/{gameId}
```

Returns the current state of a game.

### Join Game

```http
POST /games/{gameId}/join
```

Allows another player to join an existing game.

### Start Game

```http
POST /games/{gameId}/start
```

Starts the game once the required players have joined.

### Make Move

```http
POST /games/{gameId}/moves
```

Makes a move on the game board.

### WebSocket

```http
GET /games/{gameId}/ws
```

Establishes a WebSocket connection for real-time game updates.

Example:

```javascript
const ws = new WebSocket(
    "ws://localhost:8080/games/{gameId}/ws"
);

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log(message);
};
```

## WebSocket Messages

Game events are sent to connected players through WebSockets.

Example:

```json
{
  "type": "game_update",
  "data": {
    "gameId": "abc123",
    "currentPlayer": "player2"
  }
}
```

The connection manager is responsible for keeping track of WebSocket connections and broadcasting updates to players connected to a particular game.

## Project Structure

The project separates HTTP handling, game logic, and connection management.

```text
.
├── main.go
└── tictactoe/
    ├── game.go
    ├── game_manager.go
    ├── game_handler.go
    ├── connection_manager.go
    └── ...
```

The exact structure may evolve as the project grows.

### Game

Responsible for the actual Tic-Tac-Toe rules and state.

Examples:

* Board management
* Making moves
* Validating moves
* Checking winners
* Checking draws
* Managing turns

### GameManager

Responsible for managing multiple games.

```text
GameManager
    │
    ├── Game 1
    ├── Game 2
    └── Game 3
```

### GameHandler

Responsible for HTTP requests and translating them into operations on the game manager.

### ConnectionManager

Responsible for WebSocket connections.

It maintains connections associated with a game and provides functionality to broadcast events:

```go
Broadcast(gameID, message)
```

The connection manager does not need to know what a particular game event means. It is primarily responsible for delivering messages to connected clients.

## Running Locally

Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

Run the server:

```bash
go run .
```

The server starts on:

```text
http://localhost:8080
```

## Example Flow

A typical game can be played through the following sequence:

```text
1. Create Game
       │
       ▼
2. Player 1 joins
       │
       ▼
3. Player 2 joins
       │
       ▼
4. Start Game
       │
       ▼
5. Players make moves
       │
       ▼
6. Server updates game state
       │
       ▼
7. WebSocket broadcasts update
       │
       ▼
8. Players receive the new state
```

## Why I Built This

This project is intentionally small.

The goal wasn't to build a production-ready game platform, but to use a simple problem to understand how different backend concepts fit together.

Some of the concepts explored in this project:

* Designing HTTP APIs
* Structuring a Go backend
* Managing application state
* Concurrency and shared state
* WebSocket connections
* Broadcasting events
* Separating business logic from transport logic
* Designing a connection manager
* Handling errors and invalid game operations

Tic-Tac-Toe is simple enough that the focus can stay on the backend architecture rather than the complexity of the game itself.

## Development

This project was designed and implemented by me from scratch as a learning and engineering exercise.

No AI coding agent was used to implement the project.

The goal was to understand and write the implementation myself rather than have an agent generate the code.

## Future Improvements

Some things that could be added later:

* Persistent game storage
* Player authentication
* Better WebSocket lifecycle management
* Reconnection support
* Graceful handling of disconnected players
* Multiple simultaneous games
* Redis for distributed connection/state management
* Automated tests
* Integration tests
* Docker support
* A web-based frontend

## License

This project is primarily a personal learning project.
