import { useEffect } from 'react';
import { Head, Section, Icon } from '../components/ui.jsx';
import { useStore, useTick } from '../lib/hooks.js';
import { state, save, fmtClock, br, num, estMinutes, nextWorkout, lastPerformance } from '../lib/core.js';
import Illu from '../components/Illu.jsx';
import TreinoFoco from './TreinoFoco.jsx';
import { buzz } from '../lib/effects.js';
import { startTimer } from '../lib/timer.js';
import { openWorkout, startWorkout, addWorkout, finishWorkout, cancelWorkout } from '../sheets/treino.jsx';
import { buzzOnly } from '../lib/effects.js';

/* série recém-marcada (animação `just`); limpa depois do render, como no antigo */
let justKey = null;

/* ----- ações do treino em andamento ----- */
const parse = (v) => v.split('.').map(Number);
function copyPrev(v) {
  const [ei, si] = parse(v);
  const e = state.active.exercises[ei], pv = lastPerformance(e.name)?.sets[si];
  if (!pv) return;
  Object.assign(e.sets[si], { kg: pv.kg ?? '', reps: pv.reps ?? '' });
  save();
}
function toggleSet(v) {
  const [ei, si] = parse(v);
  const e = state.active.exercises[ei], st = e.sets[si];
  st.done = !st.done;
  if (st.done) {
    const pv = lastPerformance(e.name)?.sets[si];
    if (st.kg === '' && pv?.kg) st.kg = pv.kg;
    if (st.reps === '' && e.tipo === 'carga') st.reps = pv?.reps || String(e.reps).split('-')[0].replace(/\D/g, '');
    justKey = `${ei}.${si}`; buzz(15);
    let next = null;
    state.active.exercises.some((x) => x.sets.some((y, yi) => { if (!y.done) { next = `Próximo: ${x.name} · série ${yi + 1}`; return true; } return false; }));
    if (next) startTimer(e.rest, next);
  }
  save();
}
function addSet(ei) {
  const e = state.active.exercises[ei], l = e.sets[e.sets.length - 1];
  e.sets.push({ kg: l?.kg || '', reps: '', done: false });
  save();
}
function setField(ei, si, field, value) {
  if (!state.active) return;
  state.active.exercises[ei].sets[si][field] = value.trim();
  save();
}

/* relógio isolado: só ele re-renderiza a cada segundo (não corta a animação das séries) */
function Elapsed({ start }) {
  useTick(1000, !!state.active);
  return <span id="elapsed">{fmtClock((Date.now() - start) / 1000)}</span>;
}

function ActiveView({ s }) {
  useEffect(() => { justKey = null; });
  const total = s.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  return (
    <>
      <div className="session-head">
        <div className="row1">
          <div className="body"><div className="t">{s.workoutLetter || ''} · {s.workoutName}</div>
            <div className="s num"><Elapsed start={s.start} /> · {done} de {total} séries</div></div>
          <button className="btn sm" onClick={finishWorkout}>Concluir</button>
        </div>
        <button className="btn soft block foco-btn" onClick={() => { state.ui.treinoLista = false; save(); }}>Um exercício por vez</button>
        <div className="prog"><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
      </div>
      {s.exercises.map((e, ei) => {
        const prev = lastPerformance(e.name);
        const carga = e.tipo === 'carga';
        const h1 = carga ? 'kg' : e.tipo === 'cardio' ? 'min' : 'seg';
        const h2 = carga ? 'reps' : e.tipo === 'cardio' ? 'km' : '—';
        const complete = e.sets.length && e.sets.every((x) => x.done);
        return (
          <div key={ei} className={`ex ${complete ? 'complete' : ''}`}>
            <div className="ex-top"><div>
              <div className="ex-name">{e.name}</div>
              <div className="ex-meta num">{e.sets.length} × {e.reps}{e.rest ? ` · descanso ${e.rest}s` : ''}</div>
              {e.notes ? <div className="ex-note">{e.notes}</div> : null}
            </div>{complete ? <span className="ex-done"><Icon n="check" /></span> : null}</div>
            <div className="sets">
              <div className="h">Série</div><div className="h">Anterior</div><div className="h">{h1}</div><div className="h">{h2}</div><div className="h" />
              {e.sets.map((st, si) => {
                const pv = prev?.sets[si];
                const pvTxt = pv ? (carga ? `${br(num(pv.kg))} × ${pv.reps}` : `${pv.kg || '—'} ${h1}`) : '—';
                const k = `${ei}.${si}`;
                return (
                  <div key={si} className={`set ${st.done ? 'done' : ''} ${justKey === k ? 'just' : ''}`}>
                    <div className="n">{si + 1}</div>
                    <button className="prev num" onClick={() => copyPrev(k)} disabled={!pv} aria-label="Usar valores anteriores">{pvTxt}</button>
                    <input inputMode="decimal" value={st.kg ?? ''} placeholder={pv?.kg ?? ''} aria-label={`${h1}, série ${si + 1}`}
                      onChange={(ev) => setField(ei, si, 'kg', ev.target.value)} />
                    <input inputMode="decimal" value={st.reps ?? ''} placeholder={pv?.reps ?? (carga ? String(e.reps).split('-')[0] : '')}
                      aria-label={`${h2}, série ${si + 1}`} disabled={!carga && e.tipo !== 'cardio'}
                      onChange={(ev) => setField(ei, si, 'reps', ev.target.value)} />
                    <button className="chk" onClick={() => toggleSet(k)} aria-label={`Concluir série ${si + 1}`}><Icon n="check" /></button>
                  </div>
                );
              })}
            </div>
            <button className="add-set" onClick={() => addSet(ei)}>+ Adicionar série</button>
          </div>
        );
      })}
      <div className="stack-btns"><button className="btn danger block" onClick={cancelWorkout}>Descartar treino</button></div>
    </>
  );
}

