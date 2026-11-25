/* Lógica do Pilar sem interface: estado, planos, parser da dieta, equivalências,
   compras, receitas, IA e peso. Extraída do app original (app.js) sem mudanças de regra. */

export const STORE_KEY = 'treino-dieta-v1';

export const uid = () => Math.random().toString(36).slice(2, 10);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const todayKey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const keyToDate = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const fmtDay = (k) => keyToDate(k).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
export const fmtDayLong = (k) => keyToDate(k).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '');
export const fmtClock = (sec) => { const s = Math.max(0, Math.round(Math.abs(sec))); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
export const br = (n, d = 1) => (n == null ? '—' : n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d }));
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const ICONS = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5h4v5"/>',
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  meal: '<path d="M7 3v7M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M7 10v11"/><path d="M18 3c-2.2 1.4-3.5 4-3.5 7.5H18V21"/>',
  chart: '<path d="M4 4v16h16"/><path d="m7.5 14.5 3.5-4 3 2.5 5-6"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8.5 9.5a5 5 0 0 1 7 0"/><path d="m12 12 1.5-2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  left: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
  right: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  pulse: '<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
  pencil: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  swap: '<path d="M5 8h13l-3.5-3.5M19 16H6l3.5 3.5"/>',
  cart: '<path d="M3 4.5h2.2l2 10h10.6l2-7.5H6"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  book: '<path d="M5 5a1.5 1.5 0 0 1 1.5-1.5H18.5V17H6.5A1.5 1.5 0 0 0 5 18.5z"/><path d="M5 18.5A1.5 1.5 0 0 0 6.5 20h12"/>',
  camera: '<path d="M4 8.5h3.2L9 6h6l1.8 2.5H20V19H4z"/><circle cx="12" cy="13.5" r="3.3"/>',
  ruler: '<path d="M3.5 15.5 15.5 3.5l5 5-12 12z"/><path d="m8 11 2 2M11 8l2 2M14 5l1.5 1.5"/>',
  pill: '<rect x="3.5" y="8.5" width="17" height="7" rx="3.5"/><path d="M12 8.5v7"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M12 8v4l3 2"/>',
};

export const ex = (name, reps, rest = 60, tipo = 'carga', sets) => ({ name, reps, rest, tipo, sets });
export const TEMPLATES = [
  { name: 'Corpo todo 1', exercises: [
    ex('Agachamento goblet', '12-15'), ex('Supino reto com halteres', '12'),
    ex('Remada baixa no cabo', '12'), ex('Elevação pélvica', '15'),
    ex('Desenvolvimento com halteres', '12'), ex('Prancha', '30-45s', 45, 'tempo'),
    ex('Esteira inclinada', '15 min', 0, 'cardio', 1),
  ] },
  { name: 'Corpo todo 2', exercises: [
    ex('Leg press 45°', '15'), ex('Puxada frontal', '12'),
    ex('Supino inclinado na máquina', '12'), ex('Stiff com halteres', '12'),
    ex('Elevação lateral', '15', 45), ex('Abdominal infra', '15', 45),
    ex('Bike intervalada (30s forte, 60s leve)', '15 min', 0, 'cardio', 1),
  ] },
  { name: 'Corpo todo 3', exercises: [
    ex('Passada (cada perna)', '12'), ex('Remada curvada com halteres', '12'),
    ex('Crucifixo na máquina', '12'), ex('Mesa flexora', '15'),
    ex('Rosca direta + tríceps corda', '12'), ex('Agachamento com salto', '10'),
    ex('Elíptico ou escada', '15 min', 0, 'cardio', 1),
  ] },
  { name: 'Cardio e core', exercises: [
    ex('Caminhada rápida ou trote', '25 min', 0, 'cardio', 1),
    ex('Prancha lateral (cada lado)', '30s', 30, 'tempo'),
    ex('Abdominal bicicleta', '20', 30), ex('Mountain climber', '30s', 30, 'tempo'),
    ex('Superman', '15', 30),
  ] },
  { name: 'Inferiores e cardio', exercises: [
    ex('Agachamento no Smith', '12'), ex('Cadeira extensora', '15'),
    ex('Cadeira abdutora', '15', 45), ex('Panturrilha em pé', '15', 45),
    ex('Esteira inclinada', '20 min', 0, 'cardio', 1),
  ] },
];
export const LEVEL = { iniciante: { sets: 3, mul: 1.2 }, intermediario: { sets: 3, mul: 1 }, avancado: { sets: 4, mul: 0.8 } };
export const LEVEL_LABEL = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

export function generatePlan(p) {
  const lv = LEVEL[p.nivel] || LEVEL.iniciante;
  const order = { 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 3] }[p.dias] || [0, 1, 2];
  return {
    source: 'modelo',
    workouts: order.map((i, k) => ({
      id: uid(),
      letter: String.fromCharCode(65 + k),
      name: TEMPLATES[i].name,
      exercises: TEMPLATES[i].exercises.map((e) => ({
        id: uid(), name: e.name, reps: e.reps, tipo: e.tipo, sets: e.sets ?? lv.sets,
        rest: e.rest ? Math.round((e.rest * lv.mul) / 5) * 5 : 0, notes: '',
      })),
    })),
  };
}

/* ---------------- Estado ---------------- */
export const defaultState = () => {
  const profile = { objetivo: 'emagrecimento', dias: 3, nivel: 'iniciante' };
  return { version: 2, profile, plan: generatePlan(profile), sessions: [], active: null,
    diet: { raw: '', groups: [] }, dietLog: {}, morning: [], activities: [], routines: [], routineLog: {}, ui: { tab: 'hoje' },
    recipes: [], shopping: { checked: {}, extra: [], days: 7 } };
};

