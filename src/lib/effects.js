/* Efeitos escritos para o Pilar: faíscas no toque, vibração, comemoração do dia 100%. */
import { state, save, todayKey } from './core.js';

let lastTap = null;
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => { lastTap = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
}
const AREA_COLOR = { treino: '--c-treino', dieta: '--c-dieta', rotina: '--c-rotina' };
export const cssVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function spark(x, y, colors, n = 10, dist = 26) {
  if (reducedMotion()) return;
  const box = document.createElement('div');
  box.className = 'spark'; box.style.left = x + 'px'; box.style.top = y + 'px';
  for (let i = 0; i < n; i++) {
    const r = document.createElement('i');
    r.style.setProperty('--a', `${(360 / n) * i + Math.random() * 12}deg`);
    r.style.setProperty('--d', `${dist + Math.random() * dist * 0.4}px`);
    r.style.background = colors[i % colors.length];
    box.appendChild(r);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 700);
}

export const buzzOnly = (p) => { try { if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(p); } catch {} };

/* vibra e solta faíscas no ponto tocado, na cor da aba atual */
export function buzz(ms = 12) {
  buzzOnly(ms);
  if (lastTap && Date.now() - lastTap.t < 1200) spark(lastTap.x, lastTap.y, [cssVar(AREA_COLOR[state.ui.tab] || '--c-dieta')]);
}

/* Dia 100%: explosão nas três cores a partir do elemento, uma vez por dia */
export function celebrateDay(getEl) {
  const k = todayKey();
  if (state.ui.celebrated === k) return;
  state.ui.celebrated = k; save();
  setTimeout(() => {
    const r = getEl()?.getBoundingClientRect();
    if (!r) return;
    const cols = ['--c-treino', '--c-dieta', '--c-rotina'].map(cssVar);
    spark(r.left + r.width / 2, r.top + r.height / 2, cols, 18, 70);
    setTimeout(() => spark(r.left + r.width / 2, r.top + r.height / 2, cols, 14, 110), 160);
    buzzOnly([20, 60, 30]);
  }, 900);
}
