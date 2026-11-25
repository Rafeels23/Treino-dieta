'use strict';

/* =========================================================
   Pilar — treino e dieta, os dois pilares (v1.2, só celular)
   Dados salvos no próprio aparelho (localStorage).
   ========================================================= */

const STORE_KEY = 'treino-dieta-v1';
/* mapa de acoes data-act; declarado cedo para que qualquer secao possa registrar a sua */
const A = {};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayKey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const keyToDate = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDay = (k) => keyToDate(k).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
const fmtDayLong = (k) => keyToDate(k).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '');
const fmtClock = (sec) => { const s = Math.max(0, Math.round(Math.abs(sec))); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const br = (n, d = 1) => (n == null ? '—' : n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d }));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------- Ícones (traço único, 24px) ---------------- */
const ICONS = {
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
const ic = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------------- Modelos de treino (emagrecimento) ---------------- */
const ex = (name, reps, rest = 60, tipo = 'carga', sets) => ({ name, reps, rest, tipo, sets });
const TEMPLATES = [
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
const LEVEL = { iniciante: { sets: 3, mul: 1.2 }, intermediario: { sets: 3, mul: 1 }, avancado: { sets: 4, mul: 0.8 } };
const LEVEL_LABEL = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

function generatePlan(p) {
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
const defaultState = () => {
  const profile = { objetivo: 'emagrecimento', dias: 3, nivel: 'iniciante' };
  return { version: 2, profile, plan: generatePlan(profile), sessions: [], active: null,
    diet: { raw: '', groups: [] }, dietLog: {}, morning: [], activities: [], routines: [], routineLog: {}, ui: { tab: 'hoje' },
    recipes: [], shopping: { checked: {}, extra: [], days: 7 } };
};

function migrate(s) {
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

let state;
try { state = migrate(Object.assign(defaultState(), JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {})); }
catch { state = defaultState(); }

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
  catch (e) { alert('Não consegui salvar no celular: ' + e.message); return false; }
}

/* ---------------- Imagem (para a IA analisar; não fica salva) ---------------- */
function pickImage() {
  return new Promise((res) => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    i.onchange = () => res(i.files[0] || null);
    i.click();
  });
}
async function shrink(file, max = 1024) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', 0.85));
  } catch { return file; }
}
const blobToB64 = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(b); });

/* ---------------- IA: estimativa de calorias (API da Anthropic) ----------------
   A chave fica só neste aparelho (localStorage) e vai direto para a Anthropic. */
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.6.0/+esm';
let sdkPromise;
async function aiClient() {
  if (!state.ai?.key) throw new Error('Configure a chave da IA no Perfil.');
  sdkPromise = sdkPromise || import(SDK_URL);
  const { default: Anthropic } = await sdkPromise;
  return new Anthropic({ apiKey: state.ai.key, dangerouslyAllowBrowser: true });
}
const FOOD_SCHEMA = {
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
async function estimateFood({ blob, text }) {
  const client = await aiClient();
  const content = [];
  if (blob) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: await blobToB64(blob) } });
  content.push({ type: 'text', text: [
    'Estime as calorias e os macronutrientes do que a pessoa comeu, fora do plano alimentar dela.',
    blob ? 'Use a foto. Se aparecer embalagem ou tabela nutricional, use os valores dela.' : '',
    text ? `Descrição da pessoa: "${text}"` : '',
    'Se a quantidade não estiver clara, considere uma porção típica no Brasil e diga qual foi.',
    'Escreva em português do Brasil.',
  ].filter(Boolean).join('\n') });
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

/* ---------------- Consultas ---------------- *//* ---------------- Consultas ---------------- */
const finished = () => state.sessions.filter((s) => s.end);
function nextWorkout() {
  const ws = state.plan.workouts;
  if (!ws.length) return null;
  const last = state.sessions[state.sessions.length - 1];
  if (!last) return ws[0];
  const i = ws.findIndex((w) => w.id === last.workoutId);
  return ws[(i + 1) % ws.length] || ws[0];
}
function lastPerformance(name) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const e = state.sessions[i].exercises.find((x) => x.name === name);
    if (e && e.sets.some((s) => s.done)) return e;
  }
  return null;
}
function dayLog(key) {
  if (!state.dietLog[key]) state.dietLog[key] = { checked: {}, extras: [] };
  return state.dietLog[key];
}
const estMinutes = (w) => Math.round(w.exercises.reduce((t, e) => t + (e.tipo === 'cardio' ? (num(e.reps) || 15) : e.sets * (0.75 + (e.rest || 0) / 60)), 0) / 5) * 5;
const morningSorted = () => state.morning.slice().sort((a, b) => a.date.localeCompare(b.date));

/* Lê o plano da nutricionista em texto.
   Entende: "07:30 - Café da manhã - Opção 2", "Almoço 12:00", "Jantar:";
   alimentos "Banana - 1 unidade ou 110g" (ou nome e quantidade em linhas separadas);
   "Substituição: Salada de frutas - 1 porção" logo abaixo do alimento;
   "Observação:" e o texto que vier depois. */
const MEAL_RE = /^(caf[eé][- ]da[- ]manh[ãa]|desjejum|almo[cç]o\b|jantar\b|janta\b|lanche\b|ceia\b|colaç[aã]o|pr[eé][- ]?treino|p[oó]s[- ]?treino|refei[cç][aã]o\b|\d+ª?\s*refei)/i;
const QTY_RE = /^\d+([.,]\d+)?\s*(un|colher|g\b|gr|ml|fil[eé]|fatia|x[ií]cara|copo|por[cç]|concha|escumadeira|pegador|pedaço|ramo|folha|pote)/i;
const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${m || '00'}`;
function splitFood(str) {
  let m = str.match(/^(.+?)\s+[-–—:]\s+(.+)$/);
  if (m) return { name: m[1].trim(), qty: m[2].trim() };
  m = str.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (m && /\d/.test(m[2])) return { name: m[1].trim(), qty: m[2].trim() };
  m = str.match(/^([^\d]+?)\s+(\d.*)$/);
  if (m) return { name: m[1].trim(), qty: m[2].trim() };
  return { name: str.trim(), qty: '' };
}
function parsePlan(text) {
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
const EQ = {
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
const eqNorm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
/* índice nome normalizado -> { grupo, item }, chaves maiores primeiro */
const EQ_INDEX = (() => {
  const out = [];
  for (const [key, grp] of Object.entries(EQ)) {
    for (const it of grp.items) {
      for (const k of [it.n, ...(it.a || [])]) out.push({ key: eqNorm(k), group: key, item: it });
    }
  }
  return out.sort((a, b) => b.key.length - a.key.length);
})();
function eqFind(name) {
  const n = eqNorm(name);
  if (n.length < 3) return null;
  for (const e of EQ_INDEX) if (n === e.key) return e;
  for (const e of EQ_INDEX) if (e.key.length >= 4 && (n.includes(e.key) || e.key.includes(n))) return e;
  return null;
}
/* gramas da porção prescrita: usa "120 g", senão "2 unidades" x peso da unidade */
function eqGrams(qty, item) {
  const q = String(qty || '').toLowerCase().replace(',', '.');
  let m = q.match(/(\d+(?:\.\d+)?)\s*(?:g\b|gr\b|gramas?\b)/);
  if (m) return parseFloat(m[1]);
  m = q.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (m) return parseFloat(m[1]);
  if (!item || !item.g) return null;
  m = q.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) * item.g : null;
}
const eqRound = (g) => (g >= 100 ? Math.round(g / 5) * 5 : g >= 20 ? Math.round(g) : Math.round(g * 10) / 10);
/* quantidade de `item` que entrega `kcal` */
function eqPortion(item, kcal) {
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
function autoSubs(food, max = 10) {
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
const mealCheck = (log, g) => { const c = log.checked[g.id]; return c == null ? null : (typeof c === 'object' ? c : { opt: 0 }); };

/* ---------------- Gráfico de linha (uma série, toque para ver o valor) ---------------- */
const chartData = {};
function chartSlot(id, points, unit, cls = '') {
  chartData[id] = { points, unit };
  if (points.length < 2) return `<div class="empty">${ic('chart')}<div>Registre pelo menos dois dias para ver a linha.</div></div>`;
  return `<div class="chart-wrap ${cls}" data-chart="${id}"></div>`;
}
function drawChart(el) {
  const { points, unit } = chartData[el.dataset.chart];
  const W = el.clientWidth - 16, H = 180, P = { l: 6, r: 40, t: 30, b: 22 };
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const span = hi - lo; lo -= span * 0.1; hi += span * 0.1;
  const X = (i) => P.l + (i * (W - P.l - P.r)) / (points.length - 1);
  const Y = (v) => P.t + ((hi - v) * (H - P.t - P.b)) / (hi - lo);
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${X(points.length - 1).toFixed(1)} ${H - P.b} L${P.l} ${H - P.b} Z`;
  const last = points.length - 1;
  el.innerHTML = `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico em ${esc(unit)}">
    ${ticks.map((t) => `<line class="grid" x1="${P.l}" x2="${W - P.r + 6}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${W - P.r + 10}" y="${Y(t) + 4}">${br(t)}</text>`).join('')}
    <defs><linearGradient id="g-${el.dataset.chart}" x1="0" y1="0" x2="0" y2="1"><stop class="area-stop" offset="0" stop-opacity=".32"/><stop class="area-stop" offset="1" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#g-${el.dataset.chart})"/><path class="line" d="${d}"/>
    <text class="ax" x="${P.l}" y="${H - 4}">${esc(points[0].label)}</text>
    <text class="ax" x="${X(last)}" y="${H - 4}" text-anchor="end">${esc(points[last].label)}</text>
    <line class="cross hidden" y1="${P.t - 6}" y2="${H - P.b}"/>
    <circle class="pt" r="5" cx="${X(last)}" cy="${Y(points[last].y)}"/>
  </svg><div class="tip hidden"></div>`;
  const svg = el.firstElementChild, cross = $('.cross', svg), pt = $('.pt', svg), tip = $('.tip', el);
  const lineEl = $('.line', svg);
  try {
    const len = Math.ceil(lineEl.getTotalLength());
    lineEl.style.strokeDasharray = len; lineEl.style.strokeDashoffset = len;
    lineEl.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
  } catch {}
  const show = (i) => {
    const x = X(i), y = Y(points[i].y);
    cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.classList.remove('hidden');
    pt.setAttribute('cx', x); pt.setAttribute('cy', y);
    tip.textContent = `${br(points[i].y)} ${unit} · ${points[i].label}`;
    tip.classList.remove('hidden');
    const tw = tip.offsetWidth / 2 + 4;
    tip.style.left = Math.min(Math.max(x + 8, tw), el.clientWidth - tw) + 'px';
  };
  const pick = (ev) => {
    const r = svg.getBoundingClientRect();
    const i = Math.round(((ev.clientX - r.left - P.l) / (W - P.l - P.r)) * last);
    show(Math.max(0, Math.min(last, i)));
  };
  el.onpointerdown = pick; el.onpointermove = (ev) => { if (ev.buttons || ev.pointerType === 'mouse') pick(ev); };
  el.onpointerleave = (ev) => { if (ev.pointerType !== 'mouse') return; cross.classList.add('hidden'); tip.classList.add('hidden'); pt.setAttribute('cx', X(last)); pt.setAttribute('cy', Y(points[last].y)); };
}