export function migrate(s) {
  if (s.diet && s.diet.meals && !s.diet.groups) {
    s.diet.groups = s.diet.meals.map((m) => ({ id: m.id, name: m.name, time: m.time,
      options: [{ id: uid(), foods: (m.items || []).map((i) => ({ ...splitFood(i), subs: [] })), notes: '' }] }));
    delete s.diet.meals;
  }
  if (!s.diet.groups) s.diet.groups = [];
  ['recipes'].forEach((k) => { if (!Array.isArray(s[k])) s[k] = []; });
  if (!s.shopping) s.shopping = { checked: {}, extra: [], days: 7 };
  if (!Array.isArray(s.routines)) s.routines = [];
  if (!s.routineLog || typeof s.routineLog !== 'object') s.routineLog = {};
  if (!['hoje', 'treino', 'dieta', 'rotina', 'progresso', 'perfil'].includes(s.ui?.tab)) s.ui = { ...(s.ui || {}), tab: 'hoje' };
  s.plan.workouts.forEach((w, k) => {
    if (!w.letter) {
      const m = w.name.match(/^([A-Z])\s*[—–-]\s*(.*)$/);
      w.letter = m ? m[1] : String.fromCharCode(65 + k);
      if (m) w.name = m[2];
    }
  });
  return s;
}

/* ---------------- Imagem (para a IA analisar; não fica salva) ---------------- */
export function pickImage() {
  return new Promise((res) => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    i.onchange = () => res(i.files[0] || null);
    i.click();
  });
}
export async function shrink(file, max = 1024) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', 0.85));
  } catch { return file; }
}
export const blobToB64 = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(b); });

/* ---------------- IA: estimativa de calorias ----------------
   Google Gemini (chave "AIza...", tem uso grátis) ou Anthropic (chave "sk-ant-...").
   A chave fica só neste aparelho (localStorage) e vai direto para o serviço escolhido. */
export const aiProvider = (key = state.ai?.key || '') => (/^sk-ant-/.test(key.trim()) ? 'anthropic' : 'gemini');
export const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.6.0/+esm';
export let sdkPromise;
export async function aiClient() {
  if (!state.ai?.key) throw new Error('Configure a chave da IA no Perfil.');
  sdkPromise = sdkPromise || import(SDK_URL);
  const { default: Anthropic } = await sdkPromise;
  return new Anthropic({ apiKey: state.ai.key, dangerouslyAllowBrowser: true });
}
export const FOOD_SCHEMA = {
  type: 'object',
  properties: {
    alimento: { type: 'string', description: 'Nome curto do alimento' },
    porcao: { type: 'string', description: 'Porção considerada, ex.: 1 barra de 25 g' },
    kcal: { type: 'number' },
    proteina_g: { type: 'number' },
    carboidrato_g: { type: 'number' },
    gordura_g: { type: 'number' },
    confianca: { type: 'string', enum: ['alta', 'media', 'baixa'] },
    observacao: { type: 'string', description: 'Uma frase curta: de onde veio a estimativa ou o que pode mudar o valor' },
  },
  required: ['alimento', 'porcao', 'kcal', 'proteina_g', 'carboidrato_g', 'gordura_g', 'confianca', 'observacao'],
  additionalProperties: false,
};
const foodPrompt = (blob, text) => [
  'Estime as calorias e os macronutrientes do que a pessoa comeu, fora do plano alimentar dela.',
  blob ? 'Use a foto. Se aparecer embalagem ou tabela nutricional, use os valores dela.' : '',
  text ? `Descrição da pessoa: "${text}"` : '',
  'Se a quantidade não estiver clara, considere uma porção típica no Brasil e diga qual foi.',
  'Escreva em português do Brasil.',
].filter(Boolean).join('\n');

/* esquema no formato do Gemini (tipos em maiúsculas, sem additionalProperties) */
const GEMINI_SCHEMA = {
  type: 'OBJECT',
  properties: Object.fromEntries(Object.entries(FOOD_SCHEMA.properties).map(([k, v]) => [k,
    { type: v.type.toUpperCase(), ...(v.enum ? { enum: v.enum } : {}), ...(v.description ? { description: v.description } : {}) }])),
  required: FOOD_SCHEMA.required,
  propertyOrdering: FOOD_SCHEMA.required,
};
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash'];
async function estimateGemini({ blob, text }) {
  const key = state.ai?.key?.trim();
  if (!key) throw new Error('Configure a chave da IA no Perfil.');
  const parts = [];
  if (blob) parts.push({ inline_data: { mime_type: 'image/jpeg', data: await blobToB64(blob) } });
  parts.push({ text: foodPrompt(blob, text) });
  const body = JSON.stringify({ contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_SCHEMA, temperature: 0.2 } });
  let last;
  for (const model of GEMINI_MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body });
    const data = await res.json().catch(() => ({}));
    if (res.status === 404) { last = data; continue; } // modelo indisponível: tenta o próximo
    if (!res.ok) {
      const msg = data?.error?.message || '';
      const err = new Error(msg || 'Não consegui calcular agora.');
      err.status = /API key not valid|API_KEY_INVALID/i.test(msg) ? 401 : res.status;
      throw err;
    }
    const cand = data?.candidates?.[0];
    if (!cand || cand.finishReason === 'SAFETY' || data?.promptFeedback?.blockReason) throw new Error('A IA não conseguiu analisar esse item.');
    const txt = (cand.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (!txt) throw new Error('A IA não devolveu resultado. Tente de novo.');
    return JSON.parse(txt);
  }
  throw new Error(last?.error?.message || 'O modelo de IA do Google não está disponível agora.');
}

