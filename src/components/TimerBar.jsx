/* Timer de descanso em anel, flutuando acima das abas */
import { useSyncExternalStore } from 'react';
import { fmtClock } from '../lib/core.js';
import { Anim } from './Illu.jsx';
import { subscribeTimer, getTimer, addTimer, stopTimer } from '../lib/timer.js';

const ARC = 2 * Math.PI * 36;
export default function TimerBar() {
  const t = useSyncExternalStore(subscribeTimer, getTimer);
  if (!t.end) return null;
  const left = (t.end - Date.now()) / 1000;
  const frac = Math.max(0, Math.min(1, left / t.total));
  return (
    <div className={`timer ${left <= 0 ? 'over' : ''}`} role="status" aria-live="polite">
      <div className="timer-ring">
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
          <circle className="track" cx="42" cy="42" r="36" strokeWidth="7" />
          <circle className="val" cx="42" cy="42" r="36" strokeWidth="7" strokeDasharray={ARC.toFixed(1)} strokeDashoffset={(ARC * (1 - frac)).toFixed(1)} />
        </svg>
        <div className="txt">{(left < 0 ? '+' : '') + fmtClock(left)}</div>
      </div>
      <div className="timer-main">
        <div className="timer-label"><Anim nome="cronometro" tamanho={30} className="timer-anim" />Descanso</div>
        <div className="timer-next">{t.next}</div>
        <div className="timer-btns">
          <button className="tbtn" onClick={() => addTimer(-15)}>−15</button>
          <button className="tbtn" onClick={() => addTimer(15)}>+15</button>
          <button className="tbtn go" onClick={stopTimer}>Pular</button>
        </div>
      </div>
    </div>
  );
}