/* ---------------- Peças de tela ---------------- */
/* Anéis de progresso (de fora para dentro). items: [{ v: 0..1, color }] */
function rings(items, size = 128, sw = 12) {
  const c = size / 2;
  return `<svg class="rings" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${items.map((it, i) => {
    const r = c - sw / 2 - i * (sw + 4), len = 2 * Math.PI * r, v = Math.max(0, Math.min(1, it.v || 0));
    return `<circle class="track" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}" style="stroke:${it.color}"/>`
      + (v > 0 ? `<circle class="val" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}" style="stroke:${it.color};stroke-dasharray:${len.toFixed(1)};--len:${len.toFixed(1)};--off:${(len * (1 - v)).toFixed(1)}"/>` : '');
  }).join('')}</svg>`;
}
const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch {} };
let justKey = null;
const toMin = (t) => (t ? (+t.slice(0, 2)) * 60 + (+t.slice(3, 5)) : null);
/* Próxima refeição pendente: a que está na hora (até 90 min de atraso) ou a seguinte. */
function nextMeal(log) {
  const pending = state.diet.groups.filter((g) => !mealCheck(log, g));
  if (!pending.length) return null;
  const now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
  const timed = pending.filter((g) => toMin(g.time) != null).sort((a, b) => toMin(a.time) - toMin(b.time));
  return timed.find((g) => toMin(g.time) >= mins - 90) || timed[timed.length - 1] || pending[0];
}
/* o perfil mora no canto superior direito de toda tela, no lugar da aba */
const avatarBtn = () => `<button class="avatar" data-act="goto" data-v="perfil" aria-label="Seu perfil">${state.profile.nome ? esc(initials(state.profile.nome)) : ic('user')}</button>`;
const head = (kicker, title, action = '') => `<header class="head"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div>
  <div class="head-actions">${action}${avatarBtn()}</div></header>`;
const section = (title, body, action = '') => `<section class="section"><div class="section-title"><span>${title}</span>${action}</div>${body}</section>`;
const initials = (n) => n.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

/* ---------------- Tela: Hoje ---------------- */
const views = {};

views.hoje = () => {
  const key = todayKey();
  state.ui.dietDay = undefined;
  const nw = nextWorkout();
  const doneToday = finished().filter((s) => todayKey(new Date(s.start)) === key);
  const ms = morningSorted();
  const m = ms.find((x) => x.date === key);
  const prev = ms.filter((x) => x.date < key && x.peso != null).pop();
  const meals = state.diet.groups;
  const log = dayLog(key);
  const mealsDone = meals.filter((x) => mealCheck(log, x)).length;
  const p = state.profile;
  const acts = state.activities.filter((a) => a.date === key);

  const vTreino = doneToday.length ? 1 : state.active ? 0.5 : 0;
  const vMeal = meals.length ? mealsDone / meals.length : 0;
  const rotList = routinesOf(key), rotLog = routineLog(key);
  const rotDone = rotList.filter((r) => rotLog[r.id]).length;
  const vRot = rotList.length ? rotDone / rotList.length : 0;
  /* o dia é treino + refeições + rotina (a rotina só conta se houver hábitos para hoje); o peso mora no Perfil */
  const parts = [vTreino, vMeal].concat(rotList.length ? [vRot] : []);
  const pct = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
  const summary = `<div class="section"><div class="group today-card">
      ${rings([{ v: vTreino, color: 'var(--c-treino)' }, { v: vMeal, color: 'var(--c-dieta)' }, { v: vRot, color: 'var(--c-rotina)' }])}
      <div style="flex:1;min-width:0"><div class="cap">Seu dia</div><div class="pct digits"><span data-count="${pct}" data-count-key="pct-dia">${pct}</span><small>%</small></div>
        <ul class="legend">
          <li><i style="background:var(--c-treino)"></i>Treino<b>${doneToday.length ? 'Feito' : state.active ? 'Agora' : '—'}</b></li>
          <li><i style="background:var(--c-dieta)"></i>Refeições<b class="num">${meals.length ? `${mealsDone}/${meals.length}` : '—'}</b></li>
          <li><i style="background:var(--c-rotina)"></i>Rotina<b class="num">${rotList.length ? `${rotDone}/${rotList.length}` : '—'}</b></li>
        </ul></div></div></div>`;

  let workout;
  if (state.active) {
    const s = state.active, total = s.exercises.reduce((n, e) => n + e.sets.length, 0), done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
    workout = `<div class="hero-workout"><div class="kick">Treino em andamento</div><div class="name">${esc(s.workoutName)}</div>
      <div class="meta num">${done} de ${total} séries</div><div class="letter">${esc(s.workoutLetter || '')}</div>
      <button class="btn light" data-act="goto" data-v="treino">${ic('play')} Continuar</button></div>`;
  } else if (doneToday.length) {
    const s = doneToday[doneToday.length - 1], sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
    workout = `<div class="hero-workout done"><div class="kick">Treino de hoje feito</div><div class="name">${esc(s.workoutName)}</div>
      <div class="meta num" style="color:var(--ink-2)">${Math.round((s.end - s.start) / 60000)} min · ${sets} séries</div><div class="letter">${ic('check')}</div>
      <button class="btn soft" data-act="session" data-v="${s.id}">Ver resumo</button></div>`;
  } else if (nw) {
    workout = `<div class="hero-workout"><div class="kick">Próximo treino</div><div class="name">${esc(nw.name)}</div>
      <div class="meta">${nw.exercises.length} exercícios · ~${estMinutes(nw)} min</div><div class="letter">${esc(nw.letter)}</div>
      <div class="row-btns" style="justify-content:flex-start;gap:10px"><button class="btn light" data-act="start" data-v="${nw.id}">${ic('play')} Começar</button>
      <button class="btn" style="background:rgba(255,255,255,.16);color:#fff;margin-top:18px" data-act="workout" data-v="${nw.id}">Ver exercícios</button></div></div>`;
  } else {
    workout = `<button class="next-meal" data-act="goto" data-v="treino"><span class="body"><div class="k" style="color:var(--c-treino)">Treino</div><div class="t">Monte seu plano</div></span>${ic('right')}</button>`;
  }

  let meal;
  if (!meals.length) {
    meal = `<button class="next-meal" data-act="goto" data-v="dieta"><span class="body"><div class="k">Alimentação</div><div class="t">Adicione seu plano</div><div class="s">Cole o texto da sua nutricionista</div></span>${ic('right')}</button>`;
  } else {
    const nm = nextMeal(log);
    meal = nm ? `<div class="next-meal" data-act="meal-open" data-v="${nm.id}" role="button" tabindex="0">
        <span class="body"><div class="k">Próxima refeição${nm.time ? ` · ${esc(nm.time)}` : ''}</div><div class="t">${esc(nm.name)}</div>
        <div class="s">${esc((nm.options[0]?.foods || []).slice(0, 3).map((f) => f.name).join(', '))}</div></span>
        <button class="tick" data-act="meal-quick" data-v="${nm.id}" aria-label="Marcar ${esc(nm.name)} como feita">${ic('check')}</button></div>`
      : `<button class="next-meal" data-act="goto" data-v="dieta"><span class="body"><div class="k">Alimentação</div><div class="t">Todas as refeições feitas</div>
        <div class="s">${extrasKcal(log) ? `${Math.round(extrasKcal(log))} kcal fora do plano` : 'Nada fora do plano hoje'}</div></span>${ic('right')}</button>`;
  }

  const minsAct = acts.reduce((t, a) => t + (a.minutos || 0), 0);
  const bento = `<div class="section bento one">
      <button class="tile ativ" data-act="activity"><div class="top"><span class="lbl">Atividade</span><span class="badge ativ">${ic('pulse')}</span></div>
        ${acts.length ? `<div class="val digits">${minsAct || acts.length}<small>${minsAct ? 'min' : 'reg.'}</small></div><div class="sub">${esc(acts.map((a) => a.tipo).join(', '))}</div>`
          : `<div class="cta">${ic('plus')} Registrar</div><div class="sub">Caminhada, bike…</div>`}</button>
    </div>`;

  const incomplete = !p.nome || !p.altura;
  return head(cap(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })),
      greet() + (p.nome ? `, ${esc(p.nome.split(' ')[0])}` : ''))
    + (incomplete ? `<div class="section"><button class="row group" data-act="edit-profile">
        <span class="badge accent">${ic('user')}</span>
        <span class="body"><div class="t">Complete seu perfil</div><div class="s">Nome, altura, peso e meta</div></span>
        <span class="end">${ic('right')}</span></button></div>` : '')
    + summary
    + `<div class="section">${workout}</div>`
    + `<div class="section">${meal}</div>`
    + bento
    + section('Esta semana', weekStrip());
};

/* segunda-feira da semana mostrada; 0 = semana atual, -1 = anterior */
function weekMonday(off = 0) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const m = new Date(now);
  m.setDate(now.getDate() - ((now.getDay() + 6) % 7) + off * 7);
  return m;
}
function weekStrip() {
  const off = state.ui.weekOff || 0;
  const monday = weekMonday(off), sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const trained = new Set(finished().map((s) => todayKey(new Date(s.start))));
  state.activities.forEach((a) => trained.add(a.date));
  const names = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const k = todayKey(d), futuro = k > todayKey();
    html += `<button class="wd" data-act="day" data-v="${k}" ${futuro ? 'disabled' : ''} aria-label="Ver ${fmtDayLong(k)}">
      <span class="d">${names[i]}</span>
      <span class="dot ${trained.has(k) ? 'on' : ''} ${k === todayKey() ? 'today' : ''}">${d.getDate()}</span></button>`;
  }
  const count = finished().filter((s) => { const t = new Date(s.start); return t >= monday && t < new Date(sunday.getTime() + 864e5); }).length;
  const label = off === 0 ? 'Esta semana' : `${fmtDay(todayKey(monday))} – ${fmtDay(todayKey(sunday))}`;
  return `<div class="group"><div class="week-nav">
      <button class="icon-btn" data-act="week" data-v="-1" aria-label="Semana anterior">${ic('left')}</button>
      <b>${label}</b>
      <button class="icon-btn" data-act="week" data-v="1" aria-label="Próxima semana" ${off >= 0 ? 'disabled style="opacity:.3"' : ''}>${ic('right')}</button>
    </div>
    <div class="week">${html}</div>
    <div class="pad" style="padding-top:0" ><div class="hint">${count} de ${state.profile.dias} treinos da semana</div>
    <div class="bar"><i style="width:${Math.min(100, (count / state.profile.dias) * 100)}%;background:var(--accent)"></i></div></div></div>`;
}
A.week = (v) => { state.ui.weekOff = Math.min(0, (state.ui.weekOff || 0) + Number(v)); render(); };
/* resumo de um dia: treino, refeições, rotina, atividades e peso */
A.day = (k) => {
  const log = state.dietLog[k] || { checked: {}, extras: [] };
  const sess = finished().filter((s) => todayKey(new Date(s.start)) === k);
  const acts = state.activities.filter((a) => a.date === k);
  const m = state.morning.find((x) => x.date === k);
  const meals = state.diet.groups, feitas = meals.filter((g) => mealCheck(log, g)).length;
  const rot = state.routines || [], rlog = (state.routineLog || {})[k] || {};
  const rFeitas = rot.filter((r) => rlog[r.id]).length;
  const linha = (titulo, valor, cor) => `<div class="row plain"><span class="body"><div class="t">${titulo}</div></span>
    <span class="end"><b class="num" ${cor ? `style="color:${cor}"` : ''}>${valor}</b></span></div>`;
  sheet(`<h2>${cap(fmtDayLong(k))}</h2>
    <p class="lead">${k === todayKey() ? 'Hoje' : 'Resumo do dia'}</p>
    <div class="group">
      ${linha('Treino', sess.length ? sess.map((s) => s.workoutName).join(', ') : '—', sess.length ? 'var(--c-treino)' : '')}
      ${meals.length ? linha('Refeições', `${feitas}/${meals.length}`, feitas === meals.length ? 'var(--c-dieta)' : '') : ''}
      ${rot.length ? linha('Rotina', `${rFeitas}/${rot.length}`, rFeitas === rot.length ? 'var(--c-dieta)' : '') : ''}
      ${linha('Atividades', acts.length ? acts.map((a) => a.tipo).join(', ') : '—')}
      ${linha('Peso', m?.peso != null ? `${br(m.peso)} kg` : '—')}
      ${log.extras.length ? linha('Fora do plano', `${Math.round(extrasKcal(log))} kcal`) : ''}
    </div>
    ${sess.length ? `<div class="sub-head">Treinos</div><div class="group">${sess.map((s) => `<button type="button" class="row plain" data-act="session" data-v="${s.id}">
      <span class="body"><div class="t">${esc(s.workoutName)}</div><div class="s">${Math.round((s.end - s.start) / 60000)} min · ${s.exercises.reduce((n, e) => n + e.sets.length, 0)} séries</div></span>
      <span class="end">${ic('right')}</span></button>`).join('')}</div>` : ''}`);
};

/* ---------------- Tela: Treino ---------------- */
views.treino = () => {
  if (state.active) return activeView();
  const nw = nextWorkout();
  const ws = state.plan.workouts;
  return head(`${state.profile.dias}x por semana · ${LEVEL_LABEL[state.profile.nivel]}`, 'Treino',
      `<button class="icon-btn" data-act="plan" aria-label="Ajustar plano">${ic('sliders')}</button>`)
    + section('Seus treinos', ws.length ? `<div class="wk-list">${ws.map((w) => `
        <button class="wk-card ${nw && w.id === nw.id ? 'next' : ''}" data-act="workout" data-v="${w.id}">
          <span class="lt">${esc(w.letter)}</span>
          <span class="body"><div class="t">${esc(w.name)}</div><div class="s">${w.exercises.length} exercícios · ~${estMinutes(w)} min</div></span>
          <span class="end">${nw && w.id === nw.id ? '<span class="tag accent">Próximo</span>' : ''}${ic('right')}</span>
        </button>`).join('')}</div>` : `<div class="group empty">${ic('dumbbell')}<div>Nenhum treino no plano.</div></div>`,
      `<button class="text-btn" data-act="add-workout">+ Novo</button>`)
    + (state.plan.source === 'personalizado' ? '<p class="hint" style="padding:10px 4px 0">Plano editado por você.</p>' : '');
};

function activeView() {
  const s = state.active;
  const total = s.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  return `<div class="session-head"><div class="row1">
      <div class="body"><div class="t">${esc(s.workoutLetter || '')} · ${esc(s.workoutName)}</div>
      <div class="s num"><span id="elapsed">${fmtClock((Date.now() - s.start) / 1000)}</span> · ${done} de ${total} séries</div></div>
      <button class="btn sm" data-act="finish">Concluir</button></div>
      <div class="prog"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div></div>
    ${s.exercises.map((e, ei) => {
      const prev = lastPerformance(e.name);
      const carga = e.tipo === 'carga';
      const h1 = carga ? 'kg' : e.tipo === 'cardio' ? 'min' : 'seg';
      const h2 = carga ? 'reps' : e.tipo === 'cardio' ? 'km' : '—';
      const complete = e.sets.length && e.sets.every((x) => x.done);
      return `<div class="ex ${complete ? 'complete' : ''}">
        <div class="ex-top"><div>
          <div class="ex-name">${esc(e.name)}</div>
          <div class="ex-meta num">${e.sets.length} × ${esc(e.reps)}${e.rest ? ` · descanso ${e.rest}s` : ''}</div>
          ${e.notes ? `<div class="ex-note">${esc(e.notes)}</div>` : ''}
        </div>${complete ? `<span class="ex-done">${ic('check')}</span>` : ''}</div>
        <div class="sets">
          <div class="h">Série</div><div class="h">Anterior</div><div class="h">${h1}</div><div class="h">${h2}</div><div class="h"></div>
          ${e.sets.map((st, si) => {
            const pv = prev?.sets[si];
            const pvTxt = pv ? (carga ? `${br(num(pv.kg))} × ${pv.reps}` : `${pv.kg || '—'} ${h1}`) : '—';
            return `<div class="set ${st.done ? 'done' : ''} ${justKey === `${ei}.${si}` ? 'just' : ''}">
              <div class="n">${si + 1}</div>
              <button class="prev num" data-act="copy-prev" data-v="${ei}.${si}" ${pv ? '' : 'disabled'} aria-label="Usar valores anteriores">${esc(pvTxt)}</button>
              <input inputmode="decimal" data-set="${ei}.${si}.kg" value="${esc(st.kg)}" placeholder="${esc(pv?.kg ?? '')}" aria-label="${h1}, série ${si + 1}">
              <input inputmode="decimal" data-set="${ei}.${si}.reps" value="${esc(st.reps)}" placeholder="${esc(pv?.reps ?? (carga ? String(e.reps).split('-')[0] : ''))}" aria-label="${h2}, série ${si + 1}" ${!carga && e.tipo !== 'cardio' ? 'disabled' : ''}>
              <button class="chk" data-act="toggle-set" data-v="${ei}.${si}" aria-label="Concluir série ${si + 1}">${ic('check')}</button>
            </div>`;
          }).join('')}
        </div>
        <button class="add-set" data-act="add-set" data-v="${ei}">+ Adicionar série</button>
      </div>`;
    }).join('')}
    <div class="stack-btns"><button class="btn danger block" data-act="cancel-workout">Descartar treino</button></div>`;
}

/* ---------------- Tela: Dieta ---------------- */
views.dieta = () => {
  const groups = state.diet.groups;
  if (!groups.length) {
    return head('Plano da nutricionista', 'Alimentação')
      + section('Adicionar plano', `<div class="group pad">
        <p class="hint" style="margin-bottom:12px">Cole o texto do plano. Pode ter opções, substituições e observações, assim:</p>
        <textarea id="diet-raw" placeholder="07:30 - Café da manhã&#10;Iogurte desnatado - 170 g&#10;Aveia em flocos - 30 g&#10;Morango - 10 unidades ou 120 g&#10;Substituição: Salada de frutas - 1 porção&#10;&#10;07:30 - Café da manhã - Opção 2&#10;Pão integral - 2 fatias&#10;&#10;12:00 - Almoço&#10;Arroz branco cozido - 125 g&#10;Peito de frango grelhado - 150 g&#10;Observação: legumes e folhas à vontade">${esc(state.diet.raw)}</textarea>
        <div class="stack-btns"><button class="btn block" data-act="save-diet">Salvar plano</button></div></div>`);
  }
  const key = state.ui.dietDay || todayKey();
  const log = dayLog(key);
  const done = groups.filter((g) => mealCheck(log, g)).length;
  const nowMeal = nextMeal(log);
  return head('Plano da nutricionista', 'Alimentação',
      `<button class="icon-btn" data-act="diet-editor" aria-label="Adicionar refeição">${ic('plus')}</button>`)
    + `<div class="section"><div class="day-switch">
        <button class="icon-btn" data-act="diet-day" data-v="-1" aria-label="Dia anterior">${ic('left')}</button>
        <b>${key === todayKey() ? 'Hoje' : cap(fmtDayLong(key))}</b>
        <button class="icon-btn" data-act="diet-day" data-v="1" aria-label="Próximo dia" ${key >= todayKey() ? 'disabled style="opacity:.3"' : ''}>${ic('right')}</button>
      </div></div>`
    + `<div class="section"><div class="group diet-sum">${rings([{ v: done / groups.length, color: 'var(--c-dieta)' }], 76, 10)}
        <div><div class="big digits"><span data-count="${done}" data-count-key="refeicoes">${done}</span><small> de ${groups.length}</small></div>
        <div class="s">refeições${extrasKcal(log) ? ` · ${Math.round(extrasKcal(log))} kcal fora do plano` : ''}</div></div></div></div>`
    + section('Refeições', `<div class="meal-list">${groups.flatMap((g) => g.options.map((o, oi) => {
        const c = mealCheck(log, g);
        const reg = !!c && c.opt === oi;        // esta opção é a registrada
        const other = !!c && c.opt !== oi;      // outra opção da mesma refeição foi registrada
        const isNow = key === todayKey() && !c && nowMeal?.id === g.id && oi === 0;
        return `<div class="meal-card ${reg ? 'done' : ''} ${other ? 'faded' : ''} ${isNow ? 'now' : ''} ${justKey === `${g.id}:${oi}` ? 'just' : ''}">
          <button class="meal-main" data-act="meal-open" data-v="${g.id}:${oi}">
            <span class="mc-ic">${ic('meal')}</span>
            <span class="body"><div class="t">${esc(mealTitle(g, oi))}</div>${isNow ? '<span class="now-tag">Agora</span>' : ''}</span>
          </button>
          <button class="meal-tick" data-act="meal-quick" data-v="${g.id}:${oi}" aria-pressed="${reg}" aria-label="Marcar ${esc(mealLabel(g, oi))}">${ic('check')}</button>
        </div>`;
      })).join('')}</div>`)
    + section(`Fora do plano${extrasKcal(log) ? ` · ${Math.round(extrasKcal(log))} kcal` : ''}`, log.extras.length
        ? `<div class="group">${log.extras.map((x, i) => `<div class="row plain"><span class="body"><div class="t" style="font-weight:500">${esc(x.text)}</div>
            <div class="s num">${esc(x.time)}${x.kcal != null ? ` · ${Math.round(x.kcal)} kcal` : ''}${x.ai ? ' · estimado pela IA' : ''}</div></span>
            <button class="text-btn" style="color:var(--ink-3)" data-act="del-extra" data-v="${i}">Remover</button></div>`).join('')}</div>`
        : '',
      `<button class="add-btn" data-act="add-extra" aria-label="Registrar algo que comi fora do plano">${ic('plus')}</button>`)
    + toolsSection();
};


function toolsSection() {
  const nRec = RECIPES.length + state.recipes.length;
  return section('Ferramentas', `<div class="group">
    <button class="row" data-act="shopping"><span class="badge">${ic('cart')}</span><span class="body"><div class="t">Lista de compras</div><div class="s">Montada a partir do seu plano</div></span><span class="end">${ic('right')}</span></button>
    <button class="row" data-act="recipes"><span class="badge">${ic('book')}</span><span class="body"><div class="t">Receitas</div><div class="s">${nRec} receitas simples</div></span><span class="end">${ic('right')}</span></button>
  </div>`);
}

/* ---------------- Tela: Perfil ---------------- */
const IMC_FAIXA = (v) => (v < 18.5 ? 'abaixo do peso' : v < 25 ? 'peso adequado' : v < 30 ? 'sobrepeso' : 'obesidade');
/* Faixas do IMC para adultos (OMS). Referência geral: não separa músculo de gordura. */
function weightFeedback(w, alturaCm) {
  if (!w || !alturaCm) return null;
  const h = alturaCm / 100, imc = w / (h * h);
  const min = 18.5 * h * h, max = 24.9 * h * h;
  let msg;
  if (imc < 18.5) msg = `Você está ${br(min - w)} kg abaixo da faixa considerada saudável para a sua altura.`;
  else if (imc < 25) msg = 'Seu peso está dentro da faixa considerada saudável para a sua altura.';
  else msg = `Você está ${br(w - max)} kg acima da faixa considerada saudável para a sua altura.`;
  return { imc, faixa: IMC_FAIXA(imc), min, max, msg };
}
function weightCard(fb) {
  const pos = Math.max(0, Math.min(100, ((fb.imc - 15) / (40 - 15)) * 100));
  const seg = (a, b, cls, label) => `<div class="imc-seg ${cls}" style="width:${((b - a) / 25) * 100}%"><span>${label}</span></div>`;
  return `<div class="group pad">
    <div class="row-between"><div><div class="hint">IMC</div><div class="stat num">${br(fb.imc)}</div></div><span class="tag ${fb.imc >= 18.5 && fb.imc < 25 ? 'ok' : ''}">${cap(fb.faixa)}</span></div>
    <div class="imc-bar">${seg(15, 18.5, '', 'Abaixo')}${seg(18.5, 25, 'good', 'Saudável')}${seg(25, 30, '', 'Sobrepeso')}${seg(30, 40, '', 'Obesidade')}<i style="left:${pos}%"></i></div>
    <p style="margin-top:28px">${fb.msg}</p>
    <p class="hint" style="margin-top:6px">Para a sua altura, a faixa saudável vai de <b class="num">${br(fb.min)}</b> a <b class="num">${br(fb.max)} kg</b>. O IMC é uma referência geral para adultos e não diferencia músculo de gordura. Sua nutricionista avalia melhor o seu caso.</p>
  </div>`;
}
const latestWeight = () => morningSorted().filter((x) => x.peso != null).pop()?.peso ?? null;
views.perfil = () => {
  const p = state.profile;
  const w = latestWeight();
  const fb = weightFeedback(w, p.altura);
  const kv = (label, value) => `<button class="row plain kv" data-act="edit-profile"><span class="body"><div class="t">${label}</div></span><span class="end">${value != null && value !== '' ? `<span class="v num">${value}</span>` : '<span>Adicionar</span>'}</span></button>`;
  return `<header class="head profile-head">
      <button class="icon-btn" data-act="goto" data-v="hoje" aria-label="Voltar">${ic('left')}</button>
      <div class="avatar big">${p.nome ? esc(initials(p.nome)) : ic('user')}</div>
      <div><div class="kicker">Seu perfil</div><h1>${esc(p.nome || 'Perfil')}</h1></div></header>`
    + (fb ? section('Seu peso', weightCard(fb)) : (w || p.altura ? `<div class="section"><div class="group empty">Informe ${w ? 'a altura' : 'o peso'} para ver se o seu peso está numa faixa saudável.</div></div>` : ''))
    + (w && p.meta ? `<div class="section"><div class="group pad row-between"><div><div class="hint">Até a meta de ${br(p.meta)} kg</div>
        <div class="stat num">${Math.abs(w - p.meta) < 0.05 ? 'Chegou!' : br(Math.abs(w - p.meta)) + '<small> kg</small>'}</div></div>
        ${p.meta < fb?.min || p.meta > fb?.max ? '<span class="tag">Meta fora da faixa saudável</span>' : ''}</div></div>` : '')
    + section('Dados pessoais', `<div class="group">
        ${kv('Nome', p.nome ? esc(p.nome) : '')}
        ${kv('Idade', p.idade ? `${p.idade} anos` : '')}
        ${kv('Sexo', p.sexo ? (p.sexo === 'm' ? 'Masculino' : 'Feminino') : '')}
        ${kv('Altura', p.altura ? `${br(p.altura / 100, 2)} m` : '')}
        <div class="row plain kv split">
          <button class="kv-main" data-act="peso"><span class="body"><div class="t">Peso atual</div></span>
            <span class="end">${w != null ? `<span class="v num">${br(w)} kg</span>` : '<span>Atualizar</span>'}</span></button>
          <button class="kv-side" data-act="peso-report" aria-label="Relatório de peso" title="Relatório de peso">${ic('chart')}</button>
        </div>
        ${kv('Meta de peso', p.meta ? `${br(p.meta)} kg` : '')}
        ${kv('Nutricionista', p.nutri ? esc(p.nutri) : '')}
      </div>`, `<button class="text-btn" data-act="edit-profile">Editar</button>`)
    + section('Treino', `<div class="group"><button class="row plain" data-act="plan"><span class="body"><div class="t">Plano de treino</div>
        <div class="s">Emagrecimento · ${p.dias}x por semana · ${LEVEL_LABEL[p.nivel]}</div></span><span class="end">${ic('right')}</span></button></div>`)
    + section('Alimentação', `<div class="group"><button class="row plain" data-act="diet-editor">
        <span class="body"><div class="t">Montar refeições</div>
        <div class="s">${state.diet.groups.length ? `${state.diet.groups.length} ${state.diet.groups.length === 1 ? 'refeição' : 'refeições'} · ${state.diet.groups.reduce((t, g) => t + g.options.length, 0)} opções` : 'Café, almoço, lanche, jantar, ceia…'}</div></span>
        <span class="end">${ic('right')}</span></button></div>`)
    + section('Assistente IA', `<div class="group"><button class="row plain" data-act="ai-key"><span class="body"><div class="t">Cálculo de calorias por foto</div>
        <div class="s">${state.ai?.key ? 'Ativado' : 'Toque para configurar'}</div></span><span class="end">${state.ai?.key ? '<span class="tag ok">Ativo</span>' : ''}${ic('right')}</span></button></div>`)
    + section('Seus dados', `<div class="group">
        <button class="row plain" data-act="export"><span class="body"><div class="t">Exportar backup</div><div class="s">Salva um arquivo com todos os seus dados</div></span></button>
        <button class="row plain" data-act="import"><span class="body"><div class="t">Importar backup</div><div class="s">Restaura a partir de um arquivo</div></span></button>
      </div>
      <p class="hint" style="padding:10px 4px 0">Tudo fica salvo só neste celular. Em breve: atividades automáticas do relógio.</p>
      <div class="stack-btns"><button class="btn danger block" data-act="reset">Apagar todos os dados</button></div>`);
};


/* ================= Rotina =================
   Mesma ideia da alimentação: você monta os itens e vai marcando no dia.
   state.routines = [{id, name, time, dias:[0..6]|null, nota}]
   state.routineLog = { 'AAAA-MM-DD': { idDoItem: timestamp } } */
const routineLog = (k) => {
  state.routineLog = state.routineLog || {};
  if (!state.routineLog[k]) state.routineLog[k] = {};
  return state.routineLog[k];
};
const DIAS_CURTO = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const DIAS_NOME = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
/* índice 0..6 começando na segunda, igual à faixa da semana */
const weekIdx = (k) => (keyToDate(k).getDay() + 6) % 7;
const routinesOf = (k) => (state.routines || []).filter((r) => !r.dias?.length || r.dias.includes(weekIdx(k)));
const routineSorted = (k) => routinesOf(k).slice().sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

views.rotina = () => {
  const key = state.ui.rotDay || todayKey();
  const list = routineSorted(key), log = routineLog(key);
  const done = list.filter((r) => log[r.id]).length;
  return head('Seus hábitos', 'Rotina',
      `<button class="icon-btn" data-act="rot-editor" aria-label="Adicionar hábito">${ic('plus')}</button>`)
    + `<div class="section"><div class="day-switch">
        <button class="icon-btn" data-act="rot-day" data-v="-1" aria-label="Dia anterior">${ic('left')}</button>
        <b>${key === todayKey() ? 'Hoje' : cap(fmtDayLong(key))}</b>
        <button class="icon-btn" data-act="rot-day" data-v="1" aria-label="Próximo dia" ${key >= todayKey() ? 'disabled style="opacity:.3"' : ''}>${ic('right')}</button>
      </div></div>`
    + (list.length
      ? `<div class="section"><div class="group diet-sum">${rings([{ v: done / list.length, color: 'var(--c-rotina)' }], 76, 10)}
          <div><div class="big digits"><span data-count="${done}" data-count-key="rotina">${done}</span><small> de ${list.length}</small></div>
          <div class="s">${done === list.length ? 'rotina completa' : list.length === 1 ? 'hábito' : 'hábitos'}</div></div></div></div>`
        + section('Hábitos do dia', `<div class="meal-list rot">${list.map((r) => {
            const ok = !!log[r.id];
            return `<div class="meal-card ${ok ? 'done' : ''} ${justKey === r.id ? 'just' : ''}">
              <button class="meal-main" data-act="rot-open" data-v="${r.id}">
                <span class="mc-ic">${ic('check')}</span>
                <span class="body"><div class="t">${r.time ? `${esc(r.time)} - ` : ''}${esc(r.name)}</div></span>
              </button>
              <button class="meal-tick" data-act="rot-tick" data-v="${r.id}" aria-pressed="${ok}" aria-label="Marcar ${esc(r.name)}">${ic('check')}</button>
            </div>`;
          }).join('')}</div>`)
      : `<div class="section"><div class="group empty">Nenhum hábito para ${key === todayKey() ? 'hoje' : 'este dia'}.</div>
          <div class="stack-btns"><button class="btn block" data-act="rot-editor">Montar minha rotina</button></div></div>`);
};
A['rot-day'] = (v) => {
  const d = keyToDate(state.ui.rotDay || todayKey()); d.setDate(d.getDate() + Number(v));
  const k = todayKey(d); state.ui.rotDay = k > todayKey() ? todayKey() : k; render();
};
A['rot-tick'] = (id) => {
  const log = routineLog(state.ui.rotDay || todayKey());
  if (log[id]) delete log[id]; else { log[id] = Date.now(); justKey = id; buzz(); }
  save(); render();
};
/* detalhe do hábito: marcar, a nota e o quanto você tem mantido */
A['rot-open'] = (id) => {
  const r = (state.routines || []).find((x) => x.id === id);
  if (!r) return;
  const key = state.ui.rotDay || todayKey(), log = routineLog(key), ok = !!log[id];
  /* quantos dos últimos 30 dias em que o hábito valia você cumpriu */
  let prev = 0, tot = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = todayKey(d);
    if (!routinesOf(k).some((x) => x.id === id)) continue;
    tot++; if ((state.routineLog || {})[k]?.[id]) prev++;
  }
  sheet(`<h2>${r.time ? `<span class="num" style="color:var(--ink-3)">${esc(r.time)}</span> · ` : ''}${esc(r.name)}</h2>
    <p class="lead">${r.dias?.length ? r.dias.map((i) => DIAS_NOME[i]).join(', ') : 'Todos os dias'}</p>
    <div class="meal-menu" style="grid-template-columns:1fr">
      <button type="button" class="mm ${ok ? 'on' : ''}" data-act="rot-tick" data-v="${r.id}">
        ${ic('check')}<span>${ok ? 'Feito · toque para desfazer' : 'Marcar como feito'}</span></button>
    </div>
    ${r.nota ? `<div class="notes-open"><div class="sub-head">Nota</div><div>${esc(r.nota).replace(/\n/g, '<br>')}</div></div>` : ''}
    <div class="sub-head">Nos últimos 30 dias</div>
    <div class="group pad row-between"><div><div class="hint">Dias cumpridos</div>
      <div class="stat num"><span data-count="${prev}" data-count-key="habito-${r.id}">${prev}</span><small> de ${tot}</small></div></div>
      ${tot ? `<span class="tag ${prev / tot >= 0.7 ? 'ok' : ''}">${Math.round((prev / tot) * 100)}%</span>` : ''}</div>
    <div class="stack-btns"><button type="button" class="text-btn" data-act="rot-edit" data-v="${r.id}">Editar hábito</button></div>`);
};

/* ----- montar a rotina ----- */
const ROTINA_PRESETS = ['Ler', 'Beber 2 L de água', 'Tomar sol', 'Alongar', 'Meditar', 'Dormir até 23h', 'Estudar', 'Caminhar'];
function rotEditor() {
  const rs = state.routines || [];
  sheet(`<h2>Sua rotina</h2>
    <p class="lead">Monte os hábitos que você quer manter. Marque cada um no dia.</p>
    ${rs.length ? `<div class="group">${rs.map((r) => `<button type="button" class="row plain" data-act="rot-edit" data-v="${r.id}">
        <span class="body"><div class="t">${r.time ? `<span class="num" style="color:var(--ink-3);margin-right:8px">${esc(r.time)}</span>` : ''}${esc(r.name)}</div>
        <div class="s">${r.dias?.length ? r.dias.map((i) => DIAS_CURTO[i]).join(' · ') : 'Todos os dias'}</div></span>
        <span class="end">${ic('right')}</span></button>`).join('')}</div>`
      : '<p class="hint">Nenhum hábito ainda. Comece pelas sugestões.</p>'}
    <div class="sub-head">Sugestões</div>
    <div class="chips">${ROTINA_PRESETS.filter((n) => !rs.some((r) => eqNorm(r.name) === eqNorm(n)))
      .map((n) => `<button type="button" class="chip" data-act="rot-add" data-v="${esc(n)}">+ ${esc(n)}</button>`).join('')
      || '<span class="hint">Todas as sugestões já estão na sua rotina.</span>'}</div>
    <button type="button" class="btn soft block" style="margin-top:12px" data-act="rot-add" data-v="">+ Outro hábito</button>`, null, 1);
}
A['rot-editor'] = () => rotEditor();
A['rot-add'] = (v) => {
  state.routines = state.routines || [];
  const r = { id: uid(), name: String(v) || 'Novo hábito', time: '', dias: [], nota: '' };
  state.routines.push(r); save(); render();
  rotEdit(r.id);
};
function rotEdit(id) {
  const r = (state.routines || []).find((x) => x.id === id);
  if (!r) return rotEditor();
  sheet(`<div class="sheet-nav">
      <button type="button" class="icon-btn" data-act="rot-editor" aria-label="Voltar">${ic('left')}</button>
      <div><div class="kicker">Hábito</div><h2 style="margin:0">${esc(r.name)}</h2></div>
    </div>
    <div class="two" style="margin-top:14px">
      <div class="field"><label>Nome</label><input name="nome" value="${esc(r.name)}" placeholder="ex.: Ler 20 páginas"></div>
      <div class="field"><label>Horário</label><input name="hora" type="time" value="${esc(r.time || '')}"></div>
    </div>
    <div class="field"><label>Dias da semana</label>
      <div class="chips">${DIAS_NOME.map((n, i) => `<button type="button" class="chip day-chip ${r.dias?.includes(i) ? 'on' : ''}" data-act="rot-dia" data-v="${r.id}:${i}">${n.slice(0, 3)}</button>`).join('')}</div>
      <p class="hint" style="margin-top:6px">Nenhum dia marcado = todos os dias.</p></div>
    <div class="field"><label>Nota</label><textarea name="nota" style="min-height:80px" placeholder="opcional">${esc(r.nota || '')}</textarea></div>
    <button type="button" class="btn block" data-act="rot-save" data-v="${r.id}">Salvar hábito</button>
    <button type="button" class="btn danger block" style="margin-top:12px" data-act="rot-del" data-v="${r.id}">Excluir hábito</button>`, null, 2);
}
A['rot-edit'] = (id) => rotEdit(id);
A['rot-dia'] = (v) => {
  const [id, i] = String(v).split(':'), r = (state.routines || []).find((x) => x.id === id);
  if (!r) return;
  r.dias = r.dias || [];
  const n = Number(i);
  if (r.dias.includes(n)) r.dias = r.dias.filter((x) => x !== n); else r.dias.push(n);
  r.dias.sort((a, b) => a - b);
  /* guarda o que já está digitado antes de redesenhar a folha */
  const f = $('#sheet-body');
  r.name = f.nome.value.trim() || r.name; r.time = f.hora.value; r.nota = f.nota.value.trim();
  save(); render(); rotEdit(id);
};
A['rot-save'] = (id) => {
  const r = (state.routines || []).find((x) => x.id === id), f = $('#sheet-body');
  if (!r) return;
  r.name = f.nome.value.trim() || r.name; r.time = f.hora.value; r.nota = f.nota.value.trim();
  save(); render(); rotEditor();
};
A['rot-del'] = (id) => {
  const r = (state.routines || []).find((x) => x.id === id);
  if (!r || !confirm(`Excluir "${r.name}"?`)) return;
  state.routines = state.routines.filter((x) => x.id !== id);
  Object.values(state.routineLog || {}).forEach((l) => delete l[id]);
  save(); render(); rotEditor();
};

/* ---------------- Tela: Progresso ---------------- */
views.progresso = () => {
  const ms = morningSorted().filter((x) => x.peso != null).slice(-60);
  const wPts = ms.map((x) => ({ y: x.peso, label: fmtDay(x.date) }));
  const cur = ms[ms.length - 1], first = ms[0];
  const dw = cur && ms.length > 1 ? cur.peso - first.peso : null;
  const pesoHero = cur ? `<div class="hero"><div class="label">Peso atual</div>
      <div class="big">${br(cur.peso)}<small>kg</small></div>
      ${dw != null ? `<span class="tag delta num ${dw < 0 ? 'ok' : ''}">${dw > 0 ? '+' : ''}${br(dw)} kg desde ${fmtDay(first.date)}</span>` : ''}</div>` : '';
  const since = Date.now() - 30 * 864e5;
  const last30 = finished().filter((s) => s.start >= since);
  const minutes30 = last30.reduce((t, s) => t + (s.end - s.start) / 60000, 0);
  const groupsN = state.diet.groups.length;
  const dietDays = groupsN ? Object.entries(state.dietLog).filter(([d, l]) => keyToDate(d).getTime() >= since && state.diet.groups.every((g) => mealCheck(l, g))).length : 0;
  const stats = `<div class="section stats">
      <div class="stat-tile"><div class="v digits" style="color:var(--c-treino)">${last30.length}</div><div class="l">treinos em 30 dias</div></div>
      <div class="stat-tile"><div class="v digits" style="color:var(--c-treino)">${minutes30 >= 60 ? br(minutes30 / 60, 1) + '<small style="font-size:14px"> h</small>' : Math.round(minutes30) + '<small style="font-size:14px"> min</small>'}</div><div class="l">treinando</div></div>
      <div class="stat-tile"><div class="v digits" style="color:var(--c-dieta)">${dietDays}</div><div class="l">dias com dieta completa</div></div>
    </div>`;

  const names = [...new Set(finished().flatMap((s) => s.exercises.filter((e) => e.tipo === 'carga' && e.sets.some((x) => num(x.kg))).map((e) => e.name)))];
  const sel = names.includes(state.ui.progressEx) ? state.ui.progressEx : names[0];
  const lPts = sel ? finished().map((s) => {
    const e = s.exercises.find((x) => x.name === sel);
    const kgs = e ? e.sets.map((x) => num(x.kg)).filter((v) => v != null) : [];
    return kgs.length ? { y: Math.max(...kgs), label: fmtDay(todayKey(new Date(s.start))) } : null;
  }).filter(Boolean) : [];

  const recent = finished().slice(-12).reverse();
  return head('Seu progresso', 'Progresso')
    + stats
    + section('Peso', `<div class="group">${pesoHero}${chartSlot('peso', wPts, 'kg')}</div>`,
      `<button class="text-btn" data-act="morning">+ Pesagem</button>`)
    + section('Carga por exercício', names.length ? `<div class="group">
        <div class="pad" style="padding-bottom:0"><select data-act="progress-ex" aria-label="Exercício">${names.map((n) => `<option ${n === sel ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        ${lPts.length ? `<div class="hero" style="padding-top:12px"><div class="label">Maior carga recente</div><div class="big">${br(lPts[lPts.length - 1].y)}<small>kg</small></div></div>` : ''}
        ${chartSlot('carga', lPts, 'kg', 'treino')}</div>`
      : `<div class="group empty">${ic('chart')}<div>Depois de alguns treinos, a evolução de cada exercício aparece aqui.</div></div>`)
    + section('Treinos recentes', recent.length ? `<div class="group">${recent.map((s) => {
        const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
        return `<button class="row plain" data-act="session" data-v="${s.id}"><span class="body"><div class="t">${esc(s.workoutName)}</div>
          <div class="s num">${cap(fmtDayLong(todayKey(new Date(s.start))))} · ${Math.round((s.end - s.start) / 60000)} min · ${sets} séries</div></span><span class="end">${ic('right')}</span></button>`;
      }).join('')}</div>` : `<div class="group empty">${ic('history')}<div>Seus treinos concluídos aparecem aqui.</div></div>`)
    + section('Atividades extras', state.activities.length ? `<div class="group">${state.activities.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((a) => `
        <div class="row plain"><span class="body"><div class="t">${esc(a.tipo)}</div>
        <div class="s num">${fmtDay(a.date)}${a.minutos ? ` · ${a.minutos} min` : ''}${a.kcal ? ` · ${a.kcal} kcal` : ''}${a.passos ? ` · ${a.passos.toLocaleString('pt-BR')} passos` : ''}</div></span>
        <button class="text-btn" style="color:var(--ink-3)" data-act="del-activity" data-v="${a.id}">Remover</button></div>`).join('')}</div>`
      : `<div class="group empty">Nada registrado ainda.</div>`, `<button class="text-btn" data-act="activity">+ Adicionar</button>`);
};

