// Pilar: IA do app com o Google Gemini.
//  - tipo 'calorias' (padrão): estima calorias de um alimento fora do plano (foto e/ou texto)
//  - tipo 'treino': monta treinos a partir de uma descrição, ligando cada exercício a uma demonstração do Free Exercise DB
// A chave fica no servidor (segredo GEMINI_API_KEY no painel do Supabase), vale para todos do Pilar
// e nunca vai para o celular. Só quem está logado e na lista public.pilar_membros pode usar.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const PROPS = {
  alimento: { type: 'STRING', description: 'Nome curto do alimento' },
  porcao: { type: 'STRING', description: 'Porção considerada, ex.: 1 barra de 25 g' },
  kcal: { type: 'NUMBER' }, proteina_g: { type: 'NUMBER' }, carboidrato_g: { type: 'NUMBER' }, gordura_g: { type: 'NUMBER' },
  confianca: { type: 'STRING', enum: ['alta', 'media', 'baixa'] },
  observacao: { type: 'STRING', description: 'Uma frase curta: de onde veio a estimativa ou o que pode mudar o valor' },
};
const ORDEM = Object.keys(PROPS);
const LIMITE_DIA = 40;
const MODELOS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });

  // quem está chamando: precisa estar logado e na lista do Pilar
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u } = await admin.auth.getUser(jwt);
  const email = u?.user?.email?.toLowerCase();
  if (!email) return json(401, { erro: 'Entre na sua conta para usar a IA.' });
  const { data: membro } = await admin.from('pilar_membros').select('email').ilike('email', email).maybeSingle();
  if (!membro) return json(403, { erro: 'Esta conta não tem acesso ao Pilar.' });

  // limite por pessoa: protege a cota grátis do Google
  const desde = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const { count } = await admin.from('pilar_ia_uso').select('id', { count: 'exact', head: true }).eq('email', email).gte('em', desde);
  if ((count ?? 0) >= LIMITE_DIA) return json(429, { erro: `Você usou a IA ${LIMITE_DIA} vezes nas últimas 24 horas. Tente de novo amanhã.` });

  const chave = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (!chave) return json(503, { erro: 'A IA ainda não foi configurada no Pilar.', codigo: 'sem_chave' });

  let corpo: { imagem?: string; texto?: string; tipo?: string } = {};
  try { corpo = await req.json(); } catch { /* corpo inválido */ }
  if (corpo.tipo === 'treino') return montarTreino(admin, email, chave, String(corpo.texto || '').slice(0, 2000));
  const imagem = typeof corpo.imagem === 'string' ? corpo.imagem : '';
  const texto = typeof corpo.texto === 'string' ? corpo.texto.slice(0, 500) : '';
  if (!imagem && !texto) return json(400, { erro: 'Tire uma foto ou descreva o alimento.' });
  if (imagem.length > 4_000_000) return json(413, { erro: 'A foto ficou grande demais. Tente outra.' });

  const pedido = [
    'Estime as calorias e os macronutrientes do que a pessoa comeu, fora do plano alimentar dela.',
    imagem ? 'Use a foto. Se aparecer embalagem ou tabela nutricional, use os valores dela.' : '',
    texto ? `Descrição da pessoa: "${texto}"` : '',
    'Se a quantidade não estiver clara, considere uma porção típica no Brasil e diga qual foi.',
    'Escreva em português do Brasil.',
  ].filter(Boolean).join('\n');
  const parts: unknown[] = [];
  if (imagem) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imagem } });
  parts.push({ text: pedido });
  const body = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2,
      responseSchema: { type: 'OBJECT', properties: PROPS, required: ORDEM, propertyOrdering: ORDEM } },
  });

  return chamarGemini(admin, email, chave, body);
});

