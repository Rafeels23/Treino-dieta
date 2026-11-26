// Pilar: lembretes pelo navegador (Web Push), para o iPhone com o Pilar na Tela de Início.
//  - acao 'chave'  (pessoa logada): devolve a chave pública de envio (criada pelo próprio servidor na 1ª vez)
//  - acao 'enviar' (agendador do banco, a cada 5 min): manda os lembretes cujo horário chegou, uma vez por dia cada
// As chaves de envio ficam em public.pilar_config (só o servidor acessa); nenhuma passa pelo app.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Admin = ReturnType<typeof createClient>;

async function lerConfig(admin: Admin, chave: string) {
  const { data } = await admin.from('pilar_config').select('valor').eq('chave', chave).maybeSingle();
  return data?.valor as string | undefined;
}

async function chaves(admin: Admin) {
  let pub = await lerConfig(admin, 'vapid_publica'), priv = await lerConfig(admin, 'vapid_privada');
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys();
    await admin.from('pilar_config').upsert([{ chave: 'vapid_publica', valor: k.publicKey }, { chave: 'vapid_privada', valor: k.privateKey }], { onConflict: 'chave', ignoreDuplicates: true });
    pub = await lerConfig(admin, 'vapid_publica'); priv = await lerConfig(admin, 'vapid_privada');
  }
  return { pub: pub!, priv: priv! };
}

/* data (AAAA-MM-DD) e minutos do dia no fuso da pessoa */
function agoraNoFuso(tz: string) {
  let p: Record<string, string>;
  try {
    p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map((x) => [x.type, x.value]));
  } catch { return agoraNoFuso('America/Sao_Paulo'); }
  return { data: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}

async function enviar(admin: Admin) {
  const { pub, priv } = await chaves(admin);
  webpush.setVapidDetails('https://pilar-treino.vercel.app', pub, priv);
  const { data: linhas } = await admin.from('pilar_lembretes').select('*');
  let enviados = 0, removidos = 0;
  for (const l of linhas || []) {
    const { data, min } = agoraNoFuso(l.tz || 'America/Sao_Paulo');
    const feitos: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(l.enviados || {})) if (k.startsWith(data)) feitos[k] = v as boolean; // só os de hoje
    let mudou = Object.keys(feitos).length !== Object.keys(l.enviados || {}).length, morto = false;
    for (const it of (l.itens || []) as { tipo: string; ref: string; hora: string; titulo: string; texto: string }[]) {
      const [h, m] = String(it.hora).split(':').map(Number);
      const alvo = h * 60 + m, chave = `${data}|${it.tipo}|${it.ref}`;
      if (min < alvo || min - alvo >= 15 || feitos[chave]) continue; // janela de 15 min depois do horário
      try {
        await webpush.sendNotification(l.assinatura, JSON.stringify({
          titulo: it.titulo, texto: it.texto, tag: `${it.tipo}-${it.ref}`, abrir: './?abrir=dieta',
        }), { TTL: 1800 });
        enviados++;
      } catch (e) {
        const st = (e as { statusCode?: number }).statusCode;
        if (st === 404 || st === 410) { morto = true; break; } // inscrição não existe mais
        console.error('push', st, String((e as Error).message).slice(0, 120));
      }
      feitos[chave] = true; mudou = true;
    }
    if (morto) { await admin.from('pilar_lembretes').delete().eq('endpoint', l.endpoint); removidos++; continue; }
    if (mudou) await admin.from('pilar_lembretes').update({ enviados: feitos }).eq('endpoint', l.endpoint);
  }
  return json(200, { inscricoes: linhas?.length || 0, enviados, removidos });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let corpo: { acao?: string } = {};
  try { corpo = await req.json(); } catch { /* corpo inválido */ }

  if (corpo.acao === 'enviar') {
    const token = await lerConfig(admin, 'cron_token');
    if (!token || req.headers.get('x-pilar-cron') !== token) return json(401, { erro: 'Não autorizado.' });
    return enviar(admin);
  }
  if (corpo.acao === 'chave') {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json(401, { erro: 'Entre na sua conta.' });
    const { pub } = await chaves(admin);
    return json(200, { chave: pub });
  }
  return json(400, { erro: 'Ação desconhecida.' });
});
