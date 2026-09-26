import React, { useState } from 'react';

export default function ShareCode({ gameId }) {
  const [feedback, setFeedback] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(gameId); setFeedback('Copied! Send it to a friend.'); }
    catch { setFeedback('Select the game ID above and copy it manually.'); }
  }
  return <div className="share-code">
    <label htmlFor="share-id" className="eyebrow">YOUR GAME ID</label>
    <div className="code-row"><input id="share-id" readOnly value={gameId} onFocus={event => event.target.select()} /><button className="button small secondary" onClick={copy}>Copy ID ↗</button></div>
    {feedback && <small role="status">{feedback}</small>}
  </div>;
}
