import { useEffect, useSyncExternalStore } from 'react';
import { useStore } from './lib/hooks.js';
import { go } from './lib/ui.js';
import { save } from './lib/core.js';
import { keepAwake, resetWakeLock } from './lib/timer.js';
import { Icon } from './components/ui.jsx';
import SheetHost from './components/Sheet.jsx';
import Login, { NotMember, Splash } from './components/Login.jsx';
import { initAccount, getAccount, subscribeAccount } from './lib/cloud.js';

initAccount();
import TimerBar from './components/TimerBar.jsx';
import Hoje from './screens/Hoje.jsx';
import Treino from './screens/Treino.jsx';
import Dieta from './screens/Dieta.jsx';
import Rotina from './screens/Rotina.jsx';
import Progresso from './screens/Progresso.jsx';
import Perfil from './screens/Perfil.jsx';

const SCREENS = { hoje: Hoje, treino: Treino, dieta: Dieta, rotina: Rotina, progresso: Progresso, perfil: Perfil };
export const TABS = [['hoje', 'Hoje', 'home'], ['treino', 'Treino', 'dumbbell'], ['dieta', 'Dieta', 'meal'], ['rotina', 'Rotina', 'check'], ['progresso', 'Progresso', 'chart']];

export default function App() {
  const acc = useSyncExternalStore(subscribeAccount, getAccount);
  if (acc.status === 'loading') return <Splash />;
  if (acc.status === 'out') return <Login />;
  if (acc.member === false) return <NotMember email={acc.user?.email} />;
  return <Main />;
}

function Main() {
  const state = useStore();
  const tab = state.ui.tab;
  const Screen = SCREENS[tab] || Hoje;

  useEffect(() => {
    if (state.active) keepAwake(true);
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      resetWakeLock();
      if (state.active) keepAwake(true);
      save(); // re-renderiza: o dia pode ter virado enquanto o app estava fechado
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <main id="view" className="enter" key={tab}><Screen /></main>
      <TimerBar />
      <nav className="tabs" id="tabs">
        {TABS.map(([k, label, icon]) => (
          <button key={k} className={k === tab ? 'active' : ''} aria-current={k === tab ? 'page' : 'false'} onClick={() => go(k)}>
            <span className="pill"><Icon n={icon} /></span>{label}
          </button>
        ))}
      </nav>
      <SheetHost />
    </>
  );
}
