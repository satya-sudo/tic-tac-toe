# Three in a row

React + Vite frontend for the existing Go Tic-Tac-Toe API. Backend files are unchanged.

## Run locally

From the repository root, start the backend:

```sh
go run ./tictactoe/cmd
```

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173). The Vite server proxies `/games` to `http://localhost:8080`, avoiding a backend CORS change. To use a different backend, set `API_PROXY_TARGET` in `.env.local`.

Create a game, copy its ID, enter your name, and join. Your friend uses Join Game in a separate browser/tab, enters the ID and a name. When the second player connects, both clients receive the updated player list automatically and player X can click Start Game. The backend broadcasts complete snapshots when a WebSocket client connects, when the game starts, and after moves. Both clients update automatically. There is no polling. Complete WebSocket snapshots update both boards immediately after each move. Moves use `x` as the row and `y` as the column, matching the backend.

Player identities are stored per game in `sessionStorage`, survive reloads, and are isolated between independently opened tabs. For two-player testing, open the second tab independently rather than duplicating a tab (browsers may copy a duplicated tab’s storage). Returning to the lobby does not remove a player from the server; there is no leave endpoint. Rejoin the same ID in that tab to resume your identity.

For another device on your network, run `npm run dev -- --host 0.0.0.0` and share the frontend host’s LAN address. The API stays behind the frontend proxy.

## Player response contract

The supplied contract requires `player1` and `player2` to contain `id` and `name`. The frontend detects responses with missing player fields and explains why play is paused. If an older running backend returns `{}` for players, restart it with the current handler that maps players to `PlayerResponse`. This frontend implementation does not modify backend files or add endpoints.

## Checks and deployment

```sh
npm test
npm run build
npm run preview
```

Deploy `dist/` with a reverse proxy forwarding `/games` and `/games/*` to the Go server. Vite's development proxy is not included in the static build. Enable WebSocket upgrades for `/games/*/ws` in that reverse proxy. The preview server has the same HTTP and WebSocket proxy for local verification. HTTPS pages automatically use `wss:`; HTTP pages use `ws:`.

Components separate lobby, board, player/game screen, and sharing. `api.js` owns requests and errors, `useGame.js` owns the connection lifecycle through `gameConnection.js`, and `game.js` owns presentation rules. The server remains authoritative for turns and results.

A snapshot is fetched on connection/reconnection and manual recovery refresh. Successful starts and moves do not trigger a GET or optimistically change the board: the UI waits for the WebSocket snapshot. Disconnected clients cannot make moves. Connections retry at 1, 2, 4, 8, and 16 seconds, then require manual Reconnect. Leaving a game closes its socket and cancels retries. A missing start or move update keeps the action locked with a recovery refresh action after ten seconds.

Status values follow the Go constants: 0 in progress, 1 player 1 won, 2 player 2 won, 3 draw, 4 waiting.
