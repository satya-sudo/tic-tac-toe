// REST provides initial/recovery snapshots; only the socket supplies live updates.
export function socketUrl(gameId, pageUrl = window.location.href) {
  const url = new URL(`/games/${encodeURIComponent(gameId)}/ws`, pageUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.href;
}

export function validGame(game, gameId) {
  return game?.gameId === gameId && [0, 1, 2, 3, 4].includes(game.status)
    && typeof game.turn === 'string' && Array.isArray(game.board) && game.board.length === 3
    && game.board.every(row => Array.isArray(row) && row.length === 3 && row.every(cell => [0, 1, 2].includes(cell)))
    && [game.player1, game.player2].every(player => player === null || (typeof player === 'object' && player !== undefined));
}

export function connectGame({ gameId, url, getGame, onGame, onError, onStatus,
  Socket = WebSocket, schedule = setTimeout, cancel = clearTimeout }) {
  let disposed = false;
  let missing = false;
  let hasOpened = false;
  let socket;
  let retryTimer;
  let openTimer;
  let attempts = 0;
  let revision = 0;
  let request = 0;
  let controller;
  const delays = [1000, 2000, 4000, 8000, 16000];

  async function refresh() {
    if (disposed) return;
    controller?.abort();
    controller = new AbortController();
    const currentController = controller;
    const version = revision;
    const token = ++request;
    const timeout = schedule(() => currentController.abort(), 10000);
    try {
      const game = await getGame(gameId, currentController.signal);
      if (disposed || token !== request || version !== revision) return;
      if (!validGame(game, gameId)) throw new Error('The server returned an invalid game state.');
      onGame(game); onError('');
      if (socket?.readyState === 1) onStatus('connected');
    } catch (error) {
      if (!disposed && token === request && version === revision) {
        onError(error.name === 'AbortError' ? 'Game refresh timed out. Try refreshing again.' : error.message);
        if (error.status === 404) {
          missing = true; cancel(retryTimer);
          if (socket) { socket.onclose = null; socket.close(); }
          onStatus('disconnected');
        }
      }
    } finally { cancel(timeout); }
  }

  function connect() {
    if (disposed) return;
    onStatus(attempts ? 'reconnecting' : 'connecting');
    const current = new Socket(url);
    socket = current;
    openTimer = schedule(() => current.close(), 10000);
    current.onopen = () => {
      if (disposed || socket !== current) return;
      cancel(openTimer);
      hasOpened = true;
      // Subscribe before fetching so changes during the fetch cannot be missed.
      refresh();
    };
    current.onmessage = event => {
      if (disposed || socket !== current) return;
      try {
        const game = JSON.parse(event.data);
        if (!validGame(game, gameId)) throw new Error();
        revision++;
        onGame(game); onError(''); onStatus('connected');
      } catch { onError('An invalid live update was received. Refresh the game to recover.'); }
    };
    current.onerror = () => {
      if (!disposed && socket === current) onStatus('disconnected');
      // Browsers follow socket errors with close; only close schedules a retry.
    };
    current.onclose = () => {
      if (disposed || socket !== current) return;
      cancel(openTimer);
      revision++; // Ignore snapshots from the closed connection.
      onStatus('disconnected');
      // A failed handshake can mean a missing game after a backend restart.
      if (!hasOpened && attempts === 0) refresh();
      if (!missing && attempts < delays.length) {
        const delay = delays[attempts++];
        retryTimer = schedule(connect, delay);
      } else if (!missing) onError('Live connection lost. Select Reconnect to try again.');
    };
  }
  connect();
  return {
    refresh,
    dispose() {
      disposed = true;
      controller?.abort();
      cancel(retryTimer); cancel(openTimer);
      socket?.close();
    },
  };
}