export async function estimateFood({ blob, text }) {
  if (aiProvider() === 'gemini') return estimateGemini({ blob, text });
  const client = await aiClient();
  const content = [];
  if (blob) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: await blobToB64(blob) } });
  content.push({ type: 'text', text: foodPrompt(blob, text) });
  const res = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: FOOD_SCHEMA } },
    messages: [{ role: 'user', content }],
  });
  if (res.stop_reason === 'refusal') throw new Error('A IA não conseguiu analisar esse item.');
  const block = res.content.find((b) => b.type === 'text');
  if (!block) throw new Error('A IA não devolveu resultado. Tente de novo.');
  return JSON.parse(block.text);
}

export const finished = () => state.sessions.filter((s) => s.end);
export function nextWorkout() {
  const ws = state.plan.workouts;
  if (!ws.length) return null;
  const last = state.sessions[state.sessions.length - 1];
  if (!last) return ws[0];
  const i = ws.findIndex((w) => w.id === last.workoutId);
  return ws[(i + 1) % ws.length] || ws[0];
}
export function lastPerformance(name) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const e = state.sessions[i].exercises.find((x) => x.name === name);
    if (e && e.sets.some((s) => s.done)) return e;
  }
  return null;
}
export function dayLog(key) {
  if (!state.dietLog[key]) state.dietLog[key] = { checked: {}, extras: [] };
  return state.dietLog[key];
}
export const estMinutes = (w) => Math.round(w.exercises.reduce((t, e) => t + (e.tipo === 'cardio' ? (num(e.reps) || 15) : e.sets * (0.75 + (e.rest || 0) / 60)), 0) / 5) * 5;
export const morningSorted = () => state.morning.slice().sort((a, b) => a.date.localeCompare(b.date));

/* Lê o plano da nutricionista em texto.
   Entende: "07:30 - Café da manhã - Opção 2", "Almoço 12:00", "Jantar:";
   alimentos "Banana - 1 unidade ou 110g" (ou nome e quantidade em linhas separadas);
   "Substituição: Salada de frutas - 1 porção" logo abaixo do alimento;
   "Observação:" e o texto que vier depois. */
