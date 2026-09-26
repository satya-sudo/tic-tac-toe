import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useGame } from '../hooks/useGame';
import { canMove, gameHeading, isFinished } from '../game';
import Board from './Board';
import ShareCode from './ShareCode';
import WinCelebration from './WinCelebration';

export default function GameScreen({ session, onLeave }) {
  const { gameId, playerId } = session;
  const { game, error: connectionError, connection, reload, reconnect } = useGame(gameId);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const actionLock = useRef(false);
  const boardRef = useRef(null);
  const [pendingMove, setPendingMove] = useState(null);
  const [pendingStart, setPendingStart] = useState(false);
  useEffect(() => {
    if (!pendingStart) return;
    if (game?.status !== 4 || connection !== 'connected') { setPendingStart(false); return; }
    const timeout = setTimeout(() => {
      setActionError('The start has not been confirmed by a live update. Refresh the game before trying again.');
    }, 10000);
    return () => clearTimeout(timeout);
  }, [pendingStart, game?.status, connection]);
  useEffect(() => {
    if (!pendingMove) return;
    const { x, y } = pendingMove;
    if (game?.board[x][y] !== 0 || connection !== 'connected') { setPendingMove(null); return; }
    const timeout = setTimeout(() => {
      setActionError('The move has not been confirmed by a live update. Refresh the game before trying again.');
    }, 10000);
    return () => clearTimeout(timeout);
  }, [pendingMove, game, connection]);
  async function act(action, move) {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); setActionError('');
    if (move) setPendingMove(move);
    else setPendingStart(true);
    try { await action(); }
    catch (err) { setActionError(err.message); setPendingMove(null); setPendingStart(false); }
    finally { actionLock.current = false; setBusy(false); }
  }
  const incomplete = game && [game.player1, game.player2].some(player => player && (!player.id || !player.name));
  const enabled = canMove(game, playerId, busy || !!pendingMove) && connection === 'connected' && !connectionError && !incomplete;
  const finished = isFinished(game?.status);
  return <main className="game-layout">
    <section className="play-area">
      <div className="game-top"><button className="text-button" onClick={onLeave} disabled={busy}>← Back to lobby</button><span className="pill" role="status"><span className={`dot ${connection !== 'connected' ? 'offline' : ''}`}/>{connection === 'connected' ? 'LIVE · CONNECTED' : connection.toUpperCase()}</span></div>
      <div className="game-heading" aria-live="polite"><span className="eyebrow">{finished ? 'THAT’S A WRAP' : game?.status === 4 ? 'THE LOBBY' : 'MAKE IT THREE'}</span><h1>{gameHeading(game, playerId)}</h1><p>{finished ? 'Good game. Another round is just a new game away.' : game?.status === 4 ? 'Both players join, then player X starts the game.' : 'Three in a row. Any direction. You know the drill.'}</p></div>
      <div ref={boardRef}><Board board={game?.board || Array.from({ length: 3 }, () => [0, 0, 0])} enabled={enabled} onMove={(x, y) => { if (enabled && game.board[x][y] === 0) act(() => api.move(gameId, playerId, x, y), { x, y }); }}/></div>
      <p className="board-caption">{busy || pendingMove ? 'Waiting for server confirmation…' : finished ? 'Game complete' : enabled ? 'Choose an empty square to make your move.' : game?.status === 4 ? 'Your next great rivalry starts here.' : 'Sit tight. The board updates automatically.'}</p>
      {(game?.status === 1 || game?.status === 2) && <WinCelebration winner={game.status} boardRef={boardRef}/>}
    </section>
    <aside className="game-sidebar"><span className="eyebrow">AT THE TABLE</span><h2>A friendly face-off.</h2>
      {[1, 2].map(number => { const player = game?.[`player${number}`]; const active = game?.status === 0 && player?.id === game.turn; return <div className={`player-card ${active ? 'active' : ''}`} key={number}><span className={`avatar ${number === 1 ? 'x' : 'o'}`}>{number === 1 ? 'X' : 'O'}</span><div><strong>{player ? player.name || `Player ${number}` : 'Open seat'} {player?.id === playerId && <small>(you)</small>}</strong><span>{!player ? 'Waiting for a friend' : active ? 'Thinking of a move…' : `Player ${number}`}</span></div>{active && <span className="dot"/>}</div>; })}
      <div className="status-line"><span>Status</span><strong>{!game ? 'Loading' : ['In progress', 'Player 1 won', 'Player 2 won', 'Draw', 'Waiting for players'][game.status]}</strong></div>
      {game?.status === 4 && game.player1 && game.player2 && game.player1.id === playerId && <button className="button primary" disabled={busy || pendingStart || connection !== 'connected' || !!connectionError || incomplete} onClick={() => act(() => api.start(gameId))}>{busy || pendingStart ? 'Starting…' : 'Start Game'} <span>→</span></button>}
      {game?.status === 4 && game.player2?.id === playerId && <p className="hint">Player X will start when you’re both ready.</p>}
      {connection !== 'connected' && <button className="text-button" onClick={reconnect}>Reconnect ↻</button>}
      <ShareCode gameId={gameId}/><p className="hint">Share this ID with a friend. They can join from another browser or device.</p>
      {incomplete && <div className="error" role="alert">The server returned players without IDs or names. Play is paused because the API must include these fields to identify players.</div>}
      {(actionError || connectionError) && <div className="error" role="alert">{actionError || connectionError}<button className="text-button" onClick={async () => { setActionError(''); await reload(); setPendingMove(null); setPendingStart(false); }}>Refresh game ↻</button></div>}
      {finished && <button className="button primary" onClick={onLeave}>Back for another round ↗</button>}
    </aside>
  </main>;
}