export default function Treino() {
  const state = useStore();
  if (state.active) return state.ui.treinoLista
    ? <ActiveView s={state.active} />
    : <TreinoFoco s={state.active} onLista={() => { state.ui.treinoLista = true; save(); }} />;
  const nw = nextWorkout();
  const ws = state.plan.workouts;
  return (
    <>
      <Head emoji={ws.length ? 'fogo' : null} kicker={ws.length ? `${ws.length} ${ws.length === 1 ? 'treino' : 'treinos'} no plano` : 'Monte seu plano'} title="Treino"
        action={<button className="icon-btn destaque" style={{ '--cor': 'var(--c-treino)' }} onClick={addWorkout} aria-label="Adicionar treino"><Icon n="plus" /></button>} />
      <Section title="Seus treinos">
        {ws.length ? (
          <div className="wk-list">
            {ws.map((w) => {
              const isNext = nw && w.id === nw.id;
              return (
                <button key={w.id} className={`wk-card ${isNext ? 'next' : ''}`} {...segurar(() => openWorkout(w.id), () => startWorkout(w.id))}>
                  <span className="lt">{w.letter}</span>
                  <span className="body"><div className="t">{w.name}</div><div className="s">{w.exercises.length} exercícios · ~{estMinutes(w)} min</div></span>
                  <span className="end">{isNext ? <span className="tag accent">Próximo</span> : null}<Icon n="right" /></span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="group empty"><Illu nome="treino" cor="var(--c-treino)" /><div>Nenhum treino no plano ainda.</div>
            <div className="stack-btns" style={{ marginTop: 14 }}><button className="btn block" onClick={addWorkout}><Icon n="plus" /> Adicionar treino</button></div></div>
        )}
      </Section>
      {ws.length ? <p className="hint" style={{ padding: '10px 4px 0' }}>Toque para começar. Segure para ver a lista ou editar.</p> : null}
    </>
  );
}

/* toque começa o treino; segurar ~0,5 s abre a lista do treino (com Editar) */
function segurar(onHold, onTap) {
  let t = null, x0 = 0, y0 = 0, segurou = false;
  const parar = () => { clearTimeout(t); t = null; };
  return {
    onPointerDown: (e) => { segurou = false; x0 = e.clientX; y0 = e.clientY; parar(); t = setTimeout(() => { segurou = true; t = null; buzzOnly(15); onHold(); }, 480); },
    onPointerMove: (e) => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) parar(); },
    onPointerUp: parar, onPointerLeave: parar, onPointerCancel: parar,
    onContextMenu: (e) => e.preventDefault(),
    onClick: (e) => { if (segurou) { e.preventDefault(); segurou = false; return; } onTap(); },
  };
}
