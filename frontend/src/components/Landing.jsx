import React, { useState } from 'react';
import { api } from '../api';
import ShareCode from './ShareCode';

export default function Landing({ onJoin, remembered }) {
  const [mode, setMode] = useState('create');
  const [gameId, setGameId] = useState('');
  const [created, setCreated] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function create() {
    setBusy(true); setError('');
    try { const result = await api.create(); setCreated(result.gameId); setGameId(result.gameId); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function join(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const id = gameId.trim();
      const saved = remembered(id);
      if (saved) { await api.get(id); onJoin(id, saved); }
      else { const player = await api.join(id, name.trim()); onJoin(id, player); }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="landing">
    <section className="intro">
      <span className="pill"><span className="dot"/> TWO PLAYERS. ENDLESS REMATCHES.</span>
      <h1>A little rivalry.<br/><em>A lot of fun.</em></h1>
      <p>One friend. Nine squares. Three in a row.<br/>Make your move and see who gets there first.</p>
      <div className="decor-board" aria-hidden="true">{['X', '', 'O', '', 'X', '', 'O', '', 'X'].map((mark, i) => <span key={i} className={mark === 'O' ? 'o' : 'x'}>{mark}</span>)}</div>
      <div className="intro-caption"><span>THE CLASSIC, RECONNECTED.</span><span>↗</span></div>
    </section>
    <section className="entry-card">
      <span className="eyebrow">LET’S PLAY</span><h2>Meet at the board.</h2><p>Start a fresh game or join your friend.</p>
      <div className="tabs" aria-label="Choose how to play">{['create', 'join'].map(tab => <button key={tab} disabled={busy} aria-pressed={mode === tab} className={mode === tab ? 'selected' : ''} onClick={() => { setMode(tab); setError(''); setGameId(tab === 'create' ? created : ''); }}>{tab === 'create' ? 'Create Game' : 'Join Game'}</button>)}</div>
      {mode === 'create' && !created ? <div className="create-panel"><div className="mini-marks" aria-hidden="true"><span>X</span><span>O</span></div><h3>A fresh board awaits.</h3><p>Create a game, grab the ID, and invite<br/>someone to a friendly face-off.</p><button className="button primary" disabled={busy} onClick={create}>{busy ? 'Creating…' : 'Create Game'} <span>↗</span></button></div> : <form onSubmit={join}>
        {mode === 'create' ? <><div className="success-note">✓ Your game is ready to share.</div><ShareCode gameId={created}/></> : <label>Game ID<input autoComplete="off" required value={gameId} placeholder="Paste your friend’s game ID" onChange={e => setGameId(e.target.value)}/></label>}
        <label>Your name<input required maxLength={60} autoComplete="nickname" value={name} placeholder="What should we call you?" onChange={e => setName(e.target.value)}/></label>
        <button className="button primary" disabled={busy || !gameId.trim() || !name.trim()}>{busy ? 'Joining…' : 'Join the game'} <span>→</span></button>
      </form>}
      {error && <div className="error" role="alert">{error}</div>}
      <div className="card-foot"><span>◎</span> No accounts. Just good company.</div>
    </section>
  </main>;
}
