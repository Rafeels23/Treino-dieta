/* Conta e sincronização na nuvem (Supabase).
   - O app continua salvando no aparelho (funciona offline); a nuvem é cópia e ponte entre aparelhos.
   - Cada pessoa tem uma linha em public.pilar_dados; só membros liberados (public.pilar_membros) acessam.
   - A chave da IA (state.ai) nunca sobe para a nuvem.
   - Conflito: vale a versão salva por último (carimbo de hora local x da nuvem). */
import { createClient } from '@supabase/supabase-js';
import { state, replaceState, migrate, defaultState, subscribe } from './core.js';

const SUPABASE_URL = 'https://twyeoddxbzmhjbxkxhpu.supabase.co';
// Chave publicável: pode ficar no app. Quem protege os dados são as regras (RLS) do banco.
const SUPABASE_KEY = 'sb_publishable_IGZpjmuSWhCj43phWezb_A_5CNKmAwh';
const META_KEY = 'pilar-sync';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'pilar-auth' },
});

/* ----- estado da conta, observável pelo React ----- */
let acc = { status: 'loading', user: null, member: null, sync: 'idle', error: '' };
const listeners = new Set();
const set = (p) => { acc = { ...acc, ...p }; listeners.forEach((f) => f()); };
export const getAccount = () => acc;
export const subscribeAccount = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/* ----- metadados locais da sincronização ----- */
const readMeta = () => { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch { return {}; } };
const writeMeta = (m) => { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch {} };
let meta = readMeta();          // { userId, localAt, remoteAt }

const forCloud = () => { const { ai, ...rest } = state; return { ...rest, active: rest.active ?? null }; };

/* aplicar dados vindos da nuvem sem disparar um novo envio */
let applying = false;
function applyRemote(dados) {
  applying = true;
  const ai = state.ai;
  const s = migrate(Object.assign(defaultState(), dados || {}));
  if (ai) s.ai = ai;
  replaceState(s);
  applying = false;
}

async function push() {
  if (!acc.user || acc.member === false) return;
  if (!navigator.onLine) { set({ sync: 'offline' }); return; }
  set({ sync: 'saving' });
  const at = new Date(meta.localAt || Date.now()).toISOString();
  const { error } = await supabase.from('pilar_dados')
    .upsert({ user_id: acc.user.id, dados: forCloud(), atualizado_em: at }, { onConflict: 'user_id' });
  if (error) {
    if (error.code === '42501' || /row-level security/i.test(error.message)) { set({ member: false, sync: 'idle' }); return; }
    set({ sync: 'error', error: error.message });
    return;
  }
  meta = { ...meta, remoteAt: at }; writeMeta(meta);
  set({ sync: 'ok', member: true, error: '' });
}

let timer = null;
function schedulePush() {
  clearTimeout(timer);
  timer = setTimeout(push, 1500);
}

/* cada save() local carimba a hora e agenda o envio */
subscribe(() => {
  if (applying || !acc.user) return;
  meta = { ...meta, localAt: Date.now() }; writeMeta(meta);
  schedulePush();
});

/* puxa da nuvem e decide quem vale: a versão mais recente */
export async function pull() {
  if (!acc.user) return;
  if (!navigator.onLine) { set({ sync: 'offline' }); return; }
  set({ sync: 'saving' });
  const { data, error } = await supabase.from('pilar_dados').select('dados, atualizado_em').eq('user_id', acc.user.id).maybeSingle();
  if (error) { set({ sync: 'error', error: error.message }); return; }
  if (!data) {                                    // nada na nuvem: sobe o que está no aparelho (ou descobre que não é membro)
    meta = { ...meta, localAt: meta.localAt || Date.now(), firstLogin: false }; writeMeta(meta);
    await push(); return;
  }
  const remoteAt = new Date(data.atualizado_em).getTime();
  const localAt = meta.firstLogin ? 0 : (meta.localAt || 0);
  if (meta.firstLogin) { meta = { ...meta, firstLogin: false }; writeMeta(meta); }
  if (remoteAt > localAt) {
    applyRemote(data.dados);
    meta = { ...meta, localAt: remoteAt, remoteAt: data.atualizado_em }; writeMeta(meta);
    set({ sync: 'ok', member: true });
  } else if (localAt > remoteAt) {
    await push();
  } else {
    set({ sync: 'ok', member: true });
  }
}

