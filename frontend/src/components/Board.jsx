import React from 'react';
import { symbols } from '../game';

export default function Board({ board, enabled, onMove }) {
  return <div className="board" role="group" aria-label="Tic tac toe board">{board.flatMap((row, x) => row.map((value, y) => <button key={`${x}-${y}`} className={`cell ${value === 1 ? 'x' : value === 2 ? 'o' : ''}`} disabled={!enabled || value !== 0} onClick={() => onMove(x, y)} aria-label={`Row ${x + 1}, column ${y + 1}: ${symbols[value] || 'empty'}`}>{symbols[value]}</button>))}</div>;
}