/* ---------------- Render ---------------- */
/* o Perfil saiu da barra: abre pelo avatar do canto superior direito */
const TABS = [['hoje', 'Hoje', 'home'], ['treino', 'Treino', 'dumbbell'], ['dieta', 'Dieta', 'meal'], ['rotina', 'Rotina', 'check'], ['progresso', 'Progresso', 'chart']];
/* ---------- Count up: o número sobe até o valor em vez de aparecer pronto ----------
   Marque com data-count="<valor final>". O texto do elemento é reescrito a cada
   quadro, então o conteúdo inicial serve só de fallback sem JS. */
const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ultimoValor = new Map();
function countUp(el) {
  const fim = parseFloat(el.dataset.count);
  if (!Number.isFinite(fim)) return;
  const casas = Number(el.dataset.countDec || 0), chave = el.dataset.countKey || '';
  const ini = chave && ultimoValor.has(chave) ? ultimoValor.get(chave) : 0;
  if (chave) ultimoValor.set(chave, fim);
  const escreve = (v) => { el.textContent = casas ? br(v, casas) : String(Math.round(v)); };
  if (semMovimento() || ini === fim) return escreve(fim);
  const dur = 600, t0 = performance.now();
  const passo = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);  /* desacelera no fim */
    escreve(ini + (fim - ini) * e);
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
function render() {
  const tab = state.ui.tab;
  $('#view').innerHTML = views[tab]();
  $('#tabs').innerHTML = TABS.map(([k, label, icon]) => `<button data-tab="${k}" class="${k === tab ? 'active' : ''}" aria-current="${k === tab ? 'page' : 'false'}"><span class="pill">${ic(icon)}</span>${label}</button>`).join('');
  $$('[data-chart]').forEach(drawChart);
  $$('[data-count]').forEach(countUp);
  justKey = null;
}
function animateView() { const v = $('#view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); }
function go(tab) { state.ui.tab = tab; save(); render(); animateView(); window.scrollTo(0, 0); }

setInterval(() => { const el = $('#elapsed'); if (el && state.active) el.textContent = fmtClock((Date.now() - state.active.start) / 1000); }, 1000);
let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => $$('[data-chart]').forEach(drawChart), 150); });

