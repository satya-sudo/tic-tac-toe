/*
POST /games
Response:
{
    "gameId": "some-id"
}

GET /games/{gameId}
Response:
{
    "gameId": "some-id",
    "status": "IN_PROGRESS",
    "player1": {
        "id": "p1",
        "name": "Satyam"
    },
    "player2": {
        "id": "p2",
        "name": "Rahul"
    },
    "turn": "p1",
    "board": [
        [1, 0, 2],
        [0, 1, 0],
        [0, 0, 0]
    ]
}

POST /games/{gameId}/join
Request:
{
    "name": "Satyam"
}
Response:
{
    "player": {
        "id": "p1",
        "name": "Satyam"
    }
}

POST /games/{gameId}/start
Response:
{
    "status": "IN_PROGRESS",
    "turn": "p1"
}

POST /games/{gameId}/moves
Request:
{
    "playerId": "p1",
    "x": 1,
    "y": 2
}
Response:
{
    "success": true,
    "nextTurn": "p2",
    "status": "IN_PROGRESS"
}
*/