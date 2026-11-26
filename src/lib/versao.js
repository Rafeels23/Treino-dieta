/* Atualização do app Android.
   As telas chegam sozinhas: o APK abre o site do Pilar (capacitor.config.json › server.url) e guarda uma cópia para usar sem internet.
   Só quando muda a parte nativa (lembretes, pulseira…) é preciso instalar um APK novo: aí public/versao-nativa.json
   recebe o número mínimo, e o app mostra o aviso com o botão de baixar. */
import { Capacitor, registerPlugin } from '@capacitor/core';

const Nativo = registerPlugin('PilarLembretes');
export const LINK_APK = 'https://github.com/Rafeels23/Treino-dieta/releases/latest';
const CHAVE = 'pilar-aviso-apk';

export async function apkDesatualizado() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return null;
  try {
    const [{ codigo }, cfg] = await Promise.all([
      Nativo.versao(),
      fetch(`./versao-nativa.json?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json()),
    ]);
    const minimo = Number(cfg?.minimo) || 0;
    if (!minimo || Number(codigo) >= minimo) return null;
    try { if (localStorage.getItem(CHAVE) === String(minimo)) return null; } catch { /* sem armazenamento */ }
    return { minimo, codigo: Number(codigo) };
  } catch { return null; }   // APK antigo (sem a função versao) ou sem internet: não incomoda
}
export function dispensarAviso(minimo) { try { localStorage.setItem(CHAVE, String(minimo)); } catch { /* ok */ } }
export function baixarApk() { window.location.href = LINK_APK; }
