// Pilar: envia o código de 6 dígitos de login pelo Gmail.
// - Só envia para e-mails da lista public.pilar_membros.
// - Limite: 1 envio por minuto e 10 por hora para cada e-mail.
// - O código vem do próprio Supabase Auth (generateLink, sem enviar o e-mail padrão);
//   o app confirma com supabase.auth.verifyOtp({ email, token, type: 'email' }).
// Segredos (definidos no painel do Supabase, nunca no código): GMAIL_USER, GMAIL_APP_PASSWORD.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import nodemailer from 'npm:nodemailer@7.0.10';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { erro: 'Método não permitido.' });

  let email = '';
  try { email = String((await req.json())?.email ?? ''); } catch { /* corpo inválido */ }
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { erro: 'Digite um e-mail válido.' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) só quem está na lista do Pilar
  const { data: membro, error: eMembro } = await admin.from('pilar_membros').select('email').ilike('email', email).maybeSingle();
  if (eMembro) return json(500, { erro: 'Não consegui conferir seu acesso. Tente de novo.' });
  if (!membro) return json(403, { erro: 'Este e-mail não tem acesso ao Pilar.' });

  // 2) limite de envios
  const umMinuto = new Date(Date.now() - 60_000).toISOString();
  const umaHora = new Date(Date.now() - 3_600_000).toISOString();
  const { data: recentes } = await admin.from('pilar_envios').select('enviado_em').eq('email', email).gte('enviado_em', umaHora);
  if ((recentes ?? []).some((r) => r.enviado_em >= umMinuto)) return json(429, { erro: 'Espere um minuto para pedir outro código.' });
  if ((recentes ?? []).length >= 10) return json(429, { erro: 'Muitos códigos pedidos. Tente de novo mais tarde.' });

  // 3) garante a conta (já confirmada) e gera o código
  const criado = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (criado.error && !/already|registered|exists/i.test(criado.error.message)) {
    return json(500, { erro: 'Não consegui preparar sua conta.' });
  }
  const { data: link, error: eLink } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const codigo = link?.properties?.email_otp;
  if (eLink || !codigo) return json(500, { erro: 'Não consegui gerar o código. Tente de novo.' });

  // 4) envia pelo Gmail (porta 465; as portas 25 e 587 são bloqueadas nas funções do Supabase)
  // a senha de app aparece no Google em blocos com espaços: tira os espaços
  const user = Deno.env.get('GMAIL_USER')?.trim(), pass = Deno.env.get('GMAIL_APP_PASSWORD')?.replace(/\s+/g, '');
  if (!user || !pass) return json(500, { erro: 'O envio de e-mail ainda não foi configurado.' });
  try {
    const smtp = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
    await smtp.sendMail({
      from: `"Pilar" <${user}>`,
      to: email,
      subject: `Seu código do Pilar: ${codigo}`,
      text: `Seu código do Pilar é ${codigo}.\n\nUse-o no app para entrar. Ele vale por alguns minutos.\nSe não foi você, ignore este e-mail.`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#15161a">
        <p style="margin:0 0 4px;color:#60646b;font-size:14px">Pilar</p>
        <h1 style="margin:0 0 16px;font-size:22px">Seu código para entrar</h1>
        <p style="margin:0 0 8px;font-size:36px;font-weight:700;letter-spacing:8px">${codigo}</p>
        <p style="margin:16px 0 0;color:#60646b;font-size:14px">Ele vale por alguns minutos. Se não foi você, ignore este e-mail.</p>
      </div>`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('falha ao enviar e-mail', msg);
    // Gmail recusou o login (senha de app errada): o app usa o e-mail padrão do Supabase
    if (/535|Invalid login|auth/i.test(msg)) return json(503, { erro: 'O envio pelo Gmail não está configurado direito.' });
    return json(502, { erro: 'Não consegui enviar o e-mail agora. Tente de novo.' });
  }

  await admin.from('pilar_envios').insert({ email });
  return json(200, { ok: true, tamanho: String(codigo).length });
});
