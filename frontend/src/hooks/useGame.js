import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { connectGame, socketUrl } from '../gameConnection';

export function useGame(gameId) {
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('connecting');
  const [attempt, setAttempt] = useState(0);
  const client = useRef(null);

  useEffect(() => { setGame(null); }, [gameId]);
  useEffect(() => {
    if (!gameId) return;
    setError('');
    const session = connectGame({ gameId, url: socketUrl(gameId), getGame: api.get,
      onGame: setGame, onError: setError, onStatus: setConnection });
    client.current = session;
    return () => { session.dispose(); client.current = null; };
  }, [gameId, attempt]);

  return { game, error, connection, reload: () => client.current?.refresh(),
    reconnect: () => setAttempt(value => value + 1) };
}
