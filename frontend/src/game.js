export const symbols = ['', 'X', 'O'];
export const isFinished = status => [1, 2, 3].includes(status);
export function canMove(game, playerId, busy = false) {
  return !!game && game.status === 0 && !!playerId && game.turn === playerId && !busy;
}
export function gameHeading(game, playerId) {
  if (!game) return 'Finding your table…';
  if (game.status === 4) return game.player1 && game.player2 ? 'Ready when you are.' : 'Waiting for a friend.';
  if (game.status === 3) return 'A well-matched draw.';
  if (game.status === 1 || game.status === 2) {
    const winner = game[`player${game.status}`];
    return winner?.id && winner.id === playerId ? 'You win. Nicely played!' : `${winner?.name || `Player ${game.status}`} wins!`;
  }
  return game.turn === playerId ? 'Your move.' : `${[game.player1, game.player2].find(p => p?.id === game.turn)?.name || 'Your opponent'}’s move.`;
}
