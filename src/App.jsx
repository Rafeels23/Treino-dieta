import { Component, lazy, Suspense, useEffect, useSyncExternalStore } from 'react';
import { useStore } from './lib/hooks.js';
import { go } from './lib/ui.js';
import { save } from './lib/core.js';
import { keepAwake, resetWakeLock } from './lib/timer.js';
import { Icon } from './components/ui.jsx';
import SheetHost from './components/Sheet.jsx';
import Login, { NotMember, Splash } from './components/Login.jsx';
import { initAccount, getAccount, subscribeAccount } from './lib/cloud.js';
import { iniciarLembretes } from './lib/lembretes.js';
import { iniciarPulseira } from './lib/pulseira.js';

initAccount();
import TimerBar from './components/TimerBar.jsx';
import Hoje from './screens/Hoje.jsx';
/* as outras abas carregam depois da primeira tela (abre mais rápido) e já ficam guardadas para funcionar sem internet */
const telas = {
  treino: () => import('./screens/Treino.jsx'),
  dieta: () => import('./screens/Dieta.jsx'),
  rotina: () => import('./screens/Rotina.jsx'),
  progresso: () => import('./screens/Progresso.jsx'),
  perfil: () => import('./screens/Perfil.jsx'),
};
const Treino = lazy(telas.treino);
const Dieta = lazy(telas.dieta);
const Rotina = lazy(telas.rotina);
const Progresso = lazy(telas.progresso);
const Perfil = lazy(telas.perfil);
function baixarAbas() {
  const vai = () => Object.values(telas).forEach((f) => f().catch(() => {}));
  if ('requestIdleCallback' in window) requestIdleCallback(vai, { timeout: 4000 }); else setTimeout(vai, 1500);
}

/* se uma aba não carregar (sem internet e ainda não guardada), mostra um aviso em vez de quebrar */
class Falha extends Component {
  constructor(props) { super(props); this.state = { erro: false }; }
  static getDerivedStateFromError() { return { erro: true }; }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="section"><div className="group empty">
        <div>{navigator.onLine ? 'Não consegui abrir esta tela.' : 'Sem internet para abrir esta tela agora.'}</div>
        <div className="stack-btns" style={{ marginTop: 12 }}><button className="btn block" onClick={() => location.reload()}>Tentar de novo</button></div>
      </div></div>
    );
  }
}

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
    iniciarLembretes();
    baixarAbas();
    iniciarPulseira();
    const abrir = new URLSearchParams(location.search).get('abrir');
    if (abrir && SCREENS[abrir]) { go(abrir); history.replaceState(null, '', location.pathname); }
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
      <main id="view" className="enter" key={tab}><Falha><Suspense fallback={<div className="carregando" aria-busy="true" />}><Screen /></Suspense></Falha></main>
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
