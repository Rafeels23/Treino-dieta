/* Navegação entre abas e folhas (janelas que sobem de baixo). */
import { state, save } from './core.js';

const listeners = new Set();
const emit = () => listeners.forEach((f) => f());
export const subscribeUI = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/* ----- abas ----- */
export function go(tab) {
  closeSheet();
  state.ui.tab = tab;
  save();
  window.scrollTo(0, 0);
}

/* ----- folhas -----
   openSheet(() => <MinhaFolha />, nivel)
   nivel: profundidade dentro da folha (1 = raiz, 2 = filha...). Ir para um nível maior desliza
   da direita, voltar para um menor desliza da esquerda. A função é chamada a cada render,
   então a folha sempre mostra o estado atual. */
let sheet = { render: null, level: 0, dir: 0, key: 0 };
export const getSheet = () => sheet;
export function openSheet(render, level = 0) {
  const dir = sheet.render && level && sheet.level && level !== sheet.level ? (level > sheet.level ? 1 : -1) : 0;
  sheet = { render, level, dir, key: sheet.key + 1 };
  emit();
}
export function closeSheet() {
  if (!sheet.render) return;
  sheet = { render: null, level: 0, dir: 0, key: sheet.key + 1 };
  emit();
}
