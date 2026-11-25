import { useEffect } from 'react';
import { Head, Section, Rings, CountUp, Icon } from '../components/ui.jsx';
import Illu from '../components/Illu.jsx';
import { Anim } from '../components/Illu.jsx';
import { useStore } from '../lib/hooks.js';
import { todayKey, routineSorted, cap, fmtDayLong } from '../lib/core.js';
import { getJustKey, clearJustKey, rotDay, rotTick, openRoutine, openRotEditor } from '../sheets/rotina.jsx';

export default function Rotina() {
  const state = useStore();
  const key = state.ui.rotDay || todayKey();
  const list = routineSorted(key), log = (state.routineLog || {})[key] || {};
  const done = list.filter((r) => log[r.id]).length;
  const just = getJustKey();
  useEffect(() => { clearJustKey(); });

  return (
    <>
      <Head kicker="Seus hábitos" title="Rotina" emoji="relogio"
        action={<button className="icon-btn" onClick={openRotEditor} aria-label="Adicionar hábito"><Icon n="plus" /></button>} />
      <div className="section"><div className="day-switch">
        <button className="icon-btn" onClick={() => rotDay(-1)} aria-label="Dia anterior"><Icon n="left" /></button>
        <b>{key === todayKey() ? 'Hoje' : cap(fmtDayLong(key))}</b>
        <button className="icon-btn" onClick={() => rotDay(1)} aria-label="Próximo dia"
          disabled={key >= todayKey()} style={key >= todayKey() ? { opacity: 0.3 } : undefined}><Icon n="right" /></button>
      </div></div>
      {list.length ? (
        <>
          <div className="section"><div className="group diet-sum"><Rings items={[{ v: done / list.length, color: 'var(--c-rotina)' }]} size={76} sw={10} />
            <div><div className="big digits"><CountUp value={done} k="rotina" /><small> de {list.length}</small></div>
              <div className="s">{done === list.length ? 'rotina completa' : list.length === 1 ? 'hábito' : 'hábitos'}</div></div>
            {done === list.length ? <Anim key={key} nome="maos" tamanho={60} className="sum-anim" /> : null}</div></div>
          <Section title="Hábitos do dia">
            <div className="meal-list rot">{list.map((r) => {
              const ok = !!log[r.id];
              return (
                <div key={r.id} className={`meal-card ${ok ? 'done' : ''} ${just === r.id ? 'just' : ''}`}>
                  <button className="meal-main" onClick={() => openRoutine(r.id)}>
                    <span className="mc-ic"><Icon n="check" /></span>
                    <span className="body"><div className="t">{r.time ? `${r.time} - ` : ''}{r.name}</div></span>
                  </button>
                  <button className="meal-tick" onClick={() => rotTick(r.id)} aria-pressed={ok} aria-label={`Marcar ${r.name}`}><Icon n="check" /></button>
                </div>
              );
            })}</div>
          </Section>
        </>
      ) : (
        <div className="section"><div className="group empty"><Illu nome="rotina" cor="var(--c-rotina)" />Nenhum hábito para {key === todayKey() ? 'hoje' : 'este dia'}.</div>
          <div className="stack-btns"><button className="btn block" onClick={openRotEditor}>Montar minha rotina</button></div></div>
      )}
    </>
  );
}