/* ---------------- Timer de descanso ---------------- */
const timer = { end: 0, total: 0, beeped: false, iv: null };
const ARC = 2 * Math.PI * 36;
function startTimer(sec, nextLabel = '') {
  if (!sec) return;
  Object.assign(timer, { total: sec, end: Date.now() + sec * 1000, beeped: false });
  $('#timer-next').textContent = nextLabel;
  $('#timer').classList.remove('hidden', 'over'); document.body.classList.add('timer-on');
  clearInterval(timer.iv); timer.iv = setInterval(tick, 250); tick();
}
function stopTimer() { clearInterval(timer.iv); timer.end = 0; $('#timer').classList.add('hidden'); document.body.classList.remove('timer-on'); }
function tick() {
  const left = (timer.end - Date.now()) / 1000;
  $('#timer-text').textContent = (left < 0 ? '+' : '') + fmtClock(left);
  $('#timer-arc').style.strokeDashoffset = (ARC * (1 - Math.max(0, Math.min(1, left / timer.total)))).toFixed(1);
  if (left <= 0 && !timer.beeped) { timer.beeped = true; $('#timer').classList.add('over'); beep(); }
  if (left < -120) stopTimer();
}
let audio;
function beep() {
  try { navigator.vibrate?.([300, 120, 300]); } catch {}
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.25, audio.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + t + 0.2);
      o.start(audio.currentTime + t); o.stop(audio.currentTime + t + 0.2);
    });
  } catch {}
}
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen');
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { wakeLock = null; if (state.active) keepAwake(true); render(); }
});

/* ---------------- Bottom sheet ---------------- */
/* nivel: profundidade da tela dentro da folha (1 = raiz, 2 = filha…).
   Descer desliza da direita, subir da esquerda — a direção sai sozinha da
   comparação, então a mesma tela acerta vindo de cima ou de baixo. */
