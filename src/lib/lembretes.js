/* Lembretes de refeições e de água.
   - Android (APK): módulo nativo PilarLembretes — notificação sem som com ✓ Sim / ✗ Não, marca sem abrir o app;
     as respostas ficam guardadas no celular e entram aqui quando o app abre.
   - Navegador (iPhone pela Tela de Início, ou outro): notificação pelo servidor (Web Push); tocar abre o app. */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { state, save, todayKey, subscribe } from './core.js';

/* água: a própria pessoa escolhe a meta do dia, o horário e de quanto em quanto tempo;
   o app divide a meta igualmente pelos lembretes */
export const AGUA_PADRAO = { aguaMeta: 2000, aguaInicio: '08:00', aguaFim: '20:00', aguaIntervalo: 60 };
export const INTERVALOS = [[15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 h'], [90, '1 h 30'], [120, '2 h'], [180, '3 h']];
const minDe = (hhmm) => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
export function aguaHorarios(c = config()) {
  const ini = minDe(c.aguaInicio), fim = minDe(c.aguaFim), passo = Math.max(15, Number(c.aguaIntervalo) || 60);
  const out = [];
  for (let t = ini; t <= fim && out.length < 96; t += passo) out.push({ hora: Math.floor(t / 60), minuto: t % 60 });
  return out;
}
/* garrafa (opcional): um segundo botão na água que soma o tamanho da sua garrafa; 0 = sem garrafa */
export const aguaGarrafa = (c = config()) => Math.max(0, Math.min(3000, Number(c.aguaGarrafa) || 0));
export const aguaMeta = (c = config()) => Math.max(250, Math.min(8000, Number(c.aguaMeta) || 2000));
/* quanto cada lembrete vale (meta dividida igualmente); sem lembretes, um copo de 250 ml */
export function aguaCopo(c = config()) {
  const n = c.agua ? aguaHorarios(c).length : 0;
  return n ? Math.max(10, Math.round(aguaMeta(c) / n)) : 250;
}

const Nativo = registerPlugin('PilarLembretes');
export const ehNativo = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const config = () => ({ refeicoes: false, agua: false, ...AGUA_PADRAO, ...(state.lembretes || {}) });

/* ---- água ---- */
export const aguaDe = (k = todayKey()) => (state.agua || {})[k] || 0;
export function aguaSomar(ml, k = todayKey()) {
  state.agua = state.agua || {};
  state.agua[k] = Math.max(0, Math.min(8000, (state.agua[k] || 0) + ml));
  save();
}

/* id numérico estável a partir de um texto (para os alarmes do Android) */
const idDe = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h % 2000000000) || 1; };

/* lista de lembretes a partir do plano e das escolhas no Perfil */
export function itensLembretes() {
  const c = config(), itens = [];
  if (c.refeicoes) {
    state.diet.groups.filter((g) => /^\d{2}:\d{2}$/.test(g.time || '')).forEach((g) => {
      const [hora, minuto] = g.time.split(':').map(Number);
      itens.push({ id: idDe('r:' + g.id), tipo: 'refeicao', ref: g.id, hora, minuto,
        titulo: `${g.time} · ${g.name}`, texto: `Já fez o ${g.name.toLowerCase()}?` });
    });
  }
  if (c.agua) {
    const ml = aguaCopo(c);
    aguaHorarios(c).forEach(({ hora, minuto }) => itens.push({ id: idDe(`a:${hora}:${minuto}`), tipo: 'agua', ref: `${hora}:${minuto}|${ml}`, hora, minuto,
      titulo: 'Água', texto: `Já bebeu ${ml} ml de água?` }));
  }
  return itens;
}

/* ---- respostas tocadas na notificação (Android) ---- */
function aplicar(acoes) {
  let mudou = false;
  for (const a of acoes) {
    if (a.resposta !== 'sim') continue;
    if (a.tipo === 'refeicao') {
      const g = state.diet.groups.find((x) => x.id === a.ref);
      if (!g) continue;
      state.dietLog[a.data] = state.dietLog[a.data] || { checked: {}, extras: [] };
      if (state.dietLog[a.data].checked[a.ref] == null) { state.dietLog[a.data].checked[a.ref] = { opt: 0 }; mudou = true; }
    } else if (a.tipo === 'agua') {
      state.agua = state.agua || {};
      const ml = Number(String(a.ref || '').split('|')[1]) || aguaCopo();
      state.agua[a.data] = Math.min(8000, (state.agua[a.data] || 0) + ml); mudou = true;
    }
  }
  if (mudou) save();
}
export async function aplicarPendentes() {
  if (!ehNativo()) return;
  try {
    const { acoes } = await Nativo.pendentes();
    if (acoes?.length) { aplicar(acoes); await Nativo.limparPendentes(); }
  } catch { /* app antigo sem o módulo nativo */ }
}

/* ---- agendar ---- */
let ultimo = '';
export async function sincronizar(forcar = false) {
  const itens = itensLembretes();
  const assinatura = JSON.stringify(itens);
  if (!forcar && assinatura === ultimo) return;
  ultimo = assinatura;
  if (ehNativo()) {
    try { await Nativo.agendar({ itens }); } catch { /* sem módulo nativo */ }
    return;
  }
  const { sincronizarPush } = await import('./push.js');
  await sincronizarPush(itens);
}

/* permissão + ligar/desligar; devolve uma mensagem se não deu */
/* muda meta, horário ou intervalo da água e reagenda */
export async function ajustarAgua(campos) {
  state.lembretes = { ...config(), ...campos };
  save();
  await sincronizar(true);
}

export async function ligar(tipo, on) {
  if (on) {
    if (ehNativo()) {
      try { const r = await Nativo.pedirPermissao(); if (!r.permitido) return 'Permita as notificações do Pilar nos ajustes do Android.'; }
      catch { return 'Atualize o app (APK) para usar os lembretes.'; }
    } else {
      const { ativarPush } = await import('./push.js');
      const erro = await ativarPush();
      if (erro) return erro;
    }
  }
  state.lembretes = { ...config(), [tipo]: on };
  save();
  await sincronizar(true);
  return '';
}

/* manter a agenda em dia quando o plano muda (horários das refeições) */
let iniciado = false;
export function iniciarLembretes() {
  if (iniciado) return; iniciado = true;
  aplicarPendentes();
  sincronizar();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') aplicarPendentes(); });
  let t = null;
  subscribe(() => { clearTimeout(t); t = setTimeout(() => sincronizar(), 2000); });
}
