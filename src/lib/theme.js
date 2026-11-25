/* Tema do app: 'auto' (segue o celular), 'light' ou 'dark'. Guardado só neste aparelho.
   O index.html aplica o tema antes de tudo carregar (sem piscar); aqui ficam a troca e a escuta. */
const KEY = 'pilar-theme';
const listeners = new Set();
const mq = matchMedia('(prefers-color-scheme: dark)');

export const getThemePref = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } };

export function applyTheme() {
  const pref = getThemePref();
  const dark = pref === 'dark' || (pref === 'auto' && mq.matches);
  const root = document.documentElement;
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
