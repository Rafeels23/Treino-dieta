/* Regras de digitação usadas no app inteiro: o campo já descarta o que não vale enquanto a pessoa digita. */

/* só dígitos (até `max` caracteres) */
export const soInteiro = (v, max = 6) => String(v ?? '').replace(/\D/g, '').slice(0, max);

/* dígitos com uma vírgula só (ponto vira vírgula) e até `casas` casas decimais */
export function soDecimal(v, casas = 2, max = 6) {
  let s = String(v ?? '').replace(/\./g, ',').replace(/[^\d,]/g, '');
  const i = s.indexOf(',');
  if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/,/g, '').slice(0, casas);
  const [int, dec] = s.split(',');
  return (int || '').slice(0, max) + (dec !== undefined ? `,${dec}` : '');
}

/* repetições: números e traço ("12", "8-12", "15-12-10-8-8"); sem traço no começo nem dois seguidos */
export const soFaixa = (v) => String(v ?? '').replace(/\s*(?:a|à|á|até|ate)\s*(?=\d|$)|\s+/gi, '-').replace(/[^\d-]/g, '').replace(/^-+/, '').replace(/-{2,}/g, '-').slice(0, 24);

/* valor numérico dentro de um intervalo (ou null se vazio) — para conferir antes de salvar */
export function dentro(v, min, max) {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
}

/* como mostrar as repetições/tempo de um exercício */
export function repsTexto(e) {
  const r = String(e?.reps ?? '');
  if (!/^\d+$/.test(r)) return r;
  return e.tipo === 'tempo' ? `${r}s` : e.tipo === 'cardio' ? `${r} min` : r;
}
