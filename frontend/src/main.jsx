import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Landing from './components/Landing';
import GameScreen from './components/GameScreen';
import './styles.css';

// Tab-local identities support two clients in separate tabs and survive reloads.
function read(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } }
function save(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* The active in-memory session still works. */ } }
function App() {
  const [session, setSession] = useState(() => read('ttt:active'));
  const [players, setPlayers] = useState(() => read('ttt:players') || {});
  function join(gameId, player) {
    const next = { gameId, ...player };
    const identities = { ...players, [gameId]: player };
    save('ttt:players', identities); setPlayers(identities);
    save('ttt:active', next); setSession(next);
  }
  function leave() { save('ttt:active', null); setSession(null); }
  return <div className="app-shell"><header><a className="brand" href="./" onClick={event => { event.preventDefault(); leave(); }}><span className="brand-icon">×<span>○</span></span>three in a row<span className="brand-period">.</span></a><span className="header-note">A CLASSIC FOR TWO</span></header>{session ? <GameScreen key={session.gameId} session={session} onLeave={leave}/> : <Landing onJoin={join} remembered={id => players[id]}/>}<footer><span>A small game. A good time.</span><span>X goes first. Friendship wins.</span></footer></div>;
}
createRoot(document.getElementById('root')).render(<App/>);
