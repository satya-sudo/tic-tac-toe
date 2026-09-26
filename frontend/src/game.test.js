import test from 'node:test';
import assert from 'node:assert/strict';
import { canMove, gameHeading, isFinished } from './game.js';
import { api } from './api.js';

test('moves require an active game, local turn and idle request', () => {
  assert.equal(canMove({ status: 0, turn: 'p1' }, 'p1'), true);
  assert.equal(canMove({ status: 0, turn: 'p2' }, 'p1'), false);
  assert.equal(canMove({ status: 0, turn: 'p1' }, 'p1', true), false);
  for (const status of [1, 2, 3, 4]) assert.equal(canMove({ status, turn: 'p1' }, 'p1'), false);
  assert.equal(canMove(null, 'p1'), false);
});
test('announces winner and draw from server status', () => {
  assert.equal(gameHeading({ status: 1, player1: { id: 'p1', name: 'Sam' } }, 'p1'), 'You win. Nicely played!');
  assert.equal(gameHeading({ status: 2, player2: { id: 'p2', name: 'Alex' } }, 'p1'), 'Alex wins!');
  assert.equal(gameHeading({ status: 3 }, 'p1'), 'A well-matched draw.');
  assert.equal(isFinished(4), false);
  assert.equal(isFinished(3), true);
});
test('API preserves move coordinates, player ID and endpoint', async t => {
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    assert.equal(path, '/games/game-1/moves');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { playerId: 'p1', x: 1, y: 2 });
    return new Response(JSON.stringify({ success: true, status: 0, nextTurn: 'p2' }));
  });
  assert.equal((await api.move('game-1', 'p1', 1, 2)).success, true);
});
test('plain text Go API errors become useful messages', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('too many players\n', { status: 400 }));
  await assert.rejects(api.join('full', 'Sam'), /game is full/);
});
test('network failures have a recoverable message', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed'); });
  await assert.rejects(api.get('game'), /Cannot reach the game server/);
});