/* troca de pessoa no mesmo aparelho: não deixa os dados de uma irem para a conta da outra */
function onUser(user) {
  if (!user) { set({ status: 'out', user: null, member: null, sync: 'idle' }); return; }
  if (meta.userId && meta.userId !== user.id) {
    applying = true; replaceState(defaultState()); applying = false;
    meta = { userId: user.id, localAt: 0 };
  } else if (!meta.userId) {
    // primeiro login neste aparelho: se a nuvem já tem dados, ela vale (aparelho novo);
    // se a nuvem está vazia, os dados que já estão aqui sobem para a conta
    meta = { userId: user.id, localAt: 0, firstLogin: true };
  }
  writeMeta(meta);
  set({ status: 'in', user });
  pull();
}

export async function initAccount() {
  const { data } = await supabase.auth.getSession();
  onUser(data.session?.user || null);
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.id !== acc.user?.id) onUser(session.user);
    if (event === 'SIGNED_OUT') onUser(null);
  });
  window.addEventListener('online', () => { if (acc.user) pull(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && acc.user) pull(); });
}

const ptError = (e) => {
  const m = String(e?.message || e || '');
  if (/invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos e tente de novo.';
  if (/already registered|already exists/i.test(m)) return 'Esse e-mail já tem conta. Use "Entrar".';
  if (/password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/rate limit|too many|security purposes/i.test(m)) return 'Muitas tentativas. Espere um minuto e tente de novo.';
  if (/signups not allowed|not allowed for otp/i.test(m)) return 'Este e-mail não tem acesso ao Pilar.';
  if (/failed to fetch|network/i.test(m)) return 'Sem internet. Conecte-se para entrar.';
  if (/error sending|sending .*email|smtp/i.test(m)) return 'Não consegui enviar o e-mail com o código. Tente de novo daqui a pouco.';
  /* nunca mostrar mensagem técnica em inglês */
  return /[a-z]{3,} [a-z]{3,}/i.test(m) && !/[ãõçáéíóúâêô]/i.test(m) ? 'Não deu certo. Tente de novo.' : (m || 'Não deu certo. Tente de novo.');
};

/* login por código de 6 dígitos enviado por e-mail */
/* O código sai pelo Gmail, via função pilar-codigo no Supabase (só e-mails da lista do Pilar).
   Se o envio pelo Gmail ainda não estiver configurado, usa o e-mail padrão do Supabase. */
export async function sendCode(email) {
  const addr = email.trim().toLowerCase();
  let erro = null, semGmail = false;
  try {
    const { error } = await supabase.functions.invoke('pilar-codigo', { body: { email: addr } });
    if (error) {
      let body = null;
      try { body = await error.context?.json?.(); } catch { /* sem corpo */ }
      erro = body?.erro || null;
      semGmail = !erro || /configurad/i.test(erro);
    }
  } catch { semGmail = true; }
  if (!erro && !semGmail) return;
  if (semGmail) {
    const { error } = await supabase.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: true } });
    if (error) throw new Error(ptError(error));
    return;
  }
  throw new Error(erro);
}
export async function verifyCode(email, token) {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: String(token).trim(), type: 'email' });
  if (error) throw new Error(/expired|invalid/i.test(error.message) ? 'Código inválido ou vencido. Confira ou peça outro.' : ptError(error));
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(ptError(error));
}
/* devolve true se já entrou; false se precisa confirmar o e-mail */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw new Error(ptError(error));
  return !!data.session;
}
export async function signOut() {
  clearTimeout(timer);
  if (acc.user && acc.member) await push();
  await supabase.auth.signOut();
  applying = true; replaceState(defaultState()); applying = false;
  meta = {}; writeMeta(meta);
}
