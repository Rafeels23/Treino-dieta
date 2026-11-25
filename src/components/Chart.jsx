/* Gráfico de linha de uma série: toque para ver o valor. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { br } from '../lib/core.js';
import { Icon } from './ui.jsx';

export default function Chart({ id, points, unit, className = '' }) {
  const wrap = useRef(null), line = useRef(null);
  const [w, setW] = useState(0);
  const [sel, setSel] = useState(null);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = line.current;
    if (!el) return;
    try {
      const len = Math.ceil(el.getTotalLength());
      el.style.strokeDasharray = len; el.style.strokeDashoffset = len;
      el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    } catch {}
  }, [w, points.length]);

  if (points.length < 2) return <div className="empty"><Icon n="chart" /><div>Registre pelo menos duas vezes para ver a linha.</div></div>;

  const W = Math.max(0, w - 16), H = 180, P = { l: 6, r: 40, t: 30, b: 22 };
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const span = hi - lo; lo -= span * 0.1; hi += span * 0.1;
  const last = points.length - 1;
  const X = (i) => P.l + (i * (W - P.l - P.r)) / last;
  const Y = (v) => P.t + ((hi - v) * (H - P.t - P.b)) / (hi - lo);
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${X(last).toFixed(1)} ${H - P.b} L${P.l} ${H - P.b} Z`;
  const i = sel ?? last;

  const pick = (ev) => {
    const r = ev.currentTarget.getBoundingClientRect();
    setSel(Math.max(0, Math.min(last, Math.round(((ev.clientX - r.left - P.l) / (W - P.l - P.r)) * last))));
  };
  const tipLeft = (() => { const x = X(i) + 8; return Math.min(Math.max(x, 70), w - 70); })();

  return (
    <div className={`chart-wrap ${className}`} ref={wrap}
      onPointerDown={pick} onPointerMove={(ev) => { if (ev.buttons || ev.pointerType === 'mouse') pick(ev); }}
      onPointerLeave={(ev) => { if (ev.pointerType === 'mouse') setSel(null); }}>
      {W > 0 && (
        <svg className="chart" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico em ${unit}`}>
          {ticks.map((t, k) => (
            <g key={k}><line className="grid" x1={P.l} x2={W - P.r + 6} y1={Y(t)} y2={Y(t)} /><text className="ax" x={W - P.r + 10} y={Y(t) + 4}>{br(t)}</text></g>
          ))}
          <defs><linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1"><stop className="area-stop" offset="0" stopOpacity=".32" /><stop className="area-stop" offset="1" stopOpacity="0" /></linearGradient></defs>
          <path d={area} fill={`url(#g-${id})`} /><path ref={line} className="line" d={d} />
          <text className="ax" x={P.l} y={H - 4}>{points[0].label}</text>
          <text className="ax" x={X(last)} y={H - 4} textAnchor="end">{points[last].label}</text>
          {sel != null && <line className="cross" x1={X(i)} x2={X(i)} y1={P.t - 6} y2={H - P.b} />}
          <circle className="pt" r="5" cx={X(i)} cy={Y(points[i].y)} />
        </svg>
      )}
      {sel != null && <div className="tip" style={{ left: tipLeft }}>{`${br(points[i].y)} ${unit} · ${points[i].label}`}</div>}
    </div>
  );
}