/* chama o Gemini tentando os modelos em ordem; registra o uso quando dá certo */
async function chamarGemini(admin: ReturnType<typeof createClient>, email: string, chave: string, body: string) {
  let ultimo = 503;
  for (const modelo of MODELOS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave }, body });
    const d = await r.json().catch(() => ({}));
    if ([404, 429, 500, 503].includes(r.status)) { ultimo = r.status; continue; } // cheio ou indisponível: próximo modelo
    if (!r.ok) {
      const msg = d?.error?.message || '';
      console.error('gemini', r.status, msg.slice(0, 160));
      if (/API key not valid|API_KEY_INVALID|expired/i.test(msg)) return json(503, { erro: 'A chave da IA do Pilar não é válida. Troque no painel do Supabase.', codigo: 'chave_invalida' });
      return json(400, { erro: 'A IA não conseguiu ler esse pedido. Tente outra foto ou descreva o alimento.' });
    }
    const cand = d?.candidates?.[0];
    if (!cand || cand.finishReason === 'SAFETY' || d?.promptFeedback?.blockReason) return json(422, { erro: 'A IA não conseguiu analisar esse item.' });
    const txt = (cand.content?.parts || []).map((p: { text?: string }) => p.text || '').join('').trim();
    try { const resultado = JSON.parse(txt); await admin.from('pilar_ia_uso').insert({ email }); return json(200, { resultado }); } catch { return json(502, { erro: 'A IA não devolveu resultado. Tente de novo.' }); }
  }
  return json(ultimo === 429 ? 429 : 503, { erro: ultimo === 429
    ? 'Chegou no limite grátis da IA por agora. Tente de novo mais tarde.'
    : 'A IA está sobrecarregada agora. Tente de novo em instantes.' });
}

/* ---------- montar treino ---------- */
let idsCache: string[] | null = null;
async function idsExercicios(): Promise<string[]> {
  if (idsCache) return idsCache;
  try {
    const r = await fetch('https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json');
    const lista = await r.json();
    idsCache = lista.map((x: { id: string }) => x.id);
  } catch { idsCache = []; }
  return idsCache!;
}
const TREINO_SCHEMA = {
  type: 'OBJECT',
  properties: {
    treinos: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      nome: { type: 'STRING', description: 'Nome curto do treino, ex.: Peito e tríceps' },
      exercicios: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
        nome: { type: 'STRING', description: 'Nome do exercício como se fala em academia no Brasil' },
        series: { type: 'INTEGER' },
        reps: { type: 'STRING', description: 'Repetições ("12", "10-12"), tempo ("30s") ou duração ("15 min")' },
        descanso: { type: 'INTEGER', description: 'Descanso entre séries em segundos' },
        tipo: { type: 'STRING', enum: ['carga', 'tempo', 'cardio'] },
        demo: { type: 'STRING', description: 'id exato da lista de demonstrações, ou vazio se nenhum servir' },
        obs: { type: 'STRING', description: 'Dica curta de execução, opcional' },
      }, required: ['nome', 'series', 'reps', 'descanso', 'tipo', 'demo'], propertyOrdering: ['nome', 'series', 'reps', 'descanso', 'tipo', 'demo', 'obs'] } },
    }, required: ['nome', 'exercicios'], propertyOrdering: ['nome', 'exercicios'] } },
  },
  required: ['treinos'],
};
async function montarTreino(admin: ReturnType<typeof createClient>, email: string, chave: string, texto: string) {
  if (texto.trim().length < 5) return json(400, { erro: 'Descreva o treino que você quer montar.' });
  const ids = await idsExercicios();
  const pedido = [
    'Você é um personal trainer. Monte o(s) treino(s) que a pessoa pediu, para academia.',
    'Se ela colou um treino pronto, organize exatamente esse treino, sem inventar exercícios.',
    'Se ela só descreveu o objetivo, monte um treino seguro e equilibrado, com 5 a 8 exercícios por treino.',
    'Nomes dos exercícios em português do Brasil, como se fala na academia.',
    'tipo: "carga" para exercícios com peso e repetições, "tempo" para isometria (ex.: prancha, reps="30s"), "cardio" para esteira, bike etc. (reps="15 min", series=1, descanso=0).',
    'Descanso padrão: 90 segundos para exercícios com carga, a não ser que a pessoa peça outro.',
    ids.length ? `Para "demo", escolha o id mais parecido desta lista (copie exatamente) ou deixe vazio: ${ids.join(', ')}` : 'Deixe "demo" vazio.',
    `Pedido da pessoa: «${texto}»`,
  ].join('\n');
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: pedido }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4, responseSchema: TREINO_SCHEMA },
  });
  const r = await chamarGemini(admin, email, chave, body);
  if (r.status !== 200) return r;
  const { resultado } = await r.json();
  const ok = new Set(ids);
  for (const t of resultado?.treinos || []) for (const e of t.exercicios || []) if (e.demo && !ok.has(e.demo)) e.demo = '';
  return json(200, { resultado });
}

