// Pilar: calcula calorias de um alimento fora do plano com o Google Gemini.
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

  const chave = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (!chave) return json(503, { erro: 'A IA ainda não foi configurada no Pilar.', codigo: 'sem_chave' });

  let corpo: { imagem?: string; texto?: string } = {};
  try { corpo = await req.json(); } catch { /* corpo inválido */ }
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
    try { return json(200, { resultado: JSON.parse(txt) }); } catch { return json(502, { erro: 'A IA não devolveu resultado. Tente de novo.' }); }
  }
  return json(ultimo === 429 ? 429 : 503, { erro: ultimo === 429
    ? 'Chegou no limite grátis da IA por agora. Tente de novo mais tarde.'
    : 'A IA está sobrecarregada agora. Tente de novo em instantes.' });
});