export const MEAL_RE = /^(caf[eé][- ]da[- ]manh[ãa]|desjejum|almo[cç]o\b|jantar\b|janta\b|lanche\b|ceia\b|colaç[aã]o|pr[eé][- ]?treino|p[oó]s[- ]?treino|refei[cç][aã]o\b|\d+ª?\s*refei)/i;
export const QTY_RE = /^\d+([.,]\d+)?\s*(un|colher|g\b|gr|ml|fil[eé]|fatia|x[ií]cara|copo|por[cç]|concha|escumadeira|pegador|pedaço|ramo|folha|pote)/i;
export const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${m || '00'}`;
export function splitFood(str) {
  let m = str.match(/^(.+?)\s+[-–—:]\s+(.+)$/);
  if (m) return { name: m[1].trim(), qty: m[2].trim() };
  m = str.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (m && /\d/.test(m[2])) return { name: m[1].trim(), qty: m[2].trim() };
  m = str.match(/^([^\d]+?)\s+(\d.*)$/);
  if (m) return { name: m[1].trim(), qty: m[2].trim() };
  return { name: str.trim(), qty: '' };
}
export function parsePlan(text) {
  const groups = [];
  let opt = null, food = null, inNotes = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^[-•*▪◦·]\s*/, '');
    if (!line || /^ver op[cç][õo]es/i.test(line)) continue;
    let header = null;
    const tm = line.match(/^(\d{1,2})[:h](\d{2})?\s*[-–—]?\s*(.+)$/);
    if (tm && MEAL_RE.test(tm[3].trim())) header = { time: hhmm(tm[1], tm[2]), rest: tm[3] };
    else if (MEAL_RE.test(line) && line.length < 60 && !/\d\s?g\b/.test(line)) {
      const t = line.match(/\b(\d{1,2})[:h](\d{2})?\b/);
      header = { time: t ? hhmm(t[1], t[2]) : '', rest: line.replace(/\(?\s*(às\s*)?\d{1,2}[:h]\d{0,2}\s*\)?/i, '') };
    }
    if (header) {
      let name = header.rest.replace(/:\s*$/, '').trim();
      const om = name.match(/\s*[-–—(]?\s*op[çc][aã]o\s*(\d+)\s*\)?\s*$/i);
      if (om) name = name.slice(0, om.index);
      name = cap(name.replace(/[-–—\s]+$/, '').replace(/caf[eé]-da-manh/i, 'Café da manh').trim()) || 'Refeição';
      let g = groups.find((x) => x.name.toLowerCase() === name.toLowerCase() && x.time === header.time);
      if (!g) { g = { id: uid(), name, time: header.time, options: [] }; groups.push(g); }
      opt = { id: uid(), foods: [], notes: '' }; g.options.push(opt);
      food = null; inNotes = false;
      continue;
    }
    if (!opt) { opt = { id: uid(), foods: [], notes: '' }; groups.push({ id: uid(), name: 'Refeição', time: '', options: [opt] }); }
    const obs = line.match(/^(obs(erva[cç](ão|ões))?\.?|orienta[cç](ão|ões))\s*:?\s*(.*)$/i);
    if (obs) { inNotes = true; if (obs[5]) opt.notes += obs[5] + '\n'; continue; }
    if (inNotes) { opt.notes += raw.trim() + '\n'; continue; }
    const sub = line.match(/^(substitui[cç](ão|ões)|substituir|troca[rs]?|ou)\s*(por)?\s*:\s*(.+)$/i) || line.match(/^(⇄|↔|>)\s*(.+)$/);
    if (sub && food) { food.subs.push(splitFood(sub[sub.length - 1])); continue; }
    if (food && !food.qty && QTY_RE.test(line)) { food.qty = line; continue; }
    food = { ...splitFood(line), subs: [] };
    opt.foods.push(food);
  }
  groups.forEach((g) => g.options.forEach((o) => { o.notes = o.notes.trim(); }));
  return groups;
}

/* ---------------- Equivalências: substituição para qualquer alimento ----------------
   Cada item: n nome, k kcal/100 g, u unidade caseira, g gramas da unidade, a apelidos.
   A substituição é proporcional: calculamos as kcal da porção prescrita e devolvemos
   cada equivalente na quantidade que entrega as mesmas kcal. */
export const EQ = {
  fruta: { label: 'Frutas', items: [
    { n: 'Morango', k: 30, u: 'unidade(s) média(s)', g: 12 },
    { n: 'Uva', k: 69, u: 'cacho(s) pequeno(s)', g: 100 },
    { n: 'Melão', k: 29, u: 'fatia(s) grande(s)', g: 115 },
    { n: 'Melancia', k: 30, u: 'fatia(s) pequena(s)', g: 100 },
    { n: 'Maracujá', k: 68, u: 'unidade(s) média(s)', g: 45, a: ['maracuja amarelo'] },
    { n: 'Maçã', k: 52, u: 'unidade(s) média(s)', g: 130 },
    { n: 'Pera', k: 57, u: 'unidade(s) média(s)', g: 110 },
    { n: 'Amora preta', k: 43, u: 'xícara(s)', g: 145, a: ['amora'] },
    { n: 'Mirtilo', k: 57, u: 'xícara(s)', g: 148, a: ['blueberry'] },
    { n: 'Kiwi', k: 60, u: 'unidade(s)', g: 75 },
    { n: 'Banana prata', k: 98, u: 'unidade(s) média(s)', g: 70, a: ['banana'] },
    { n: 'Mamão papaia', k: 40, u: 'metade(s)', g: 170, a: ['mamao'] },
    { n: 'Laranja', k: 46, u: 'unidade(s) média(s)', g: 180 },
    { n: 'Abacaxi', k: 50, u: 'fatia(s)', g: 75 },
    { n: 'Manga', k: 64, u: 'unidade(s) pequena(s)', g: 150 },
    { n: 'Tangerina', k: 44, u: 'unidade(s) média(s)', g: 130, a: ['mexerica', 'bergamota', 'poncã'] },
    { n: 'Goiaba', k: 54, u: 'unidade(s) média(s)', g: 130 },
    { n: 'Ameixa', k: 53, u: 'unidade(s)', g: 70 },
    { n: 'Pêssego', k: 36, u: 'unidade(s)', g: 100 },
  ] },
  carbo: { label: 'Carboidratos', items: [
    { n: 'Arroz branco cozido', k: 128, u: 'colher(es) de sopa cheia(s)', g: 25, a: ['arroz branco', 'arroz'] },
    { n: 'Arroz integral cozido', k: 124, u: 'colher(es) de sopa cheia(s)', g: 25, a: ['arroz integral'] },
    { n: 'Macarrão cozido', k: 158, u: 'pegador(es)', g: 80, a: ['macarrao', 'massa'] },
    { n: 'Batata inglesa cozida', k: 52, u: 'unidade(s) média(s)', g: 100, a: ['batata', 'batata inglesa'] },
    { n: 'Batata doce cozida', k: 77, u: 'fatia(s)', g: 50, a: ['batata doce'] },
    { n: 'Mandioca cozida', k: 125, u: 'pedaço(s)', g: 60, a: ['mandioca', 'aipim', 'macaxeira'] },
    { n: 'Inhame cozido', k: 98, u: 'unidade(s) pequena(s)', g: 90, a: ['inhame'] },
    { n: 'Batata baroa cozida', k: 80, u: 'unidade(s)', g: 70, a: ['mandioquinha', 'batata baroa'] },
    { n: 'Quinoa cozida', k: 120, u: 'colher(es) de sopa cheia(s)', g: 25, a: ['quinoa'] },
    { n: 'Cuscuz de milho cozido', k: 113, u: 'fatia(s)', g: 80, a: ['cuscuz'] },
    { n: 'Aveia em flocos', k: 394, u: 'colher(es) de sopa cheia(s)', g: 15, a: ['aveia'] },
    { n: 'Tapioca (goma)', k: 240, u: 'colher(es) de sopa', g: 20, a: ['tapioca', 'goma'] },
    { n: 'Pão integral', k: 253, u: 'fatia(s)', g: 25, a: ['pao integral'] },
    { n: 'Pão francês', k: 300, u: 'unidade(s)', g: 50, a: ['pao frances', 'pao', 'pao de sal'] },
    { n: 'Milho verde cozido', k: 98, u: 'colher(es) de sopa', g: 20, a: ['milho'] },
  ] },
  proteina: { label: 'Proteínas', items: [
    { n: 'Peito de frango grelhado', k: 159, u: 'filé(s) médio(s)', g: 100, a: ['frango', 'peito de frango', 'file de frango'] },
    { n: 'Coxa de frango sem pele', k: 167, u: 'unidade(s)', g: 80, a: ['coxa de frango', 'sobrecoxa'] },
    { n: 'Patinho moído cozido', k: 180, u: 'colher(es) de sopa cheia(s)', g: 30, a: ['carne moida', 'patinho'] },
    { n: 'Alcatra grelhada', k: 220, u: 'bife(s) médio(s)', g: 100, a: ['alcatra', 'bife', 'carne bovina'] },
    { n: 'Filé mignon grelhado', k: 220, u: 'medalhão(ões)', g: 100, a: ['file mignon'] },
    { n: 'Lombo suíno assado', k: 210, u: 'fatia(s)', g: 60, a: ['lombo', 'carne suina', 'porco'] },
    { n: 'Tilápia grelhada', k: 128, u: 'filé(s)', g: 100, a: ['tilapia', 'peixe'] },
    { n: 'Merluza cozida', k: 122, u: 'filé(s)', g: 100, a: ['merluza'] },
    { n: 'Salmão grelhado', k: 230, u: 'posta(s)', g: 100, a: ['salmao'] },
    { n: 'Sardinha', k: 164, u: 'unidade(s)', g: 40, a: ['sardinha'] },
    { n: 'Atum em água', k: 116, u: 'lata(s)', g: 120, a: ['atum'] },
    { n: 'Ovo cozido', k: 146, u: 'unidade(s)', g: 50, a: ['ovo', 'ovos', 'ovo de galinha'] },
    { n: 'Clara de ovo', k: 44, u: 'unidade(s)', g: 33, a: ['clara'] },
    { n: 'Peito de peru', k: 135, u: 'fatia(s)', g: 20, a: ['peru', 'blanquet'] },
  ] },
  laticinio: { label: 'Laticínios', items: [
    { n: 'Iogurte desnatado', k: 41, u: 'unidade(s)', g: 100, a: ['iogurte', 'iogurte natural desnatado'] },
    { n: 'Iogurte natural integral', k: 61, u: 'unidade(s)', g: 100, a: ['iogurte natural', 'iogurte integral'] },
    { n: 'Leite desnatado', k: 35, u: 'copo(s)', g: 200, a: ['leite desnatado'] },
    { n: 'Leite semidesnatado', k: 42, u: 'copo(s)', g: 200, a: ['leite semidesnatado'] },
    { n: 'Leite integral', k: 61, u: 'copo(s)', g: 200, a: ['leite', 'leite de vaca'] },
    { n: 'Leite em pó desnatado', k: 358, u: 'colher(es) de sopa cheia(s)', g: 10, a: ['leite em po', 'leite de vaca desnatado em po'] },
    { n: 'Queijo minas frescal', k: 264, u: 'fatia(s)', g: 30, a: ['minas frescal', 'queijo minas', 'queijo branco'] },
    { n: 'Ricota', k: 140, u: 'fatia(s)', g: 30, a: ['ricota'] },
    { n: 'Queijo cottage', k: 98, u: 'colher(es) de sopa', g: 30, a: ['cottage'] },
    { n: 'Requeijão light', k: 175, u: 'colher(es) de sopa', g: 20, a: ['requeijao'] },
    { n: 'Queijo mussarela', k: 330, u: 'fatia(s)', g: 20, a: ['mussarela', 'muçarela', 'queijo'] },
    { n: 'Kefir', k: 55, u: 'copo(s)', g: 200, a: ['kefir'] },
  ] },
  gordura: { label: 'Gorduras e oleaginosas', items: [
    { n: 'Azeite de oliva', k: 884, u: 'colher(es) de sopa', g: 8, a: ['azeite'] },
    { n: 'Óleo de coco', k: 862, u: 'colher(es) de sopa', g: 8, a: ['oleo de coco'] },
    { n: 'Castanha de caju', k: 570, u: 'unidade(s)', g: 5, a: ['castanha de caju'] },
    { n: 'Castanha-do-pará', k: 699, u: 'unidade(s)', g: 4, a: ['castanha do para', 'castanha'] },
    { n: 'Amendoim', k: 544, u: 'colher(es) de sopa', g: 12, a: ['amendoim'] },
    { n: 'Amêndoa', k: 579, u: 'unidade(s)', g: 1.2, a: ['amendoa', 'amendoas'] },
    { n: 'Nozes', k: 654, u: 'unidade(s)', g: 5, a: ['noz', 'nozes'] },
    { n: 'Pasta de amendoim', k: 588, u: 'colher(es) de sopa', g: 15, a: ['pasta de amendoim'] },
    { n: 'Abacate', k: 96, u: 'colher(es) de sopa', g: 30, a: ['abacate'] },
    { n: 'Semente de chia', k: 486, u: 'colher(es) de sopa cheia(s)', g: 15, a: ['chia'] },
    { n: 'Linhaça', k: 534, u: 'colher(es) de sopa', g: 12, a: ['linhaca'] },
    { n: 'Gergelim', k: 573, u: 'colher(es) de sopa', g: 9, a: ['gergelim'] },
    { n: 'Coco ralado', k: 406, u: 'colher(es) de sopa', g: 10, a: ['coco'] },
  ] },
  leguminosa: { label: 'Leguminosas', items: [
    { n: 'Feijão carioca cozido', k: 76, u: 'concha(s)', g: 80, a: ['feijao', 'feijao carioca'] },
    { n: 'Feijão preto cozido', k: 77, u: 'concha(s)', g: 80, a: ['feijao preto'] },
    { n: 'Lentilha cozida', k: 93, u: 'colher(es) de sopa cheia(s)', g: 30, a: ['lentilha'] },
    { n: 'Grão-de-bico cozido', k: 121, u: 'colher(es) de sopa cheia(s)', g: 30, a: ['grao de bico'] },
    { n: 'Ervilha cozida', k: 81, u: 'colher(es) de sopa', g: 25, a: ['ervilha'] },
    { n: 'Soja cozida', k: 141, u: 'colher(es) de sopa', g: 30, a: ['soja'] },
  ] },
  vegetal: { label: 'Vegetais', items: [
    { n: 'Alface', k: 15, u: 'folha(s)', g: 10, a: ['alface'] },
    { n: 'Brócolis', k: 25, u: 'colher(es) de sopa', g: 25, a: ['brocolis'] },
    { n: 'Couve', k: 27, u: 'colher(es) de sopa', g: 20, a: ['couve'] },
    { n: 'Cenoura', k: 34, u: 'unidade(s) média(s)', g: 70, a: ['cenoura'] },
    { n: 'Abobrinha', k: 19, u: 'colher(es) de sopa', g: 30, a: ['abobrinha'] },
    { n: 'Berinjela', k: 20, u: 'colher(es) de sopa', g: 30, a: ['berinjela'] },
    { n: 'Tomate', k: 15, u: 'unidade(s) média(s)', g: 90, a: ['tomate'] },
    { n: 'Pepino', k: 10, u: 'unidade(s)', g: 130, a: ['pepino'] },
    { n: 'Chuchu', k: 17, u: 'colher(es) de sopa', g: 30, a: ['chuchu'] },
    { n: 'Repolho', k: 17, u: 'colher(es) de sopa', g: 20, a: ['repolho'] },
    { n: 'Espinafre', k: 16, u: 'colher(es) de sopa', g: 20, a: ['espinafre'] },
    { n: 'Vagem', k: 25, u: 'colher(es) de sopa', g: 25, a: ['vagem'] },
    { n: 'Couve-flor', k: 23, u: 'colher(es) de sopa', g: 25, a: ['couve flor'] },
    { n: 'Beterraba', k: 32, u: 'colher(es) de sopa', g: 30, a: ['beterraba'] },
  ] },
};
export const eqNorm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
/* índice nome normalizado -> { grupo, item }, chaves maiores primeiro */
export const EQ_INDEX = (() => {
  const out = [];
  for (const [key, grp] of Object.entries(EQ)) {
    for (const it of grp.items) {
      for (const k of [it.n, ...(it.a || [])]) out.push({ key: eqNorm(k), group: key, item: it });
    }
  }
  return out.sort((a, b) => b.key.length - a.key.length);
})();
export function eqFind(name) {
  const n = eqNorm(name);
  if (n.length < 3) return null;
  for (const e of EQ_INDEX) if (n === e.key) return e;
  for (const e of EQ_INDEX) if (e.key.length >= 4 && (n.includes(e.key) || e.key.includes(n))) return e;
  return null;
}
/* gramas da porção prescrita: usa "120 g", senão "2 unidades" x peso da unidade */
export function eqGrams(qty, item) {
  const q = String(qty || '').toLowerCase().replace(',', '.');
  let m = q.match(/(\d+(?:\.\d+)?)\s*(?:g\b|gr\b|gramas?\b)/);
  if (m) return parseFloat(m[1]);
  m = q.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (m) return parseFloat(m[1]);
  if (!item || !item.g) return null;
  m = q.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) * item.g : null;
}
export const eqRound = (g) => (g >= 100 ? Math.round(g / 5) * 5 : g >= 20 ? Math.round(g) : Math.round(g * 10) / 10);
/* quantidade de `item` que entrega `kcal` */
export function eqPortion(item, kcal) {
  const g = kcal / (item.k / 100);
  if (!Number.isFinite(g) || g <= 0) return null;
  const gr = eqRound(g);
  if (item.u && item.g) {
    const u = g / item.g;
    const un = u >= 10 ? Math.round(u) : Math.round(u * 2) / 2;
    if (un >= 0.5) return `${br(un, 1)} ${item.u} (${br(gr, 1)} g)`;
  }
  return `${br(gr, 1)} g`;
}
/* substituições automáticas de um alimento, já fora as que a nutri escreveu */
export function autoSubs(food, max = 10) {
  const hit = eqFind(food.name);
  if (!hit) return null;
  const grams = eqGrams(food.qty, hit.item);
  if (grams == null) return null;
  const kcal = grams * (hit.item.k / 100);
  if (!(kcal > 0)) return null;
  const taken = new Set((food.subs || []).map((s) => eqNorm(s.name)));
  const list = [];
  for (const it of EQ[hit.group].items) {
    if (it === hit.item || taken.has(eqNorm(it.n))) continue;
    const qty = eqPortion(it, kcal);
    if (qty) list.push({ name: it.n, qty });
    if (list.length >= max) break;
  }
  return list.length ? { label: EQ[hit.group].label, kcal: Math.round(kcal), list } : null;
}
export const mealCheck = (log, g) => { const c = log.checked[g.id]; return c == null ? null : (typeof c === 'object' ? c : { opt: 0 }); };

export const toMin = (t) => (t ? (+t.slice(0, 2)) * 60 + (+t.slice(3, 5)) : null);
/* Próxima refeição pendente: a que está na hora (até 90 min de atraso) ou a seguinte. */
export function nextMeal(log) {
  const pending = state.diet.groups.filter((g) => !mealCheck(log, g));
  if (!pending.length) return null;
  const now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
  const timed = pending.filter((g) => toMin(g.time) != null).sort((a, b) => toMin(a.time) - toMin(b.time));
  return timed.find((g) => toMin(g.time) >= mins - 90) || timed[timed.length - 1] || pending[0];
}

export const initials = (n) => n.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
export const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

export function weekMonday(off = 0) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const m = new Date(now);
  m.setDate(now.getDate() - ((now.getDay() + 6) % 7) + off * 7);
  return m;
}

export const IMC_FAIXA = (v) => (v < 18.5 ? 'abaixo do peso' : v < 25 ? 'peso adequado' : v < 30 ? 'sobrepeso' : 'obesidade');
/* Faixas do IMC para adultos (OMS). Referência geral: não separa músculo de gordura. */
export function weightFeedback(w, alturaCm) {
  if (!w || !alturaCm) return null;
  const h = alturaCm / 100, imc = w / (h * h);
  const min = 18.5 * h * h, max = 24.9 * h * h;
  let msg;
  if (imc < 18.5) msg = `Você está ${br(min - w)} kg abaixo da faixa considerada saudável para a sua altura.`;
  else if (imc < 25) msg = 'Seu peso está dentro da faixa considerada saudável para a sua altura.';
  else msg = `Você está ${br(w - max)} kg acima da faixa considerada saudável para a sua altura.`;
  return { imc, faixa: IMC_FAIXA(imc), min, max, msg };
}

export const latestWeight = () => morningSorted().filter((x) => x.peso != null).pop()?.peso ?? null;

export const routineLog = (k) => {
  state.routineLog = state.routineLog || {};
  if (!state.routineLog[k]) state.routineLog[k] = {};
  return state.routineLog[k];
};
export const DIAS_CURTO = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
export const DIAS_NOME = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
/* índice 0..6 começando na segunda, igual à faixa da semana */
export const weekIdx = (k) => (keyToDate(k).getDay() + 6) % 7;
export const routinesOf = (k) => (state.routines || []).filter((r) => !r.dias?.length || r.dias.includes(weekIdx(k)));
export const routineSorted = (k) => routinesOf(k).slice().sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

export const ROTINA_PRESETS = ['Ler', 'Beber 2 L de água', 'Tomar sol', 'Alongar', 'Meditar', 'Dormir até 23h', 'Estudar', 'Caminhar'];

export const mealLabel = (g, oi) => (g.options.length > 1 ? `${g.name} - Opção ${oi + 1}` : g.name);
/* "07:30 - Café da manhã - Opção 2", como na lista do app da nutricionista */
export const mealTitle = (g, oi) => (g.time ? `${g.time} - ` : '') + mealLabel(g, oi);

export function foodQty(f) {
  const raw = (f.qty || '').trim();
  if (!raw || /\bou\b/i.test(raw)) return raw;
  const hit = eqFind(f.name);
  if (!hit || !hit.item.u || !hit.item.g) return raw;
  const g = eqGrams(raw, hit.item);
  if (g == null) return raw;
  const u = g / hit.item.g, un = u >= 10 ? Math.round(u) : Math.round(u * 2) / 2;
  if (un < 0.5) return raw;
  return `${br(un, 1)} ${hit.item.u} ou ${br(eqRound(g), 1)}g`;
}

export const MOODS = [
  { k: 'otimo', face: '😄', label: 'Ótimo' },
  { k: 'bem', face: '🙂', label: 'Bem' },
  { k: 'neutro', face: '😐', label: 'Normal' },
  { k: 'ruim', face: '😕', label: 'Ruim' },
  { k: 'mal', face: '😣', label: 'Mal' },
];

export const MEAL_PRESETS = [
  { name: 'Café da manhã', time: '07:30' },
  { name: 'Lanche da manhã', time: '10:00' },
  { name: 'Almoço', time: '12:00' },
  { name: 'Lanche', time: '18:00' },
  { name: 'Jantar', time: '20:30' },
  { name: 'Ceia', time: '22:00' },
];
export const findGroup = (gid) => state.diet.groups.find((x) => x.id === gid);
export const newOption = () => ({ id: uid(), foods: [], notes: '' });
export const sortGroups = () => state.diet.groups.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

export const extrasKcal = (log) => log.extras.reduce((t, x) => t + (x.kcal || 0), 0);

export function aiErrorText(e) {
  const st = e?.status;
  if (st === 401) return 'Chave da IA inválida. Confira em Perfil › Assistente IA.';
  if (st === 402 || st === 403) return aiProvider() === 'gemini'
    ? 'A chave do Google não tem permissão. Confira no Google AI Studio.'
    : 'A conta da API não tem créditos ou permissão. Confira no console da Anthropic.';
  if (st === 429) return aiProvider() === 'gemini'
    ? 'Chegou no limite grátis do Google por agora. Tente de novo mais tarde.'
    : 'Muitas consultas seguidas. Espere um pouco e tente de novo.';
  if (st === 400) return 'A IA não conseguiu ler esse pedido. Tente outra foto ou descreva o alimento.';
  if (!navigator.onLine) return 'Sem internet. A IA precisa de conexão.';
  return e?.message || 'Não consegui calcular agora. Tente de novo.';
}

export const fmtGrams = (g) => (g >= 1000 ? `${br(g / 1000, 1)} kg` : `${Math.max(10, Math.round(g / 10) * 10)} g`);
export function shoppingItems(days) {
  const map = new Map();
  state.diet.groups.forEach((g) => {
    (g.options[0]?.foods || []).forEach((f) => {
      const key = f.name.toLowerCase().trim();
      const gm = [...(f.qty || '').matchAll(/(\d+(?:[.,]\d+)?)\s?g\b/gi)].pop();
      const it = map.get(key) || { key, name: f.name, grams: 0, times: 0 };
      it.times += 1;
      if (gm) it.grams += num(gm[1]);
      map.set(key, it);
    });
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((it) => ({ ...it, label: it.grams ? `~${fmtGrams(it.grams * days)}` : `${it.times * days} porç${it.times * days > 1 ? 'ões' : 'ão'}` }));
}

export const RECIPES = [
  { id: 'r1', name: 'Overnight oats com chia e morango', tempo: '5 min + 1 noite', porcoes: 1, tag: 'Café da manhã',
    ing: ['170 g de iogurte desnatado', '30 g de aveia em flocos', '15 g de semente de chia', '120 g de morango picado', 'Canela a gosto'],
    prep: ['Misture o iogurte, a aveia e a chia num pote com tampa.', 'Cubra com o morango e polvilhe canela.', 'Deixe na geladeira de um dia para o outro. Come gelado.'] },
  { id: 'r2', name: 'Panqueca de banana e aveia', tempo: '10 min', porcoes: 1, tag: 'Café da manhã',
    ing: ['1 banana madura', '2 ovos', '30 g de aveia em flocos', 'Canela a gosto'],
    prep: ['Amasse a banana e misture com os ovos e a aveia.', 'Aqueça uma frigideira antiaderente untada com um fio de azeite.', 'Despeje a massa, doure dos dois lados em fogo baixo.'] },
  { id: 'r3', name: 'Crepioca de frango', tempo: '10 min', porcoes: 1, tag: 'Lanche',
    ing: ['1 ovo', '2 colheres de sopa de goma de tapioca', '1 colher de sopa de água', 'Frango desfiado para rechear', 'Sal de ervas'],
    prep: ['Bata o ovo com a goma, a água e uma pitada de sal de ervas.', 'Espalhe na frigideira quente e deixe firmar.', 'Recheie com o frango, dobre e sirva.'] },
  { id: 'r4', name: 'Omelete de legumes', tempo: '10 min', porcoes: 1, tag: 'Jantar',
    ing: ['2 ovos', '½ tomate picado', 'Cebola picada', '1 punhado de espinafre ou couve', 'Sal de ervas e orégano'],
    prep: ['Refogue a cebola e as folhas rapidamente.', 'Bata os ovos com o tomate e os temperos e despeje por cima.', 'Tampe e cozinhe em fogo baixo até firmar.'] },
  { id: 'r5', name: 'Frango desfiado da semana', tempo: '40 min', porcoes: 5, tag: 'Preparo da semana',
    ing: ['750 g de peito de frango', '3 dentes de alho', '1 cebola', '2 tomates', '1 colher de chá de açafrão', 'Cheiro-verde'],
    prep: ['Cozinhe o frango na panela de pressão com água e alho por 15 minutos.', 'Desfie e refogue com cebola, tomate e açafrão.', 'Finalize com cheiro-verde. Divida em potes de 150 g e congele.'] },
  { id: 'r6', name: 'Salada de grão-de-bico', tempo: '10 min', porcoes: 1, tag: 'Almoço',
    ing: ['110 g de grão-de-bico cozido', '1 tomate', '½ pepino', 'Cebola roxa', 'Suco de ½ limão', '1 fio de azeite', 'Salsinha'],
    prep: ['Pique os legumes em cubos pequenos.', 'Misture com o grão-de-bico.', 'Tempere com limão, azeite, salsinha e sal de ervas.'] },
  { id: 'r7', name: 'Legumes assados', tempo: '35 min', porcoes: 3, tag: 'Acompanhamento',
    ing: ['1 brócolis em floretes', '1 abobrinha', '2 cenouras', '1 berinjela', '1 fio de azeite', 'Alecrim e sal de ervas'],
    prep: ['Corte tudo em pedaços parecidos.', 'Tempere com azeite, alecrim e sal de ervas.', 'Asse a 200 °C por 25 a 30 minutos, mexendo na metade.'] },
  { id: 'r8', name: 'Sal de ervas', tempo: '5 min', porcoes: 20, tag: 'Tempero',
    ing: ['1 parte de sal', '1 parte de ervas secas: alecrim, orégano, salsinha, manjericão'],
    prep: ['Bata o sal e as ervas no liquidificador.', 'Guarde em pote fechado.', 'Use no preparo no lugar do sal comum: rende o mesmo sabor com menos sódio.'] },
];
export const allRecipes = () => RECIPES.concat(state.recipes);

/* ---------------- Estado + armazenamento (mesma chave do app antigo) ---------------- */
const listeners = new Set();
let version = 0;
function load() {
  try { return migrate(Object.assign(defaultState(), JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {})); }
  catch { return defaultState(); }
}
export let state = load();
const emit = () => { version++; listeners.forEach((f) => f()); };
export function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); emit(); return true; }
  catch (e) { alert('Não consegui salvar no celular: ' + e.message); emit(); return false; }
}
/* troca o estado inteiro (importar backup, apagar dados) */
export function replaceState(s) { state = s; save(); }
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getVersion = () => version;
/* muda o estado e salva: commit((s) => { s.algo = 1; }) */
export function commit(fn) { if (fn) fn(state); return save(); }
