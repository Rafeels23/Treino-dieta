/* Peças de interface compartilhadas por todas as telas. */
import { useEffect, useRef } from 'react';
import { Anim } from './Illu.jsx';
import { ICONS, br, initials, state } from '../lib/core.js';
import { go } from '../lib/ui.js';
import { reducedMotion } from '../lib/effects.js';

const EXTRA = { x: '<path d="M6 6l12 12M18 6 6 18"/>', pause: '<path d="M9 6v12M15 6v12"/>' };
export function Icon({ n, className = 'i' }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[n] || EXTRA[n] || '' }} />;
}

/* Título que surge palavra por palavra, saindo do desfoque (animação no CSS, ao entrar na tela) */
export function BlurTitle({ text }) {
  const words = String(text).split(' ');
  return <>{words.map((w, i) => <span key={i}><span className="w" style={{ '--i': i }}>{w}</span>{i < words.length - 1 ? ' ' : ''}</span>)}</>;
}

/* o perfil mora no canto superior direito de toda tela */
export function AvatarBtn() {
  const nome = state.profile.nome;
  return (
    <button className="avatar" onClick={() => go('perfil')} aria-label="Seu perfil">
      {nome ? initials(nome) : <Icon n="user" />}
    </button>
  );
}

export function Head({ kicker, title, action = null, emoji = null }) {
  return (
    <header className="head">
      <div><div className="kicker">{kicker}</div><h1><BlurTitle text={title} />{emoji ? <Anim nome={emoji} tamanho={34} className="hello-anim" /> : null}</h1></div>
      <div className="head-actions">{action}<AvatarBtn /></div>
    </header>
  );
}

export function Section({ title, action = null, children, className = '' }) {
  return (
    <section className={`section ${className}`}>
      <div className="section-title"><span>{title}</span>{action}</div>
      {children}
    </section>
  );
}

/* Anéis de progresso (de fora para dentro). items: [{ v: 0..1, color }] */
export function Rings({ items, size = 128, sw = 12, innerRef }) {
  const c = size / 2;
  return (
    <svg ref={innerRef} className="rings" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {items.map((it, i) => {
        const r = c - sw / 2 - i * (sw + 4), len = 2 * Math.PI * r, v = Math.max(0, Math.min(1, it.v || 0));
        return (
          <g key={i}>
            <circle className="track" cx={c} cy={c} r={r} strokeWidth={sw} style={{ stroke: it.color }} />
            {v > 0 && <circle className="val" cx={c} cy={c} r={r} strokeWidth={sw}
              style={{ stroke: it.color, strokeDasharray: len.toFixed(1), '--len': len.toFixed(1), '--off': (len * (1 - v)).toFixed(1) }} />}
          </g>
        );
      })}
    </svg>
  );
}

/* Número que sobe até o valor. `k` identifica o número para continuar de onde parou. */
const lastValue = new Map();
export function CountUp({ value, dec = 0, k = '' }) {
  const ref = useRef(null);
  const fmt = (v) => (dec ? br(v, dec) : String(Math.round(v)));
  useEffect(() => {
    const el = ref.current, fim = Number(value);
    if (!el || !Number.isFinite(fim)) return undefined;
    const ini = k && lastValue.has(k) ? lastValue.get(k) : 0;
    if (k) lastValue.set(k, fim);
    if (reducedMotion() || ini === fim) { el.textContent = fmt(fim); return undefined; }
    let raf, t0 = performance.now();
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(ini + (fim - ini) * e);
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{fmt(Number(value) || 0)}</span>;
}

/* Botões de escolha única. toggle: tocar no escolhido desmarca. */
export function Seg({ options, value, onChange, toggle = false }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button type="button" key={String(v)} className={String(v) === String(value ?? '') ? 'on' : ''}
          onClick={() => onChange(toggle && String(v) === String(value ?? '') ? '' : v)}>{l}</button>
      ))}
    </div>
  );
}

/* Cancelar + Salvar no rodapé das folhas */
export function SheetActions({ onCancel, onOk, ok = 'Salvar', okDisabled = false }) {
  return (
    <div className="sheet-actions">
      <button type="button" className="btn soft" onClick={onCancel}>Cancelar</button>
      <button type="button" className="btn" onClick={onOk} disabled={okDisabled}>{ok}</button>
    </div>
  );
}
