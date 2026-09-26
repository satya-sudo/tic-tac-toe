const messages = {
  'invalid game id': 'That game ID wasn’t found. Check it and try again.',
  'game does not exist': 'That game no longer exists. Create a new game.',
  'too many players': 'This game is full. Try another game or create your own.',
  'invalid move': 'That square is unavailable. Choose another empty square.',
  'invalid player id': 'It isn’t your turn. Wait for the other player.',
  'game already finished': 'This game has already finished.',
  'not enough players': 'Two players need to join before the game can start.',
};

export async function request(path, body, method = 'POST', signal, allowEmpty = false) {
  let response;
  try {
    response = await fetch(path, {
      method, signal: signal || AbortSignal.timeout(10000),
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Cannot reach the game server. Check your connection and try again.');
  }
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = null; }
  if (!response.ok) {
    const detail = (data?.message || data?.error || raw || '').toString().trim();
    const error = new Error(messages[detail.toLowerCase()] || (response.status >= 500 ? 'The game server is unavailable. Please try again.' : detail || 'The request failed. Please try again.'));
    error.status = response.status;
    throw error;
  }
  if (allowEmpty && !raw.trim()) return null;
  if (!data) throw new Error('The server returned an unexpected response. Please try again.');
  return data;
}

const gamePath = id => `/games/${encodeURIComponent(id)}`;
export const api = {
  create: () => request('/games'),
  join: (id, name) => request(`${gamePath(id)}/join`, { name }),
  start: id => request(`${gamePath(id)}/start`),
  get: (id, signal) => request(gamePath(id), undefined, 'GET', signal),
  move: (id, playerId, x, y) => request(`${gamePath(id)}/moves`, { playerId, x, y }, 'POST', undefined, true),
};
