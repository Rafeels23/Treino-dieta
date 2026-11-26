/* Sequência de dias com 1 dia de folga por semana, e o resumo da semana (aparece no domingo e na segunda). */
import { state, todayKey, keyToDate, finished, mealCheck, routinesOf, morningSorted } from './core.js';

const somaDias = (k, n) => { const d = keyToDate(k); d.setDate(d.getDate() + n); return todayKey(d); };
const segundaDe = (k) => { const d = keyToDate(k); return somaDias(k, -((d.getDay() + 6) % 7)); };

/* o dia conta se teve treino ou atividade, ou se metade das refeições ou dos hábitos foi cumprida */
export function diaFeito(k, treinos = null) {
  const tr = treinos || new Set(finished().map((s) => todayKey(new Date(s.start))));
  if (tr.has(k) || (state.activities || []).some((a) => a.date === k)) return true;
  const gs = state.diet.groups, log = state.dietLog[k];
  if (gs.length && log && gs.filter((g) => mealCheck(log, g)).length / gs.length >= 0.5) return true;
  const rot = routinesOf(k), rlog = (state.routineLog || {})[k] || {};
  return rot.length > 0 && rot.filter((r) => rlog[r.id]).length / rot.length >= 0.5;
}

/* dias seguidos: cada semana (seg a dom) perdoa 1 dia; o segundo dia perdido na mesma semana quebra a sequência.
   Hoje ainda em andamento não quebra nada. */
export function sequencia() {
  const tr = new Set(finished().map((s) => todayKey(new Date(s.start))));
  const hoje = todayKey();
  let k = diaFeito(hoje, tr) ? hoje : somaDias(hoje, -1);
  let dias = 0; const folgas = new Map();
  for (let i = 0; i < 400; i++, k = somaDias(k, -1)) {
    if (diaFeito(k, tr)) { dias++; continue; }
    const sem = segundaDe(k);
    if (folgas.has(sem)) break;
    folgas.set(sem, k);
  }
  /* a folga só faz sentido dentro da sequência: se nada foi feito antes dela, ela não conta */
  const folgaEstaSemana = folgas.has(segundaDe(hoje));
  return { dias, folgaEstaSemana };
}

/* resumo da semana: domingo mostra a semana atual; segunda mostra a semana que acabou */
export function semanaDoResumo() {
  const hoje = todayKey(), dow = keyToDate(hoje).getDay();
  if (dow !== 0 && dow !== 1) return null;
  const seg = dow === 0 ? segundaDe(hoje) : somaDias(segundaDe(hoje), -7);
  return Array.from({ length: 7 }, (_, i) => somaDias(seg, i));
}

export function resumoSemana(dias) {
  const ini = keyToDate(dias[0]).getTime(), fim = keyToDate(dias[6]).getTime() + 864e5;
  const treinos = finished().filter((s) => s.start >= ini && s.start < fim).length;
  const gs = state.diet.groups;
  let ref = 0, refTot = 0;
  dias.forEach((k) => { const log = state.dietLog[k]; refTot += gs.length; if (log) ref += gs.filter((g) => mealCheck(log, g)).length; });
  const media = (vals) => { const v = vals.filter((x) => x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const agua = media(dias.map((k) => (state.agua || {})[k] || 0));
  const sd = state.saude || {};
  const passos = sd.conectado ? media(dias.map((k) => sd.dias?.[k]?.passos || 0)) : null;
  const sono = sd.conectado ? media(dias.map((k) => sd.sono?.[k] || 0)) : null;
  const pesos = morningSorted().filter((x) => x.peso != null && x.date <= dias[6]);
  const naSemana = pesos.filter((x) => x.date >= dias[0]);
  const antes = pesos.filter((x) => x.date < dias[0]);
  const dPeso = naSemana.length && antes.length ? naSemana[naSemana.length - 1].peso - antes[antes.length - 1].peso : null;
  return { treinos, refPct: refTot ? Math.round((ref / refTot) * 100) : null, agua, passos, sono, dPeso };
}