let sheetLevel = 0;
function sheet(html, onSubmit, nivel) {
  const dlg = $('#sheet'), f = $('#sheet-body');
  const dir = dlg.open && nivel && sheetLevel && nivel !== sheetLevel
    ? (nivel > sheetLevel ? 'avanca' : 'volta') : null;
  sheetLevel = nivel || 0;
  const trocando = dlg.open && dir;
  f.innerHTML = `<div class="grab"></div>${html}`;
  f.onsubmit = (ev) => {
    if (ev.submitter?.value === 'ok' && onSubmit && onSubmit(f) === false) ev.preventDefault();
  };
  if (!dlg.open) { dlg.classList.remove('is-closing'); dlg.showModal(); }
  f.scrollTop = 0;
  $$('[data-count]', f).forEach(countUp);
  if (trocando) {
    f.classList.remove('t-enter-right', 't-enter-left');
    void f.offsetWidth;  /* reflow: sem isso a animação não reinicia */
    f.classList.add(dir === 'volta' ? 't-enter-left' : 't-enter-right');
  }
}
/* fecha com animação de saída, depois fecha de verdade */
const SHEET_CLOSE_MS = 180;
$('#sheet').addEventListener('cancel', (ev) => { ev.preventDefault(); closeSheet(); });
function closeSheet() {
  const dlg = $('#sheet');
  if (!dlg.open || dlg.classList.contains('is-closing')) return;
  sheetLevel = 0;
  dlg.classList.add('is-closing');
  setTimeout(() => { dlg.classList.remove('is-closing'); dlg.open && dlg.close(); }, SHEET_CLOSE_MS);
}
$('#sheet').addEventListener('click', (ev) => { if (ev.target.id === 'sheet') closeSheet(); });
A['sheet-close'] = () => closeSheet();

/* Arrastar para baixo fecha a folha: vale pela alça/topo, ou em qualquer ponto
   quando o conteúdo já está rolado até o início. Soltou cedo? Ela volta. */
