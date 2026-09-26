import React, { useEffect, useRef, useState } from 'react';

// A nod to Solitaire: winning tiles tumble, bounce, and leave fading trails.
// Decorative only — the server's result and the actual board never change.
export default function WinCelebration({ winner, boardRef }) {
  const canvasRef = useRef(null);
  const stopRef = useRef(null);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || motion.matches) { setPlaying(false); return; }

    let frame;
    let stopped = false;
    let width, height, origin;
    let particles = [];
    let start;
    let previous;
    let emitted = 0;
    const color = winner === 1 ? '#44684d' : '#c18058';
    const mark = winner === 1 ? 'X' : 'O';

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const bounds = boardRef.current?.getBoundingClientRect();
      origin = { x: bounds ? bounds.left + bounds.width / 2 : width / 2,
        y: Math.max(70, Math.min(height * .6, bounds ? bounds.top + bounds.height / 2 : height / 2)) };
      particles = [];
    }
    function stop() {
      stopped = true;
      cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
      setPlaying(false);
    }
    function dismiss(event) { if (event.key === 'Escape') stop(); }
    function visibility() { if (document.hidden) stop(); }
    function preference(event) { if (event.matches) stop(); }
    function tick(now) {
      if (stopped) return;
      start ??= now;
      previous ??= now;
      const elapsed = now - start;
      const dt = Math.min((now - previous) / 1000, .035);
      previous = now;
      if (elapsed > 6500) { stop(); return; }

      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = `rgba(0,0,0,${1 - Math.exp(-dt * 3.5)})`;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'source-over';

      if (emitted < 20 && elapsed >= emitted * 145) {
        const direction = emitted % 2 ? 1 : -1;
        particles.push({ x: origin.x, y: origin.y,
          vx: direction * (110 + Math.random() * 180), vy: -260 - Math.random() * 210,
          angle: 0, spin: direction * (1 + Math.random() * 2), size: width < 600 ? 34 : 46 });
        emitted++;
      }
      context.globalAlpha = Math.min(1, (6500 - elapsed) / 1000);
      particles = particles.filter(p => p.x > -100 && p.x < width + 100);
      for (const p of particles) {
        p.vy += 850 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        const floor = height - p.size - 12;
        if (p.y > floor && p.vy > 0) { p.y = floor; p.vy *= -.72; }
        context.save();
        context.translate(p.x, p.y);
        context.rotate(p.angle);
        context.fillStyle = '#fffefa';
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(-p.size / 2, -p.size / 2, p.size, p.size, 7);
        context.fill(); context.stroke();
        context.fillStyle = color;
        context.font = `600 ${p.size * .68}px sans-serif`;
        context.textAlign = 'center'; context.textBaseline = 'middle';
        context.fillText(mark, 0, 1);
        context.restore();
      }
      context.globalAlpha = 1;
      frame = requestAnimationFrame(tick);
    }
    stopRef.current = stop;
    resize();
    frame = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', dismiss);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', preference);
    return () => {
      stopped = true;
      stopRef.current = null;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', dismiss);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
    };
  }, [winner, run, boardRef]);

  return <>
    {playing && <canvas ref={canvasRef} className="win-canvas" aria-hidden="true"/>}
    <div className={`win-ribbon ${winner === 2 ? 'win-ribbon-o' : ''}`}>
      <span className="win-ribbon-mark" aria-hidden="true">{winner === 1 ? 'X' : 'O'}</span>
      <div><strong>Three in a row. Take a bow.</strong></div>
      <button className="text-button celebration-replay" onClick={() => { setPlaying(true); setRun(value => value + 1); }}>Replay ↻</button>
      {playing && <button className="text-button" aria-label="Dismiss celebration" onClick={() => stopRef.current?.()}>✕</button>}
    </div>
  </>;
}
