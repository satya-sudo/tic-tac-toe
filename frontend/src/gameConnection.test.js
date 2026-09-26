import test from 'node:test';
import assert from 'node:assert/strict';
import { connectGame, socketUrl } from './gameConnection.js';
const state = { gameId: 'g', status: 0, turn: 'p1', player1: {id:'p1',name:'X'}, player2: {id:'p2',name:'O'}, board: [[0,0,0],[0,0,0],[0,0,0]] };
function harness(getGame = async () => state) {
  const sockets = [], games = [], errors = [], statuses = [], timers = new Map();
  let id = 0;
  class Socket {
    constructor() { sockets.push(this); this.readyState = 0; }
    open() { this.readyState = 1; this.onopen(); }
    message(game) { this.onmessage({data: typeof game === 'string' ? game : JSON.stringify(game)}); }
    close() { this.readyState = 3; this.onclose?.(); }
  }
  const client = connectGame({ gameId:'g', url:'ws://localhost/games/g/ws', getGame,
    Socket, onGame:g=>games.push(g), onError:e=>errors.push(e), onStatus:s=>statuses.push(s),
    schedule:(fn,delay)=>{ timers.set(++id,{fn,delay}); return id; }, cancel:id=>timers.delete(id) });
  return {client,sockets,games,errors,statuses,timers};
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('uses ws/wss and encoded game IDs', () => {
  assert.equal(socketUrl('a/b','https://example.com/'), 'wss://example.com/games/a%2Fb/ws');
  assert.equal(socketUrl('g','http://localhost:5173'), 'ws://localhost:5173/games/g/ws');
});
test('live state wins over an older in-flight snapshot; no polling', async () => {
  let resolve, reads = 0;
  const h = harness(() => { reads++; return new Promise(r=>resolve=r); });
  h.sockets[0].open();
  const next = {...state,turn:'p2',board:[[1,0,0],[0,0,0],[0,0,0]]};
  h.sockets[0].message(next); resolve(state); await flush();
  assert.deepEqual(h.games,[next]); assert.equal(reads,1); assert.equal(h.timers.size,0);
  h.client.dispose();
});
test('winner/draw snapshots replace state and malformed messages are recoverable', async () => {
  const h = harness(); h.sockets[0].open(); await flush();
  h.sockets[0].message('bad json'); assert.match(h.errors.at(-1),/invalid live update/);
  h.sockets[0].message({...state,gameId:'other'}); assert.equal(h.games.length,1);
  for (const status of [1,2,3]) { h.sockets[0].message({...state,status}); assert.equal(h.games.at(-1).status,status); }
  assert.equal(h.errors.at(-1),''); h.client.dispose();
});
test('retries are bounded and cleanup suppresses messages and reconnects', async () => {
  const h = harness();
  for (const delay of [1000,2000,4000,8000,16000]) {
    h.sockets.at(-1).close(); await flush();
    const [id,timer] = [...h.timers][0]; assert.equal(timer.delay,delay);
    h.timers.delete(id); timer.fn();
  }
  h.sockets.at(-1).close(); assert.equal(h.timers.size,0); assert.equal(h.sockets.length,6);
  assert.match(h.errors.at(-1),/Reconnect/);
  const previous = h.games.length; h.client.dispose(); h.sockets.at(-1).message(state); assert.equal(h.games.length,previous);
});
test('reconnect fetches a fresh snapshot', async () => {
  let reads=0;
  const h = harness(async()=>{ reads++; return state; }); h.sockets[0].open(); await flush();
  h.sockets[0].close(); const [id,timer] = [...h.timers][0]; h.timers.delete(id); timer.fn();
  h.sockets[1].open(); await flush(); assert.equal(reads,2); assert.equal(h.statuses.at(-1),'connected');
  h.client.dispose(); assert.equal(h.timers.size,0);
});


test('missing games stop reconnect attempts after a failed handshake', async () => {
  const h = harness(async () => { const error = new Error('Game not found'); error.status = 404; throw error; });
  h.sockets[0].close(); await flush();
  assert.equal(h.timers.size,0); assert.equal(h.statuses.at(-1),'disconnected');
  assert.equal(h.errors.at(-1),'Game not found'); h.client.dispose();
});

test('cleanup aborts pending snapshots and ignores late responses', async () => {
  let resolve, signal;
  const h = harness((id, requestSignal) => { signal = requestSignal; return new Promise(r => resolve = r); });
  h.sockets[0].open(); h.client.dispose();
  assert.equal(signal.aborted,true); resolve(state); await flush();
  assert.equal(h.games.length,0); assert.equal(h.timers.size,0);
});
