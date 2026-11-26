/* Lembretes pelo navegador (Web Push): usado no iPhone (com o Pilar na Tela de Início) e em navegadores.
   O servidor (função pilar-lembretes, chamada a cada 5 min) manda a notificação na hora certa.
   O iPhone não permite botões na notificação de site: tocar abre o app. */
import { supabase, getAccount } from './cloud.js';

const ehIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const suporta = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export function avisoPush() {
  if (ehIOS() && !instalado()) return 'No iPhone, os lembretes só funcionam com o Pilar na Tela de Início: toque em Compartilhar › Adicionar à Tela de Início e abra por lá.';
  if (!suporta()) return 'Este navegador não recebe notificações.';
  return '';
}

const b64ParaBytes = (b64) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

let chave = null;
async function chavePublica() {
  if (chave) return chave;
  const { data, error } = await supabase.functions.invoke('pilar-lembretes', { body: { acao: 'chave' } });
  if (error || !data?.chave) throw new Error('sem chave');
  return (chave = data.chave);
}

async function inscricao(criar) {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub && criar) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ParaBytes(await chavePublica()) });
  return sub;
}

export async function ativarPush() {
  const aviso = avisoPush();
  if (aviso) return aviso;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'Permita as notificações do Pilar nos ajustes do celular.';
  try { await inscricao(true); } catch { return 'Não consegui ligar as notificações agora. Tente de novo.'; }
  return '';
}

const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
export async function sincronizarPush(itens) {
  if (!suporta() || Notification.permission !== 'granted') return;
  const user = getAccount().user;
  if (!user) return;
  try {
    const sub = await inscricao(itens.length > 0);
    if (!sub) return;
    if (!itens.length) { await supabase.from('pilar_lembretes').delete().eq('endpoint', sub.endpoint); return; }
    await supabase.from('pilar_lembretes').upsert({
      user_id: user.id, endpoint: sub.endpoint, assinatura: sub.toJSON(),
      itens: itens.map(({ tipo, ref, hora, minuto, titulo, texto }) => ({ tipo, ref, hora: hhmm(hora, minuto), titulo, texto })),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      atualizado: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
  } catch { /* tenta de novo na próxima mudança */ }
}
