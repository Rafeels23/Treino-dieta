/* Pulseira (Amazfit pelo app Zepp → Saúde Connect/Health Connect → Pilar). Só no app Android.
   Lê passos, calorias ativas, sono e exercícios; os exercícios da pulseira viram atividades automáticas
   (menos musculação, que já é o treino registrado no Pilar). */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { state, save } from './core.js';

const Saude = registerPlugin('PilarSaude');
export const pulseiraDisponivel = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
export const PLAY_SAUDE = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

const NOMES = {
  caminhada: 'Caminhada', corrida: 'Corrida', bike: 'Bicicleta', natacao: 'Natação', trilha: 'Trilha',
  eliptico: 'Elíptico', yoga: 'Yoga/Pilates', hiit: 'HIIT', futebol: 'Futebol', danca: 'Dança',
  escada: 'Escada', remo: 'Remo', outro: 'Exercício', musculacao: 'Musculação',
};

export const saude = () => state.saude || {};

export async function estadoPulseira() {
  if (!pulseiraDisponivel()) return { status: 'indisponivel', permitido: false };
  try { return await Saude.estado(); } catch { return { status: 'app_antigo', permitido: false }; }
}

export async function conectarPulseira() {
  if (!pulseiraDisponivel()) return 'A pulseira funciona no app Android (APK).';
  let r;
  try { r = await Saude.estado(); } catch { return 'Atualize o app (APK) para conectar a pulseira.'; }
  if (r.status !== 'ok') return r.status === 'atualizar' ? 'Atualize o Saúde Connect na Play Store.' : 'Instale o Saúde Connect na Play Store.';
  if (!r.permitido) {
    try { r = await Saude.pedirPermissoes(); } catch { return 'Não consegui pedir a permissão. Tente de novo.'; }
    if (!r.permitido) return 'Permita passos, sono, exercícios, calorias e distância para o Pilar no Saúde Connect.';
  }
  state.saude = { ...saude(), conectado: true };
  save();
  await sincronizarPulseira(true);
  return '';
}

export function desconectarPulseira() { state.saude = { ...saude(), conectado: false }; save(); }

/* soma o sono por noite (a noite conta no dia em que você acordou) */
function sonoPorDia(sessoes) {
  const m = {};
  sessoes.forEach((s) => { m[s.fim] = (m[s.fim] || 0) + Number(s.minutos || 0); });
  return m;
}

let lendo = false;
export async function sincronizarPulseira(forcar = false) {
  const s = saude();
  if (!pulseiraDisponivel() || !s.conectado || lendo) return;
  if (!forcar && s.ultima && Date.now() - s.ultima < 10 * 60 * 1000) return;   // no máximo a cada 10 min
  lendo = true;
  try {
    const r = await Saude.ler({ dias: s.ultima ? 7 : 30 });
    const dias = { ...(s.dias || {}) };
    (r.dias || []).forEach((d) => { dias[d.data] = { passos: Number(d.passos) || 0, kcal: Number(d.kcal) || 0 }; });
    const sono = { ...(s.sono || {}), ...sonoPorDia(r.sono || []) };
    /* guarda só os últimos 90 dias */
    const corte = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
    Object.keys(dias).forEach((k) => { if (k < corte) delete dias[k]; });
    Object.keys(sono).forEach((k) => { if (k < corte) delete sono[k]; });

    let ativs = state.activities.slice();
    (r.exercicios || []).forEach((e) => {
      if (e.tipo === 'musculacao' || Number(e.minutos) < 3) return;
      const id = `hc:${e.id}`;
      const a = { id, date: e.data, tipo: e.titulo || NOMES[e.tipo] || 'Exercício', minutos: Number(e.minutos) || 0,
        kcal: Number(e.kcal) || 0, ...(e.km ? { km: e.km } : {}), origem: 'pulseira' };
      const i = ativs.findIndex((x) => x.id === id);
      if (i >= 0) ativs[i] = { ...ativs[i], ...a }; else ativs.push(a);
    });
    state.activities = ativs;
    state.saude = { ...s, conectado: true, dias, sono, ultima: Date.now(), erro: '' };
    save();
  } catch (e) {
    state.saude = { ...s, erro: String(e?.message || e) === 'sem_permissao' ? 'Permissão do Saúde Connect retirada. Toque em Conectar de novo.' : 'Não consegui ler a pulseira agora.' };
    save();
  } finally { lendo = false; }
}

let iniciado = false;
export function iniciarPulseira() {
  if (iniciado || !pulseiraDisponivel()) return; iniciado = true;
  sincronizarPulseira();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sincronizarPulseira(); });
}
