/* Tema do app: 'auto' (segue o celular), 'light' ou 'dark', e a cor principal. Guardados só neste aparelho.
   O index.html aplica o tema antes de tudo carregar (sem piscar); aqui ficam a troca e a escuta. */
const KEY = 'pilar-theme';
const listeners = new Set();
const mq = matchMedia('(prefers-color-scheme: dark)');

export const getThemePref = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } };

/* cor principal do app (botões, destaques, aba ativa, treino): [nome, tom claro, tom escuro] */
export const CORES = {
  laranja: ['Laranja', null, null],          // padrão: usa as cores do styles.css
  vermelho: ['Vermelho', '#d6303a', '#f2545b'],
  rosa: ['Rosa', '#d1366f', '#f06595'],
  roxo: ['Roxo', '#7048e8', '#9b7bff'],
  azul: ['Azul', '#1f6fd1', '#4f9ff5'],
};
const KEY_COR = 'pilar-cor';
export const getCor = () => { try { const c = localStorage.getItem(KEY_COR); return CORES[c] ? c : 'laranja'; } catch { return 'laranja'; } };
export function setCor(c) {
  try { localStorage.setItem(KEY_COR, c); } catch {}
  applyTheme();
  listeners.forEach((f) => f());
}
function applyCor(root, dark) {
  const [, claro, escuro] = CORES[getCor()];
  const cor = dark ? escuro : claro;
  if (!cor) { ['--c-treino', '--treino-soft', '--accent-ink'].forEach((v) => root.style.removeProperty(v)); return; }
  root.style.setProperty('--c-treino', cor);
  root.style.setProperty('--treino-soft', `color-mix(in srgb, ${cor} ${dark ? 22 : 14}%, ${dark ? '#141619' : '#ffffff'})`);
  root.style.setProperty('--accent-ink', '#ffffff');
}

export function applyTheme() {
  const pref = getThemePref();
  const dark = pref === 'dark' || (pref === 'auto' && mq.matches);
  const root = document.documentElement;
  applyCor(root, dark);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#0c0d0f' : '#f6f5f1'));
}

export function setThemePref(pref) {
  try { localStorage.setItem(KEY, pref); } catch {}
  applyTheme();
  listeners.forEach((f) => f());
}
export const subscribeTheme = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

mq.addEventListener?.('change', () => { if (getThemePref() === 'auto') applyTheme(); });
applyTheme();
