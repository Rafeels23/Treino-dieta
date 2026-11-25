import { useSyncExternalStore, useEffect, useState } from 'react';
import { subscribe, getVersion, state } from './core.js';

/* Re-renderiza quando o estado é salvo. Retorna o estado atual (o mesmo objeto, mutável). */
export function useStore() {
  useSyncExternalStore(subscribe, getVersion);
  return state;
}

/* Re-renderiza a cada `ms` (relógio do treino, timer). */
export function useTick(ms = 1000, on = true) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    const id = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms, on]);
}
