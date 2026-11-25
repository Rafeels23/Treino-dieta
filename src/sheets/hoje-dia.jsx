/* Resumo de um dia (tocar num dia da semana na tela Hoje): treino, refeições, rotina, atividades e peso. */
import { Icon } from '../components/ui.jsx';
import { state, todayKey, fmtDayLong, cap, br, finished, mealCheck, extrasKcal } from '../lib/core.js';
import { openSheet } from '../lib/ui.js';
import { openSession } from './treino.jsx';

export function openDay(k) { openSheet(() => <DaySheet k={k} />); }

function Linha({ titulo, valor, cor }) {
  return (
    <div className="row plain"><span className="body"><div className="t">{titulo}</div></span>
      <span className="end"><b className="num" style={cor ? { color: cor } : undefined}>{valor}</b></span></div>
  );
}

function DaySheet({ k }) {
  const log = state.dietLog[k] || { checked: {}, extras: [] };
  const sess = finished().filter((s) => todayKey(new Date(s.start)) === k);
  const acts = state.activities.filter((a) => a.date === k);
  const m = state.morning.find((x) => x.date === k);
  const meals = state.diet.groups, feitas = meals.filter((g) => mealCheck(log, g)).length;
  const rot = state.routines || [], rlog = (state.routineLog || {})[k] || {};
  const rFeitas = rot.filter((r) => rlog[r.id]).length;
  return (
    <>
      <h2>{cap(fmtDayLong(k))}</h2>
      <p className="lead">{k === todayKey() ? 'Hoje' : 'Resumo do dia'}</p>
      <div className="group">
        <Linha titulo="Treino" valor={sess.length ? sess.map((s) => s.workoutName).join(', ') : '—'} cor={sess.length ? 'var(--c-treino)' : ''} />
        {meals.length > 0 && <Linha titulo="Refeições" valor={`${feitas}/${meals.length}`} cor={feitas === meals.length ? 'var(--c-dieta)' : ''} />}
        {rot.length > 0 && <Linha titulo="Rotina" valor={`${rFeitas}/${rot.length}`} cor={rFeitas === rot.length ? 'var(--c-dieta)' : ''} />}
        <Linha titulo="Atividades" valor={acts.length ? acts.map((a) => a.tipo).join(', ') : '—'} />
        {m?.peso != null && <Linha titulo="Peso" valor={`${br(m.peso)} kg`} />}
        {log.extras.length > 0 && <Linha titulo="Fora do plano" valor={`${Math.round(extrasKcal(log))} kcal`} />}
      </div>
      {sess.length > 0 && (
        <>
          <div className="sub-head">Treinos</div>
          <div className="group">{sess.map((s) => (
            <button key={s.id} type="button" className="row plain" onClick={() => openSession(s.id)}>
              <span className="body"><div className="t">{s.workoutName}</div><div className="s">{Math.round((s.end - s.start) / 60000)} min · {s.exercises.reduce((n, e) => n + e.sets.length, 0)} séries</div></span>
              <span className="end"><Icon n="right" /></span></button>
          ))}</div>
        </>
      )}
    </>
  );
}