(() => {
  const dlg = $('#sheet'), body = $('#sheet-body');
  let y0 = null, dy = 0, t0 = 0, arrastando = false;
  const reset = () => { dlg.style.transition = ''; dlg.style.transform = ''; };
  dlg.addEventListener('touchstart', (ev) => {
    if (ev.touches.length !== 1 || ev.target.closest('input, textarea, select')) return;
    const naAlca = ev.target.closest('.grab') || ev.touches[0].clientY - dlg.getBoundingClientRect().top < 56;
    if (!naAlca && body.scrollTop > 0) return;
    y0 = ev.touches[0].clientY; dy = 0; t0 = Date.now(); arrastando = false;
  }, { passive: true });
  dlg.addEventListener('touchmove', (ev) => {
    if (y0 == null) return;
    dy = ev.touches[0].clientY - y0;
    if (!arrastando && dy > 8 && body.scrollTop <= 0) arrastando = true;
    if (!arrastando) return;
    if (dy < 0) dy = 0;
    ev.preventDefault();
    dlg.style.transition = 'none';
    dlg.style.transform = `translateY(${dy}px)`;
  }, { passive: false });
  dlg.addEventListener('touchend', () => {
    if (y0 == null) return;
    const rapido = dy > 40 && dy / Math.max(1, Date.now() - t0) > 0.6;
    if (arrastando && (dy > 120 || rapido)) {
      dlg.style.transition = 'transform .2s ease-in';
      dlg.style.transform = 'translateY(100%)';
      setTimeout(() => { sheetLevel = 0; dlg.open && dlg.close(); reset(); }, 200);
    } else if (arrastando) {
      dlg.style.transition = 'transform .25s cubic-bezier(.2,.9,.25,1)';
      dlg.style.transform = '';
      setTimeout(reset, 260);
    }
    y0 = null; arrastando = false;
  });
})();
const sheetActions = (ok = 'Salvar') => `<div class="sheet-actions"><button class="btn soft" value="cancel" formnovalidate>Cancelar</button><button class="btn" value="ok">${ok}</button></div>`;
const seg = (name, opts, cur) => `<input type="hidden" name="${name}" value="${esc(cur ?? '')}"><div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-act="seg" data-v="${esc(v)}" class="${String(v) === String(cur) ? 'on' : ''}">${l}</button>`).join('')}</div>`;

/* ---------------- Ações ---------------- */
A.goto = (v) => go(v);
A.seg = (v, el) => {
  const box = el.closest('[data-seg]');
  const inp = box.previousElementSibling;
  const was = inp.value === v;
  $$('button', box).forEach((b) => b.classList.remove('on'));
  if (was && el.closest('[data-toggle]')) { inp.value = ''; return; }
  el.classList.add('on'); inp.value = v;
};

A.workout = (id) => {
  const w = state.plan.workouts.find((x) => x.id === id);
  if (!w) return;
  sheet(`<h2>${esc(w.letter)} · ${esc(w.name)}</h2><p class="lead">${w.exercises.length} exercícios · ~${estMinutes(w)} min</p>
    <div class="group" style="background:var(--surface-2)">${w.exercises.map((e) => `<div class="row plain" style="min-height:52px"><span class="body"><div class="t" style="font-weight:500">${esc(e.name)}</div></span><span class="end num">${e.sets} × ${esc(e.reps)}</span></div>`).join('')}</div>
    <div class="sheet-actions"><button class="btn soft" type="button" data-act="edit-workout" data-v="${w.id}">Editar</button>
    <button class="btn" type="button" data-act="start" data-v="${w.id}" ${state.active ? 'disabled' : ''}>${ic('play')} Começar</button></div>`);
};

A.start = (id) => {
  const w = state.plan.workouts.find((x) => x.id === id);
  if (!w || state.active) return;
  closeSheet();
  state.active = {
    id: uid(), workoutId: w.id, workoutLetter: w.letter, workoutName: w.name, start: Date.now(),
    exercises: w.exercises.map((e) => ({ name: e.name, tipo: e.tipo, reps: e.reps, rest: e.rest, notes: e.notes,
      sets: Array.from({ length: e.sets }, () => ({ kg: '', reps: '', done: false })) })),
  };
  save(); keepAwake(true); go('treino');
};

A['copy-prev'] = (v) => {
  const [ei, si] = v.split('.').map(Number);
  const e = state.active.exercises[ei], pv = lastPerformance(e.name)?.sets[si];
  if (!pv) return;
  Object.assign(e.sets[si], { kg: pv.kg ?? '', reps: pv.reps ?? '' });
  save(); render();
};

A['toggle-set'] = (v) => {
  const [ei, si] = v.split('.').map(Number);
  const e = state.active.exercises[ei], st = e.sets[si];
  st.done = !st.done;
  if (st.done) {
    const pv = lastPerformance(e.name)?.sets[si];
    if (st.kg === '' && pv?.kg) st.kg = pv.kg;
    if (st.reps === '' && e.tipo === 'carga') st.reps = pv?.reps || String(e.reps).split('-')[0].replace(/\D/g, '');
    justKey = `${ei}.${si}`; buzz(15);
    let next = null;
    state.active.exercises.some((x, xi) => x.sets.some((y, yi) => { if (!y.done) { next = `Próximo: ${x.name} · série ${yi + 1}`; return true; } return false; }));
    if (next) startTimer(e.rest, next);
  }
  save(); render();
};

A['add-set'] = (v) => {
  const e = state.active.exercises[+v], l = e.sets[e.sets.length - 1];
  e.sets.push({ kg: l?.kg || '', reps: '', done: false });
  save(); render();
};

A.finish = () => {
  const s = state.active;
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  if (!done && !confirm('Nenhuma série marcada. Concluir mesmo assim?')) return;
  s.end = Date.now();
  s.exercises = s.exercises.filter((e) => e.sets.some((x) => x.done)).map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }));
  state.sessions.push(s); state.active = null;
  stopTimer(); keepAwake(false); save(); render();
  const vol = s.exercises.reduce((n, e) => n + e.sets.reduce((a, x) => a + (num(x.kg) || 0) * (num(x.reps) || 0), 0), 0);
  sheet(`<h2>Treino concluído</h2><p class="lead">${esc(s.workoutName)}</p>
    <div class="two"><div class="group pad" style="background:var(--surface-2)"><div class="hint">Duração</div><div class="big num" style="font-size:28px;font-weight:700">${Math.round((s.end - s.start) / 60000)} min</div></div>
    <div class="group pad" style="background:var(--surface-2)"><div class="hint">Séries</div><div class="num" style="font-size:28px;font-weight:700">${done}</div></div></div>
    ${vol ? `<p class="hint" style="margin-top:12px">Volume total: <b class="num">${Math.round(vol).toLocaleString('pt-BR')} kg</b></p>` : ''}
    <p class="hint" style="margin-top:6px">Próximo: <b>${esc(nextWorkout()?.name || '')}</b></p>
    <div class="stack-btns"><button class="btn block" value="ok">Fechar</button></div>`);
};

A['cancel-workout'] = () => {
  if (!confirm('Descartar este treino? O que foi preenchido será perdido.')) return;
  state.active = null; stopTimer(); keepAwake(false); save(); render();
};

A.session = (id) => {
  const s = state.sessions.find((x) => x.id === id);
  if (!s) return;
  sheet(`<h2>${esc(s.workoutName)}</h2><p class="lead">${cap(fmtDayLong(todayKey(new Date(s.start))))} · ${Math.round((s.end - s.start) / 60000)} min</p>
    <div class="group" style="background:var(--surface-2)">${s.exercises.map((e) => `<div class="row plain" style="min-height:52px"><span class="body"><div class="t" style="font-weight:500">${esc(e.name)}</div>
      <div class="s num">${e.sets.map((x) => e.tipo === 'carga' ? `${x.kg || 0} kg × ${x.reps || 0}` : `${x.kg || '—'}`).join(' · ')}</div></span></div>`).join('')}</div>
    <div class="sheet-actions"><button class="btn danger" type="button" data-act="del-session" data-v="${s.id}">Apagar</button><button class="btn soft" value="cancel">Fechar</button></div>`);
};
A['del-session'] = (id) => {
  if (!confirm('Apagar este treino do histórico?')) return;
  state.sessions = state.sessions.filter((s) => s.id !== id);
  closeSheet(); save(); render();
};

A['timer-add'] = (v) => {
  timer.end += Number(v) * 1000;
  timer.total = Math.max(timer.total, (timer.end - Date.now()) / 1000);
  if (timer.end > Date.now()) { timer.beeped = false; $('#timer').classList.remove('over'); }
  tick();
};
A['timer-skip'] = () => stopTimer();

A.plan = () => {
  const p = state.profile;
  sheet(`<h2>Ajustar plano</h2><p class="lead">Objetivo: emagrecimento. Outros objetivos chegam com a IA.</p>
    <div class="field"><label>Dias por semana</label>${seg('dias', [2, 3, 4, 5, 6].map((d) => [d, d]), p.dias)}</div>
    <div class="field"><label>Nível</label>${seg('nivel', Object.entries(LEVEL_LABEL), p.nivel)}</div>
    <label class="check-line"><input type="checkbox" name="regen" ${state.plan.source === 'personalizado' ? '' : 'checked'}> Gerar um plano novo com essas opções</label>
    ${state.plan.source === 'personalizado' ? '<p class="hint">Atenção: gerar um plano novo substitui as suas edições.</p>' : ''}
    ${sheetActions()}`, (f) => {
    p.dias = Number(f.dias.value); p.nivel = f.nivel.value;
    if (f.regen.checked) state.plan = generatePlan(p);
    save(); render();
  });
};

function exEditor(e) {
  return `<div class="ed-ex" data-ex="${e.id}">
    <div class="top"><input name="name" value="${esc(e.name)}" placeholder="Nome do exercício">
    <button type="button" class="btn sm soft" style="background:var(--surface)" data-act="ed-del-ex" data-v="${e.id}" aria-label="Remover">✕</button></div>
    <div class="three">
      <div><small>Séries</small><input name="sets" inputmode="numeric" value="${e.sets}"></div>
      <div><small>Reps / tempo</small><input name="reps" value="${esc(e.reps)}"></div>
      <div><small>Descanso (s)</small><input name="rest" inputmode="numeric" value="${e.rest}"></div>
    </div>
    <div class="three" style="grid-template-columns:1fr 2fr">
      <div><small>Tipo</small><select name="tipo">${[['carga', 'Carga'], ['tempo', 'Tempo'], ['cardio', 'Cardio']].map(([v, l]) => `<option value="${v}" ${v === e.tipo ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div><small>Observação</small><input name="notes" value="${esc(e.notes)}" placeholder="ex.: banco no 4"></div>
    </div></div>`;
}
function openEditor(w, isNew) {
  sheet(`<h2>${isNew ? 'Novo treino' : 'Editar treino'}</h2>
    <div class="field"><label>Nome</label><input name="wname" value="${esc(w.name)}" required></div>
    <div id="ed-list">${w.exercises.map(exEditor).join('')}</div>
    <button type="button" class="btn soft block" data-act="ed-add-ex">${ic('plus')} Exercício</button>
    ${isNew ? '' : `<button type="button" class="btn danger block" style="margin-top:10px" data-act="ed-del-workout" data-v="${w.id}">Excluir treino</button>`}
    ${sheetActions()}`, (f) => {
    w.name = f.wname.value.trim() || w.name;
    w.exercises = $$('[data-ex]', f).map((el) => ({
      id: el.dataset.ex,
      name: $('[name=name]', el).value.trim(),
      sets: Math.max(1, parseInt($('[name=sets]', el).value, 10) || 1),
      reps: $('[name=reps]', el).value.trim() || '10',
      rest: Math.max(0, parseInt($('[name=rest]', el).value, 10) || 0),
      tipo: $('[name=tipo]', el).value,
      notes: $('[name=notes]', el).value.trim(),
    })).filter((e) => e.name);
    if (isNew) state.plan.workouts.push(w);
    state.plan.source = 'personalizado';
    save(); render();
  });
}
A['edit-workout'] = (id) => { const w = state.plan.workouts.find((x) => x.id === id); if (w) openEditor(w, false); };
A['add-workout'] = () => openEditor({ id: uid(), letter: String.fromCharCode(65 + state.plan.workouts.length), name: '', exercises: [] }, true);
A['ed-add-ex'] = () => {
  $('#ed-list').insertAdjacentHTML('beforeend', exEditor({ id: uid(), name: '', sets: 3, reps: '12', rest: 60, tipo: 'carga', notes: '' }));
  $('#ed-list').lastElementChild.querySelector('input').focus();
};
A['ed-del-ex'] = (id) => $(`[data-ex="${id}"]`)?.remove();
A['ed-del-workout'] = (id) => {
  if (!confirm('Excluir este treino do plano?')) return;
  state.plan.workouts = state.plan.workouts.filter((w) => w.id !== id);
  state.plan.workouts.forEach((w, k) => { w.letter = String.fromCharCode(65 + k); });
  state.plan.source = 'personalizado';
  closeSheet(); save(); render();
};
A['progress-ex'] = (v) => { state.ui.progressEx = v; save(); render(); };

/* Dieta */
A['save-diet'] = () => {
  const raw = $('#diet-raw').value.trim();
  if (!raw) return alert('Cole o texto do plano primeiro.');
  const groups = parsePlan(raw);
  state.diet = { raw, groups }; save(); render();
  sheet(`<h2>Plano salvo</h2><p class="lead">Encontrei ${groups.length} refeições:</p>
    <div class="group" style="background:var(--surface-2)">${groups.map((g) => `<div class="row plain" style="min-height:48px"><span class="body"><div class="t" style="font-weight:500">${g.time ? `<span class="num" style="color:var(--ink-3);margin-right:8px">${esc(g.time)}</span>` : ''}${esc(g.name)}</div></span><span class="end">${g.options.length > 1 ? `${g.options.length} opções` : `${g.options[0].foods.length} itens`}</span></div>`).join('')}</div>
    <p class="hint" style="margin-top:12px">Se algo ficou errado, toque no lápis e ajuste o texto.</p>
    <div class="stack-btns"><button class="btn block" value="ok">Ok</button></div>`);
};
A['edit-diet'] = () => {
  sheet(`<h2>Editar plano</h2><p class="lead">Cada refeição numa linha com o horário. Alimento e quantidade separados por “-”.</p>
    <textarea name="raw" style="min-height:50vh">${esc(state.diet.raw)}</textarea>${sheetActions()}`, (f) => {
    const raw = f.raw.value.trim(), old = state.diet.groups, groups = parsePlan(raw);
    groups.forEach((g) => { const o = old.find((x) => x.name === g.name && x.time === g.time); if (o) g.id = o.id; });
    state.diet = { raw, groups }; save(); render();
  });
};
/* "Café da manhã" ou "Café da manhã - Opção 2" quando a refeição tem mais de uma opção */
const mealLabel = (g, oi) => (g.options.length > 1 ? `${g.name} - Opção ${oi + 1}` : g.name);
/* "07:30 - Café da manhã - Opção 2", como na lista do app da nutricionista */
const mealTitle = (g, oi) => (g.time ? `${g.time} - ` : '') + mealLabel(g, oi);
const subLine = (x) => `<div class="sub"><div class="t">${esc(x.name)}</div>${x.qty ? `<div class="s">${esc(x.qty)}</div>` : ''}</div>`;
/* um alimento: quantidade, kcal estimada e as substituições (da nutri + equivalentes) */
/* "1,5 filé(s) médio(s) ou 150g" — medida caseira na frente, gramas atrás.
   Se o texto da nutri já traz as duas (…"ou"…), respeita o que ela escreveu. */
function foodQty(f) {
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
function foodRow(f, fi, gid, oi) {
  const own = f.subs || [], auto = autoSubs(f), total = own.length + (auto ? auto.list.length : 0);
  const qty = foodQty(f);
  return `<div class="food">
    <div class="t">${esc(f.name)}</div>${qty ? `<div class="s">${esc(qty)}</div>` : ''}
    ${total ? `<button type="button" class="subs-btn" data-act="subs" data-v="${gid}:${oi}:${fi}">${ic('swap')} Ver opções de substituição</button>` : ''}
  </div>`;
}
/* tela própria das substituições, com voltar — como no app da nutricionista */
function subsSheet(gid, oi, fi) {
  const g = state.diet.groups.find((x) => x.id === gid);
  const f = g?.options[oi]?.foods[fi];
  if (!f) return;
  const own = f.subs || [], auto = autoSubs(f);
  sheet(`<div class="sheet-nav">
      <button type="button" class="icon-btn" data-act="meal-open" data-v="${gid}:${oi}" aria-label="Voltar para a refeição">${ic('left')}</button>
      <div><div class="kicker">${esc(mealLabel(g, oi))}</div><h2 style="margin:0">${esc(f.name)}</h2></div>
    </div>
    <p class="lead">${esc(foodQty(f))}${auto ? ` · ≈ ${auto.kcal} kcal` : ''}</p>
    <div class="subs-screen">
      ${own.length ? `<div class="sub-head">Indicadas pela nutricionista</div>${own.map(subLine).join('')}` : ''}
      ${auto ? `<div class="sub-head">Equivalentes · ${esc(auto.label)} · mesma caloria</div>${auto.list.map(subLine).join('')}` : ''}
    </div>`, null, 2);
}
function mealSheet(gid, oi) {
  const g = state.diet.groups.find((x) => x.id === gid);
  if (!g) return;
  const log = dayLog(state.ui.dietDay || todayKey()), c = mealCheck(log, g);
  oi = oi ?? (c ? c.opt : 0);
  const o = g.options[oi] || g.options[0];
  const registered = c && c.opt === oi;
  const diary = (log.diary || {})[g.id], mood = (log.mood || {})[g.id];
  sheet(`<h2>${g.time ? `<span class="num" style="color:var(--ink-3)">${esc(g.time)}</span> · ` : ''}${esc(mealLabel(g, oi))}</h2>
    <p class="lead">${o.foods.length} ${o.foods.length === 1 ? 'alimento' : 'alimentos'}${g.options.length > 1 ? ` · uma das ${g.options.length} opções desta refeição` : ''}</p>
    <div class="meal-menu">
      <button type="button" class="mm ${registered ? 'on' : ''}" data-act="meal-reg" data-v="${g.id}:${oi}">
        ${ic(registered ? 'check' : 'meal')}<span>${registered ? 'Registrada' : 'Registrar refeição'}</span></button>
      <button type="button" class="mm ${diary ? 'on' : ''}" data-act="meal-diary" data-v="${g.id}">
        ${ic('camera')}<span>Diário alimentar</span></button>
      <button type="button" class="mm ${mood ? 'on' : ''}" data-act="meal-mood" data-v="${g.id}">
        ${mood ? `<span class="mm-face">${MOODS.find((m) => m.k === mood)?.face || ''}</span>` : ic('pulse')}<span>Humor na refeição</span></button>
    </div>
    <div class="sub-head">Alimentos</div>
    ${o.foods.map((f, fi) => foodRow(f, fi, g.id, oi)).join('') || '<p class="hint">Nenhum alimento nesta opção.</p>'}
    ${diary ? `<div class="sub-head">Diário alimentar</div>
      <div class="food"><img class="diary-img" src="${diary.photo}" alt="Foto da refeição">
        <button type="button" class="text-btn" data-act="meal-diary-del" data-v="${g.id}">Remover foto</button></div>` : ''}
    ${o.notes ? `<div class="notes-open"><div class="sub-head">Observação</div><div>${esc(o.notes).replace(/\n/g, '<br>')}</div></div>` : ''}
    <div class="stack-btns">
      <button class="text-btn" type="button" data-act="add-extra">Comi outra coisa</button>
    </div>`, null, 1);
}
A['meal-open'] = (v) => { const [gid, i] = String(v).split(':'); mealSheet(gid, i == null ? undefined : +i); };
A['meal-opt'] = (v) => { const [gid, i] = v.split(':'); mealSheet(gid, +i); };
A.subs = (v) => { const [gid, oi, fi] = String(v).split(':'); subsSheet(gid, +oi, +fi); };
/* Diário alimentar: a foto do que você realmente comeu, guardada no dia */
A['meal-diary'] = async (gid) => {
  const file = await pickImage();
  if (!file) return;
  const blob = await shrink(file, 640);
  const photo = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
  const log = dayLog(state.ui.dietDay || todayKey());
  log.diary = log.diary || {};
  log.diary[gid] = { photo, at: Date.now() };
  if (!save()) { delete log.diary[gid]; return; }
  buzz(); mealSheetFor(gid);
};
A['meal-diary-del'] = (gid) => {
  const log = dayLog(state.ui.dietDay || todayKey());
  if (log.diary) delete log.diary[gid];
  save(); mealSheetFor(gid);
};
/* Humor na refeição */
const MOODS = [
  { k: 'otimo', face: '😄', label: 'Ótimo' },
  { k: 'bem', face: '🙂', label: 'Bem' },
  { k: 'neutro', face: '😐', label: 'Normal' },
  { k: 'ruim', face: '😕', label: 'Ruim' },
  { k: 'mal', face: '😣', label: 'Mal' },
];
A['meal-mood'] = (gid) => {
  const log = dayLog(state.ui.dietDay || todayKey()), cur = (log.mood || {})[gid];
  sheet(`<h2>Humor na refeição</h2><p class="lead">Como você se sentiu nesta refeição?</p>
    <div class="mood-pick">${MOODS.map((m) => `<button type="button" class="mood ${cur === m.k ? 'on' : ''}" data-act="mood-set" data-v="${gid}:${m.k}">
      <span class="face">${m.face}</span><span class="s">${m.label}</span></button>`).join('')}</div>
    ${cur ? `<button type="button" class="text-btn block" data-act="mood-set" data-v="${gid}:">Limpar</button>` : ''}`);
};
A['mood-set'] = (v) => {
  const i = String(v).indexOf(':'), gid = String(v).slice(0, i), k = String(v).slice(i + 1);
  const log = dayLog(state.ui.dietDay || todayKey());
  log.mood = log.mood || {};
  if (k) { log.mood[gid] = k; buzz(); } else delete log.mood[gid];
  save(); mealSheetFor(gid);
};
/* reabre a refeição na opção certa depois de uma ação */
function mealSheetFor(gid) {
  const g = state.diet.groups.find((x) => x.id === gid);
  if (!g) return;
  const c = mealCheck(dayLog(state.ui.dietDay || todayKey()), g);
  mealSheet(gid, c ? c.opt : 0);
  render();
}
A['meal-reg'] = (v) => {
  const [gid, i] = v.split(':');
  const log = dayLog(state.ui.dietDay || todayKey()), c = log.checked[gid];
  if (c != null && (typeof c !== 'object' || c.opt === +i)) delete log.checked[gid];
  else { log.checked[gid] = { opt: +i, at: Date.now() }; justKey = `${gid}:${i}`; buzz(); }
  closeSheet(); save(); render();
};
A['meal-quick'] = (v) => {
  const [gid, i] = String(v).split(':'), oi = i == null ? 0 : +i;
  const log = dayLog(state.ui.dietDay || todayKey()), c = log.checked[gid];
  const cur = c == null ? null : (typeof c === 'object' ? c.opt : 0);
  /* marcada na mesma opção → desmarca; em outra opção → troca a escolha */
  if (cur === oi) delete log.checked[gid];
  else { log.checked[gid] = { opt: oi, at: Date.now() }; justKey = `${gid}:${oi}`; buzz(); }
  save(); render();

};
/* ================= Montar a alimentação na mão (Perfil › Alimentação) =================
   Mesma estrutura do plano colado: refeição › opções › alimentos › substituições.
   Mexe direto em state.diet.groups, então convive com o plano importado por texto. */
const MEAL_PRESETS = [
  { name: 'Café da manhã', time: '07:30' },
  { name: 'Lanche da manhã', time: '10:00' },
  { name: 'Almoço', time: '12:00' },
  { name: 'Lanche', time: '18:00' },
  { name: 'Jantar', time: '20:30' },
  { name: 'Ceia', time: '22:00' },
];
const findGroup = (gid) => state.diet.groups.find((x) => x.id === gid);
const newOption = () => ({ id: uid(), foods: [], notes: '' });
const sortGroups = () => state.diet.groups.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

/* lista de refeições do plano, com adicionar e editar */
function dietEditor() {
  const gs = state.diet.groups;
  sheet(`<h2>Alimentação</h2>
    <p class="lead">Monte as refeições do seu dia. Cada uma pode ter várias opções.</p>
    ${gs.length ? `<div class="group">${gs.map((g) => `<button type="button" class="row plain" data-act="grp-edit" data-v="${g.id}">
        <span class="body"><div class="t">${g.time ? `<span class="num" style="color:var(--ink-3);margin-right:8px">${esc(g.time)}</span>` : ''}${esc(g.name)}</div>
        <div class="s">${g.options.length} ${g.options.length === 1 ? 'opção' : 'opções'} · ${g.options.reduce((t, o) => t + o.foods.length, 0)} alimentos</div></span>
        <span class="end">${ic('right')}</span></button>`).join('')}</div>`
      : '<p class="hint">Nenhuma refeição ainda. Comece pelas sugestões abaixo.</p>'}
    <div class="sub-head">Adicionar refeição</div>
    <div class="chips">${MEAL_PRESETS.filter((m) => !gs.some((g) => eqNorm(g.name) === eqNorm(m.name)))
      .map((m) => `<button type="button" class="chip" data-act="grp-add" data-v="${esc(m.name)}|${m.time}">+ ${esc(m.name)}</button>`).join('')
      || '<span class="hint">Todas as refeições sugeridas já estão no plano.</span>'}</div>
    <button type="button" class="btn soft block" style="margin-top:12px" data-act="grp-add" data-v="|">+ Outra refeição</button>
    <button type="button" class="text-btn" style="margin-top:14px" data-act="edit-diet">${ic('pencil')} Colar ou editar o plano em texto</button>`, null, 1);
}
A['diet-editor'] = () => dietEditor();
A['grp-add'] = (v) => {
  const i = String(v).lastIndexOf('|');
  const name = String(v).slice(0, i), time = String(v).slice(i + 1);
  const g = { id: uid(), name: name || 'Nova refeição', time, options: [newOption()] };
  state.diet.groups.push(g); sortGroups(); save(); render();
  grpEditor(g.id);
};

/* uma refeição: nome, horário e as opções */
function grpEditor(gid) {
  const g = findGroup(gid);
  if (!g) return dietEditor();
  sheet(`<div class="sheet-nav">
      <button type="button" class="icon-btn" data-act="diet-editor" aria-label="Voltar">${ic('left')}</button>
      <div><div class="kicker">Refeição</div><h2 style="margin:0">${esc(g.name)}</h2></div>
    </div>
    <div class="two" style="margin-top:14px">
      <div class="field"><label>Nome</label><input name="nome" value="${esc(g.name)}" placeholder="ex.: Almoço"></div>
      <div class="field"><label>Horário</label><input name="hora" type="time" value="${esc(g.time || '')}"></div>
    </div>
    <button type="button" class="btn soft block" data-act="grp-save" data-v="${g.id}">Salvar nome e horário</button>
    <div class="sub-head">Opções desta refeição</div>
    <div class="group">${g.options.map((o, oi) => `<button type="button" class="row plain" data-act="opt-edit" data-v="${g.id}:${oi}">
      <span class="body"><div class="t">Opção ${oi + 1}</div>
      <div class="s">${o.foods.length ? esc(o.foods.map((f) => f.name).join(', ').slice(0, 60)) : 'Sem alimentos'}</div></span>
      <span class="end">${ic('right')}</span></button>`).join('')}</div>
    <button type="button" class="btn soft block" style="margin-top:12px" data-act="opt-add" data-v="${g.id}">+ Adicionar opção</button>
    <button type="button" class="btn danger block" style="margin-top:12px" data-act="grp-del" data-v="${g.id}">Excluir refeição</button>`, null, 2);
}
A['grp-edit'] = (gid) => grpEditor(gid);
A['grp-save'] = (gid) => {
  const g = findGroup(gid), f = $('#sheet-body');
  if (!g) return;
  g.name = f.nome.value.trim() || g.name;
  g.time = f.hora.value;
  sortGroups(); save(); render(); grpEditor(gid);
};
A['grp-del'] = (gid) => {
  const g = findGroup(gid);
  if (!g || !confirm(`Excluir "${g.name}" e todas as suas opções?`)) return;
  state.diet.groups = state.diet.groups.filter((x) => x.id !== gid);
  save(); render(); dietEditor();
};
A['opt-add'] = (gid) => {
  const g = findGroup(gid);
  if (!g) return;
  g.options.push(newOption()); save(); render();
  optEditor(gid, g.options.length - 1);
};

/* uma opção: os alimentos e a observação da nutricionista */
function optEditor(gid, oi) {
  const g = findGroup(gid), o = g?.options[oi];
  if (!o) return grpEditor(gid);
  sheet(`<div class="sheet-nav">
      <button type="button" class="icon-btn" data-act="grp-edit" data-v="${gid}" aria-label="Voltar">${ic('left')}</button>
      <div><div class="kicker">${esc(g.name)}</div><h2 style="margin:0">Opção ${oi + 1}</h2></div>
    </div>
    <div class="sub-head">Alimentos</div>
    ${o.foods.length ? `<div class="group">${o.foods.map((f, fi) => `<button type="button" class="row plain" data-act="fd-edit" data-v="${gid}:${oi}:${fi}">
        <span class="body"><div class="t">${esc(f.name)}</div><div class="s">${esc(f.qty || 'sem quantidade')}${f.subs?.length ? ` · ${f.subs.length} substituição${f.subs.length > 1 ? 'ões' : ''}` : ''}</div></span>
        <span class="end">${ic('right')}</span></button>`).join('')}</div>`
      : '<p class="hint">Nenhum alimento nesta opção.</p>'}
    <button type="button" class="btn soft block" style="margin-top:12px" data-act="fd-add" data-v="${gid}:${oi}">+ Adicionar alimento</button>
    <div class="field" style="margin-top:18px"><label>Observação da nutricionista</label>
      <textarea name="notes" style="min-height:110px" placeholder="ex.: duas variedades de legumes, consumo livre, mínimo 100 g">${esc(o.notes || '')}</textarea></div>
    <button type="button" class="btn soft block" data-act="opt-save" data-v="${gid}:${oi}">Salvar observação</button>
    ${g.options.length > 1 ? `<button type="button" class="btn danger block" style="margin-top:12px" data-act="opt-del" data-v="${gid}:${oi}">Excluir esta opção</button>` : ''}`, null, 3);
}
A['opt-edit'] = (v) => { const [gid, oi] = String(v).split(':'); optEditor(gid, +oi); };
A['opt-save'] = (v) => {
  const [gid, oi] = String(v).split(':'), g = findGroup(gid), o = g?.options[+oi];
  if (!o) return;
  o.notes = $('#sheet-body').notes.value.trim();
  save(); render(); optEditor(gid, +oi);
};
A['opt-del'] = (v) => {
  const [gid, oi] = String(v).split(':'), g = findGroup(gid);
  if (!g || g.options.length < 2 || !confirm(`Excluir a Opção ${+oi + 1}?`)) return;
  g.options.splice(+oi, 1);
  /* o registro do dia apontava para um índice que mudou: limpa para não marcar a opção errada */
  Object.values(state.dietLog).forEach((l) => { if (l.checked?.[gid] != null) delete l.checked[gid]; });
  save(); render(); grpEditor(gid);
};
A['fd-add'] = (v) => { const [gid, oi] = String(v).split(':'); foodEditor(gid, +oi, -1); };

/* um alimento: nome, quantidade e as substituições que a nutricionista indicou */
function foodEditor(gid, oi, fi) {
  const g = findGroup(gid), o = g?.options[oi];
  if (!o) return grpEditor(gid);
  const novo = fi < 0;
  const f = novo ? { name: '', qty: '', subs: [] } : o.foods[fi];
  if (!f) return optEditor(gid, oi);
  sheet(`<div class="sheet-nav">
      <button type="button" class="icon-btn" data-act="opt-edit" data-v="${gid}:${oi}" aria-label="Voltar">${ic('left')}</button>
      <div><div class="kicker">${esc(g.name)} · Opção ${oi + 1}</div><h2 style="margin:0">${novo ? 'Novo alimento' : esc(f.name)}</h2></div>
    </div>
    <div class="field" style="margin-top:14px"><label>Alimento</label>
      <input name="nome" value="${esc(f.name)}" placeholder="ex.: Peito de frango grelhado" required></div>
    <div class="field"><label>Quantidade</label>
      <input name="qtd" value="${esc(f.qty)}" placeholder="ex.: 150 g  ou  2 colheres de sopa ou 30 g"></div>
    <p class="hint">Se o alimento estiver na nossa tabela, as substituições equivalentes aparecem sozinhas. Abaixo você acrescenta as que a nutricionista indicou.</p>
    <div class="field" style="margin-top:14px"><label>Substituições da nutricionista (uma por linha)</label>
      <textarea name="subs" style="min-height:90px" placeholder="Salada de frutas - 1 porção&#10;Mamão - 170 g">${esc((f.subs || []).map((s) => (s.qty ? `${s.name} - ${s.qty}` : s.name)).join('\n'))}</textarea></div>
    <button type="button" class="btn block" data-act="fd-save" data-v="${gid}:${oi}:${fi}">Salvar alimento</button>
    ${novo ? '' : `<button type="button" class="btn danger block" style="margin-top:12px" data-act="fd-del" data-v="${gid}:${oi}:${fi}">Excluir alimento</button>`}`, null, 4);
}
A['fd-edit'] = (v) => { const [gid, oi, fi] = String(v).split(':'); foodEditor(gid, +oi, +fi); };
A['fd-save'] = (v) => {
  const [gid, oi, fi] = String(v).split(':'), g = findGroup(gid), o = g?.options[+oi];
  if (!o) return;
  const form = $('#sheet-body'), name = form.nome.value.trim();
  if (!name) { alert('Dê um nome ao alimento.'); return; }
  const subs = form.subs.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((l) => { const p = splitFood(l); return { name: p.name, qty: p.qty }; });
  const food = { name, qty: form.qtd.value.trim(), subs };
  if (+fi < 0) o.foods.push(food); else o.foods[+fi] = food;
  save(); render(); optEditor(gid, +oi);
};
A['fd-del'] = (v) => {
  const [gid, oi, fi] = String(v).split(':'), g = findGroup(gid), o = g?.options[+oi];
  if (!o || !confirm('Excluir este alimento?')) return;
  o.foods.splice(+fi, 1);
  save(); render(); optEditor(gid, +oi);
};

A['diet-day'] = (v) => {
  const d = keyToDate(state.ui.dietDay || todayKey()); d.setDate(d.getDate() + Number(v));
  const k = todayKey(d); state.ui.dietDay = k > todayKey() ? todayKey() : k; render();
};
const extrasKcal = (log) => log.extras.reduce((t, x) => t + (x.kcal || 0), 0);
let pendingFood = null;
A['add-extra'] = () => {
  pendingFood = null;
  const hasKey = !!state.ai?.key;
  sheet(`<h2>Fora do plano</h2><p class="lead">Tire uma foto do alimento (ou da embalagem) e/ou descreva. A IA estima as calorias.</p>
    <div class="food-pick">
      <button type="button" class="photo-slot" data-act="food-photo" aria-label="Tirar ou escolher foto"><span id="food-prev">${ic('camera')}<small>Foto</small></span></button>
      <div class="field" style="flex:1;margin:0"><textarea name="text" style="min-height:96px" placeholder="ex.: 1 barra de chocolate ao leite, uns 3 quadradinhos"></textarea></div>
    </div>
    ${hasKey ? `<button type="button" class="btn soft block" style="margin-top:12px" data-act="food-ai">Calcular calorias com IA</button>`
      : `<p class="hint" style="margin-top:12px">Para calcular com IA, configure a chave em <b>Perfil › Assistente IA</b>. Sem ela, você pode informar as calorias abaixo.</p>`}
    <div id="food-result"></div>
    <div class="two" style="margin-top:12px">
      <div class="field"><label>Calorias (kcal)</label><input name="kcal" inputmode="numeric" placeholder="opcional"></div>
      <div class="field"><label>Horário</label><input name="hora" type="time" value="${new Date().toTimeString().slice(0, 5)}"></div>
    </div>
    ${sheetActions('Adicionar')}`, (f) => {
    const r = pendingFood?.result;
    const text = f.text.value.trim() || (r ? `${r.alimento} (${r.porcao})` : '');
    if (!text) { alert('Descreva o que comeu ou use a foto com a IA.'); return false; }
    const kcal = num(f.kcal.value);
    dayLog(state.ui.dietDay || todayKey()).extras.push({
      text, time: f.hora.value, kcal,
      ...(r ? { ai: true, proteina: r.proteina_g, carbo: r.carboidrato_g, gordura: r.gordura_g } : {}),
    });
    pendingFood = null; save(); render();
  });
};
A['food-photo'] = async () => {
  const f = await pickImage();
  if (!f) return;
  const blob = await shrink(f);
  pendingFood = { blob };
  const url = URL.createObjectURL(blob);
  $('#food-prev').innerHTML = `<img src="${url}" alt="Foto do alimento">`;
};
A['food-ai'] = async (v, btn) => {
  const f = $('#sheet-body'), text = f.text.value.trim(), blob = pendingFood?.blob;
  if (!blob && !text) { alert('Tire uma foto ou descreva o alimento primeiro.'); return; }
  btn.disabled = true; btn.textContent = 'Calculando…';
  try {
    const r = await estimateFood({ blob, text });
    pendingFood = { ...(pendingFood || {}), result: r };
    f.kcal.value = Math.round(r.kcal);
    if (!text) f.text.value = `${r.alimento} (${r.porcao})`;
    $('#food-result').innerHTML = `<div class="food ai-card">
      <div class="row-between"><div><div class="t">${esc(r.alimento)}</div><div class="s">${esc(r.porcao)}</div></div>
      <div class="kcal num">${Math.round(r.kcal)}<small> kcal</small></div></div>
      <div class="macros num"><span>Proteína <b>${br(r.proteina_g)} g</b></span><span>Carbo <b>${br(r.carboidrato_g)} g</b></span><span>Gordura <b>${br(r.gordura_g)} g</b></span></div>
      <div class="s" style="margin-top:8px">${esc(r.observacao)} · confiança ${esc(r.confianca === 'media' ? 'média' : r.confianca)}</div></div>`;
    btn.textContent = 'Calcular de novo';
  } catch (e) {
    $('#food-result').innerHTML = `<p class="hint" style="margin-top:10px;color:var(--danger)">${esc(aiErrorText(e))}</p>`;
    btn.textContent = 'Tentar de novo';
  } finally { btn.disabled = false; }
};
function aiErrorText(e) {
  const st = e?.status;
  if (st === 401) return 'Chave da IA inválida. Confira em Perfil › Assistente IA.';
  if (st === 402 || st === 403) return 'A conta da API não tem créditos ou permissão. Confira no console da Anthropic.';
  if (st === 429) return 'Muitas consultas seguidas. Espere um pouco e tente de novo.';
  if (!navigator.onLine) return 'Sem internet. A IA precisa de conexão.';
  return e?.message || 'Não consegui calcular agora. Tente de novo.';
}
A['ai-key'] = () => {
  sheet(`<h2>Assistente IA</h2>
    <p class="lead">A IA calcula as calorias dos alimentos fora do plano, por foto ou descrição.</p>
    <div class="food"><div class="s">1. Crie uma chave em <b>console.anthropic.com</b> (menu API Keys) e adicione créditos.<br>
      2. Cole a chave abaixo. Cada cálculo custa poucos centavos.<br>
      3. A chave fica salva só neste celular e não vai no backup.</div></div>
    <div class="field" style="margin-top:12px"><label>Chave da API</label><input name="key" type="password" autocomplete="off" value="${esc(state.ai?.key || '')}" placeholder="sk-ant-..."></div>
    ${state.ai?.key ? '<button type="button" class="btn danger block" data-act="ai-key-del">Remover chave</button>' : ''}
    ${sheetActions()}`, (f) => {
    const key = f.key.value.trim();
    state.ai = key ? { key } : undefined;
    save(); render();
  });
};
A['ai-key-del'] = () => { delete state.ai; save(); closeSheet(); render(); };
A['del-extra'] = (i) => { dayLog(state.ui.dietDay || todayKey()).extras.splice(+i, 1); save(); render(); };

/* Peso: atualizar quando quiser, sem cobrança diária */
A.peso = () => {
  const key = todayKey(), m = state.morning.find((x) => x.date === key) || {};
  const w = latestWeight(), p = state.profile;
  sheet(`<h2>Atualizar peso</h2>
    <p class="lead">${w != null ? `Hoje está em ${br(w)} kg. Atualize quando se pesar — não precisa ser todo dia.` : 'Informe seu peso de hoje. Atualize quando se pesar.'}</p>
    <div class="field"><input class="big-input" name="peso" inputmode="decimal" value="${m.peso != null ? br(m.peso) : ''}" placeholder="0,0 kg" aria-label="Peso em kg" autofocus></div>
    <div class="field"><label>Data</label><input name="data" type="date" value="${key}" max="${key}"></div>
    ${p.meta ? `<p class="hint">Sua meta é ${br(p.meta)} kg.</p>` : ''}
    ${sheetActions('Atualizar')}`, (f) => {
    const peso = num(f.peso.value);
    if (peso == null) { alert('Informe o peso.'); return false; }
    const d = f.data.value || key;
    const old = state.morning.find((x) => x.date === d);
    /* preserva sono e disposição de um registro que já exista nessa data */
    state.morning = state.morning.filter((x) => x.date !== d)
      .concat({ date: d, peso, sono: old?.sono ?? null, disposicao: old?.disposicao ?? null });
    buzz(); save(); render();
  });
};
/* Relatório de peso: a linha ao longo do tempo e o histórico */
A['peso-report'] = () => {
  const ms = morningSorted().filter((x) => x.peso != null);
  const p = state.profile;
  if (!ms.length) {
    sheet(`<h2>Relatório de peso</h2><p class="lead">Nenhum peso registrado ainda.</p>
      <button type="button" class="btn block" data-act="peso">Informar meu peso</button>`);
    return;
  }
  const pts = ms.slice(-60).map((x) => ({ y: x.peso, label: fmtDay(x.date) }));
  const cur = ms[ms.length - 1], first = ms[0];
  const dTotal = ms.length > 1 ? cur.peso - first.peso : null;
  const fb = weightFeedback(cur.peso, p.altura);
  sheet(`<h2>Relatório de peso</h2>
    <p class="lead">${ms.length} ${ms.length === 1 ? 'registro' : 'registros'} · de ${fmtDay(first.date)} até ${fmtDay(cur.date)}</p>
    <div class="group pad row-between" style="margin-bottom:12px">
      <div><div class="hint">Peso atual</div><div class="stat num"><span data-count="${cur.peso}" data-count-dec="1" data-count-key="peso">${br(cur.peso)}</span><small> kg</small></div></div>
      ${dTotal != null ? `<span class="tag delta num ${dTotal < 0 ? 'ok' : ''}">${dTotal > 0 ? '+' : ''}${br(dTotal)} kg no total</span>` : ''}
    </div>
    ${p.meta ? `<p class="hint" style="margin-bottom:12px">${Math.abs(cur.peso - p.meta) < 0.05 ? 'Você chegou na meta.' : `Faltam ${br(Math.abs(cur.peso - p.meta))} kg para a meta de ${br(p.meta)} kg.`}</p>` : ''}
    ${ms.length > 1 ? `<div class="group" style="margin-bottom:12px">${chartSlot('peso-rep', pts, 'kg')}</div>`
      : '<p class="hint">Registre pelo menos dois dias para ver a linha.</p>'}
    ${fb ? `<div class="sub-head">Faixa saudável</div>${weightCard(fb)}` : ''}
    <div class="sub-head">Histórico</div>
    <div class="group">${ms.slice().reverse().slice(0, 30).map((x, i, arr) => {
      const ant = arr[i + 1], d = ant ? x.peso - ant.peso : null;
      return `<div class="row plain"><span class="body"><div class="t num">${br(x.peso)} kg</div>
        <div class="s">${cap(fmtDayLong(x.date))}</div></span>
        <span class="end">${d != null ? `<span class="num" style="color:${d < 0 ? 'var(--c-dieta)' : d > 0 ? 'var(--ink-2)' : 'var(--ink-3)'}">${d > 0 ? '+' : ''}${br(d)} kg</span>` : ''}</span></div>`;
    }).join('')}</div>
    <button type="button" class="btn block" style="margin-top:14px" data-act="peso">Atualizar peso</button>`);
  $$('#sheet-body [data-chart]').forEach(drawChart);
};

/* Pesagem */
A.morning = () => {
  const key = todayKey(), m = state.morning.find((x) => x.date === key) || {};
  sheet(`<h2>Pesagem da manhã</h2><p class="lead">Em jejum, depois do banheiro.</p>
    <div class="field"><input class="big-input" name="peso" inputmode="decimal" value="${m.peso != null ? br(m.peso) : ''}" placeholder="0,0 kg" aria-label="Peso em kg" autofocus></div>
    <div class="field"><label>Horas de sono</label><input name="sono" inputmode="decimal" value="${m.sono != null ? br(m.sono) : ''}" placeholder="ex.: 7"></div>
    <div class="field"><label>Disposição</label><div data-toggle>${seg('disp', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], m.disposicao ?? '')}</div>
      <p class="hint" style="margin-top:6px">1 = muito cansado · 5 = cheio de energia</p></div>
    ${sheetActions()}`, (f) => {
    const rec = { date: key, peso: num(f.peso.value), sono: num(f.sono.value), disposicao: num(f.disp.value) };
    if (rec.peso == null) { alert('Informe o peso.'); return false; }
    state.morning = state.morning.filter((x) => x.date !== key).concat(rec);
    save(); render();
  });
};

/* Atividades */
A.activity = () => {
  sheet(`<h2>Atividade extra</h2><p class="lead">Até a integração com o relógio, registre aqui.</p>
    <div class="field"><label>Tipo</label>${seg('tipo', [['Caminhada', 'Caminhada'], ['Corrida', 'Corrida'], ['Bicicleta', 'Bike'], ['Outro', 'Outro']], 'Caminhada')}</div>
    <div class="two"><div class="field"><label>Minutos</label><input name="minutos" inputmode="numeric"></div>
      <div class="field"><label>Calorias</label><input name="kcal" inputmode="numeric" placeholder="kcal"></div></div>
    <div class="two"><div class="field"><label>Passos</label><input name="passos" inputmode="numeric"></div>
      <div class="field"><label>Data</label><input name="date" type="date" value="${todayKey()}" max="${todayKey()}"></div></div>
    ${sheetActions('Adicionar')}`, (f) => {
    state.activities.push({ id: uid(), tipo: f.tipo.value || 'Outro', minutos: num(f.minutos.value), kcal: num(f.kcal.value), passos: num(f.passos.value), date: f.date.value || todayKey(), fonte: 'manual' });
    save(); render();
  });
};
A['del-activity'] = (id) => { state.activities = state.activities.filter((a) => a.id !== id); save(); render(); };

/* Ajustes e backup */
A['edit-profile'] = () => {
  const p = state.profile, w = latestWeight();
  sheet(`<h2>Seus dados</h2><p class="lead">Ficam só no seu celular. Ajudam a acompanhar a evolução e, no futuro, a IA.</p>
    <div class="field"><label>Nome</label><input name="nome" value="${esc(p.nome || '')}" autocomplete="name" placeholder="Como quer ser chamado"></div>
    <div class="two"><div class="field"><label>Idade</label><input name="idade" inputmode="numeric" value="${p.idade || ''}" placeholder="anos"></div>
      <div class="field"><label>Altura (cm)</label><input name="altura" inputmode="numeric" value="${p.altura || ''}" placeholder="ex.: 175"></div></div>
    <div class="field"><label>Sexo</label><div data-toggle>${seg('sexo', [['m', 'Masculino'], ['f', 'Feminino']], p.sexo || '')}</div></div>
    <div class="two"><div class="field"><label>Peso atual (kg)</label><input name="peso" inputmode="decimal" value="${w != null ? br(w) : ''}"></div>
      <div class="field"><label>Meta (kg)</label><input name="meta" inputmode="decimal" value="${p.meta ? br(p.meta) : ''}"></div></div>
    <div class="field"><label>Nutricionista</label><input name="nutri" value="${esc(p.nutri || '')}" placeholder="opcional"></div>
    ${sheetActions()}`, (f) => {
    const alt = num(f.altura.value);
    Object.assign(p, {
      nome: f.nome.value.trim(), idade: num(f.idade.value), sexo: f.sexo.value,
      altura: alt && alt < 3 ? Math.round(alt * 100) : alt, meta: num(f.meta.value), nutri: f.nutri.value.trim(),
    });
    const peso = num(f.peso.value);
    if (peso != null && peso !== w) {
      const key = todayKey(), cur = state.morning.find((x) => x.date === key);
      if (cur) cur.peso = peso; else state.morning.push({ date: key, peso, sono: null, disposicao: null });
    }
    save(); render();
    const fb = weightFeedback(latestWeight(), p.altura);
    if (fb) setTimeout(() => sheet(`<h2>Sobre o seu peso</h2>${weightCard(fb)}<div class="stack-btns"><button class="btn block" value="ok">Entendi</button></div>`), 50);
  });
};
A.export = () => {
  const blob = new Blob([JSON.stringify({ ...state, active: null, ai: undefined })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `treino-dieta-backup-${todayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
A.import = () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (!data?.plan || !Array.isArray(data.sessions)) throw new Error('o arquivo não é um backup deste app');
      if (!confirm('Substituir os dados atuais pelo backup?')) return;
      delete data.fotos;
      const ai = state.ai;
      state = migrate(Object.assign(defaultState(), data));
      if (ai) state.ai = ai; save(); closeSheet(); render();
    } catch (e) { alert('Não consegui importar: ' + e.message); }
  };
  inp.click();
};
A.reset = async () => {
  if (!confirm('Apagar TODOS os dados? Isso não pode ser desfeito.')) return;
  if (!confirm('Tem certeza? Faça um backup antes se quiser guardar.')) return;
  state = defaultState(); stopTimer(); save(); closeSheet(); render();
};

/* ================= Lista de compras ================= */
const fmtGrams = (g) => (g >= 1000 ? `${br(g / 1000, 1)} kg` : `${Math.max(10, Math.round(g / 10) * 10)} g`);
function shoppingItems(days) {
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
A.shopping = () => {
  const sh = state.shopping, days = sh.days || 7;
  const items = shoppingItems(days);
  const row = (key, name, label, extraIdx) => `<div class="meal-row ${sh.checked[key] ? 'done' : ''}">
      <button class="circle" type="button" data-act="shop-check" data-v="${esc(key)}" aria-pressed="${!!sh.checked[key]}">${ic('check')}</button>
      <div class="meal-open" style="cursor:default"><span class="body"><div class="t" style="font-weight:500">${esc(name)}</div></span>
      <span class="end num">${esc(label)}${extraIdx != null ? ` <button type="button" class="text-btn" style="color:var(--ink-3)" data-act="shop-del" data-v="${extraIdx}">Remover</button>` : ''}</span></div></div>`;
  sheet(`<h2>Lista de compras</h2>
    <p class="lead">Somada a partir da opção 1 de cada refeição. Peso de alimento cozido muda em relação ao cru, então ajuste na hora.</p>
    <div class="field"><label>Comprar para</label><div class="seg">${[[1, '1 dia'], [3, '3 dias'], [7, '7 dias']].map(([v, l]) => `<button type="button" data-act="shop-days" data-v="${v}" class="${v === days ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    ${items.length || sh.extra.length ? `<div class="group" style="background:var(--surface-2)">
      ${items.map((it) => row(it.key, it.name, it.label)).join('')}
      ${sh.extra.map((x, i) => row('extra:' + x, x, '', i)).join('')}
    </div>` : '<div class="empty">Adicione o plano alimentar para gerar a lista.</div>'}
    <div class="field" style="margin-top:12px;display:flex;gap:8px"><input name="extra" placeholder="Adicionar item (ex.: azeite)"><button type="button" class="btn sm" style="min-height:48px" data-act="shop-add">Adicionar</button></div>
    <div class="sheet-actions"><button class="btn soft" type="button" data-act="shop-clear">Desmarcar</button><button class="btn" type="button" data-act="shop-share">Compartilhar</button></div>`);
};
A['shop-days'] = (v) => { state.shopping.days = +v; save(); A.shopping(); };
A['shop-check'] = (key) => { const c = state.shopping.checked; if (c[key]) delete c[key]; else c[key] = 1; save(); A.shopping(); };
A['shop-add'] = () => { const v = $('#sheet-body [name=extra]').value.trim(); if (v) { state.shopping.extra.push(v); save(); } A.shopping(); };
A['shop-del'] = (i) => { const x = state.shopping.extra.splice(+i, 1)[0]; delete state.shopping.checked['extra:' + x]; save(); A.shopping(); };
A['shop-clear'] = () => { state.shopping.checked = {}; save(); A.shopping(); };
A['shop-share'] = async () => {
  const sh = state.shopping;
  const lines = shoppingItems(sh.days || 7).filter((it) => !sh.checked[it.key]).map((it) => `- ${it.name} (${it.label})`)
    .concat(sh.extra.filter((x) => !sh.checked['extra:' + x]).map((x) => `- ${x}`));
  const text = `Lista de compras (${sh.days || 7} dias)\n${lines.join('\n')}`;
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); alert('Lista copiada.'); }
  } catch {}
};

/* ================= Receitas ================= */
const RECIPES = [
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
const allRecipes = () => RECIPES.concat(state.recipes);
A.recipes = () => {
  const list = allRecipes();
  sheet(`<h2>Receitas</h2><p class="lead">Simples, com alimentos comuns em planos de emagrecimento. Ajuste as quantidades ao seu plano.</p>
    <div class="group" style="background:var(--surface-2)">${list.map((r) => `<button class="row plain" type="button" data-act="recipe" data-v="${r.id}">
      <span class="body"><div class="t">${esc(r.name)}</div><div class="s">${esc(r.tag || 'Minha receita')} · ${esc(r.tempo || '')}</div></span><span class="end">${ic('right')}</span></button>`).join('')}</div>
    <div class="stack-btns"><button class="btn soft block" type="button" data-act="recipe-new">${ic('plus')} Nova receita</button></div>`);
};
A.recipe = (id) => {
  const r = allRecipes().find((x) => x.id === id);
  if (!r) return;
  const mine = state.recipes.includes(r);
  sheet(`<button type="button" class="text-btn" data-act="recipes" style="padding-left:0">${ic('left')} Receitas</button>
    <h2 style="margin-top:6px">${esc(r.name)}</h2>
    <p class="lead">${[r.tempo, r.porcoes ? `${r.porcoes} ${r.porcoes > 1 ? 'porções' : 'porção'}` : ''].filter(Boolean).map(esc).join(' · ')}</p>
    <div class="food"><div class="t" style="margin-bottom:6px">Ingredientes</div><ul class="plain-list">${r.ing.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="food"><div class="t" style="margin-bottom:6px">Modo de preparo</div><ol class="steps">${r.prep.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="sheet-actions">${mine ? `<button class="btn danger" type="button" data-act="recipe-del" data-v="${r.id}">Excluir</button>` : '<span></span>'}<button class="btn soft" value="cancel">Fechar</button></div>`);
};
A['recipe-new'] = () => {
  sheet(`<h2>Nova receita</h2>
    <div class="field"><label>Nome</label><input name="name" required></div>
    <div class="two"><div class="field"><label>Tempo</label><input name="tempo" placeholder="ex.: 20 min"></div>
      <div class="field"><label>Porções</label><input name="porcoes" inputmode="numeric"></div></div>
    <div class="field"><label>Ingredientes (um por linha)</label><textarea name="ing" style="min-height:120px"></textarea></div>
    <div class="field"><label>Modo de preparo (um passo por linha)</label><textarea name="prep" style="min-height:120px"></textarea></div>
    ${sheetActions()}`, (f) => {
    const name = f.name.value.trim();
    if (!name) return false;
    const lines = (t) => t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    state.recipes.push({ id: 'u' + uid(), name, tempo: f.tempo.value.trim(), porcoes: num(f.porcoes.value), tag: 'Minha receita', ing: lines(f.ing.value), prep: lines(f.prep.value) });
    save(); render();
  });
};
A['recipe-del'] = (id) => {
  if (!confirm('Excluir esta receita?')) return;
  state.recipes = state.recipes.filter((x) => x.id !== id); save(); A.recipes();
};
/* ---------------- Eventos ---------------- */
document.addEventListener('click', (ev) => {
  const tabBtn = ev.target.closest('[data-tab]');
  if (tabBtn) return go(tabBtn.dataset.tab);
  const el = ev.target.closest('[data-act]');
  if (!el || el.tagName === 'SELECT' || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) { ev.preventDefault(); ev.stopPropagation(); fn(el.dataset.v, el); }
});
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.matches('select[data-act]')) A[el.dataset.act]?.(el.value, el);
});
document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (!el.dataset.set || !state.active) return;
  const [ei, si, field] = el.dataset.set.split('.');
  state.active.exercises[+ei].sets[+si][field] = el.value.trim();
  save();
});

if (state.active) keepAwake(true);
render();
animateView();
// No APK (Capacitor) o app já vem embalado no celular: o modo offline do navegador não é usado.
const isNativeApp = !!window.Capacitor?.isNativePlatform?.();
if ('serviceWorker' in navigator && !isNativeApp) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
