/* Tela de treino focada: um exercício por vez.
   Em cima a demonstração do exercício; embaixo carga e repetições da série atual;
   "Pausa" registra a série e conta o descanso (1:30); "Próximo" vai para o próximo exercício.
   Usa o mesmo treino em andamento (state.active) da lista de séries, então histórico e progresso continuam iguais. */
import { useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { state, save, br, num, fmtClock, lastPerformance } from '../lib/core.js';
import { useTick } from '../lib/hooks.js';
import { buzz } from '../lib/effects.js';
import { startTimer, stopTimer, addTimer, subscribeTimer, getTimer } from '../lib/timer.js';
import { demoDe } from '../lib/exercicios.js';
import { Icon } from '../components/ui.jsx';
import { soDecimal, soInteiro, repsTexto } from '../lib/campos.js';
import { Anim } from '../components/Illu.jsx';
import { finishWorkout, sairDoTreino } from '../sheets/treino.jsx';

export const DESCANSO = 90; // 1 minuto e meio entre as séries

/* repetições da série: "15-12-10-8-8" muda a cada série; "8-12" ou "8 a 12" usa o primeiro número */
const metaReps = (e, si = 0) => {
  const n = String(e.reps ?? '').match(/\d+/g) || [];
  return n.length >= 3 ? n[Math.min(si, n.length - 1)] : (n[0] || '');
};
const fmt = (v) => (v === '' || v == null ? '' : br(num(v)));

/* valores que aparecem na série atual: o que foi digitado, senão a série anterior, senão a última vez */
function sugestao(e, si) {
  const st = e.sets[si], pv = lastPerformance(e.name)?.sets[si], ant = e.sets[si - 1];
  return {
    kg: st.kg !== '' ? st.kg : (ant?.kg || pv?.kg || ''),
    reps: st.reps !== '' ? st.reps : (pv?.reps || (e.tipo === 'carga' ? (metaReps(e, si) || ant?.reps) : '')),
  };
}

function Relogio({ start }) {
  useTick(1000, true);
  return <>{fmtClock((Date.now() - start) / 1000)}</>;
}

function Stepper({ label, unit, value, step, onChange, placeholder, inteiro }) {
  const n = num(value);
  const mudar = (d) => onChange(String(Math.max(0, Math.round(((n || 0) + d) * 100) / 100)).replace('.', ','));
  return (
    <div className="pl-step">
      <div className="pl-step-l">{label}</div>
      <div className="pl-step-row">
        <button type="button" className="pl-step-b" onClick={() => mudar(-step)} aria-label={`Diminuir ${label}`}>−</button>
        <label className="pl-step-v">
          <input inputMode="decimal" value={value === '' ? '' : String(value).replace('.', ',')} placeholder={placeholder || '0'}
            style={{ width: `${Math.max(1, String(value === '' ? (placeholder || '0') : value).length) + 0.4}ch` }}
            onFocus={(ev) => ev.target.select()}  /* tocar seleciona o número: o que digitar substitui */
            onChange={(ev) => onChange(inteiro ? soInteiro(ev.target.value, 3) : soDecimal(ev.target.value, 2, 4))} aria-label={label} />
          {unit ? <span>{unit}</span> : null}
        </label>
        <button type="button" className="pl-step-b" onClick={() => mudar(step)} aria-label={`Aumentar ${label}`}>+</button>
      </div>
    </div>
  );
}

function Descanso() {
  const t = useSyncExternalStore(subscribeTimer, getTimer);
  useTick(250, !!t.end);
  const left = t.end ? (t.end - Date.now()) / 1000 : 0;
  const frac = t.total ? Math.max(0, Math.min(1, left / t.total)) : 0;
  const R = 54, C = 2 * Math.PI * R;
  return (
    <div className={`pl-rest ${left <= 0 ? 'over' : ''}`}>
      <div className="pl-rest-ring">
        <svg viewBox="0 0 128 128" aria-hidden="true"><circle className="track" cx="64" cy="64" r={R} />
          <circle className="val" cx="64" cy="64" r={R} strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - frac)).toFixed(1)} /></svg>
        <div className="txt"><small>{left <= 0 ? 'Bora!' : 'Descanso'}</small><b className="num">{(left < 0 ? '+' : '') + fmtClock(left)}</b></div>
      </div>
      <div className="pl-rest-next">{t.next}</div>
      <div className="pl-rest-btns">
        <button type="button" className="tbtn" onClick={() => addTimer(-15)}>−15</button>
        <button type="button" className="tbtn" onClick={() => addTimer(15)}>+15</button>
        <button type="button" className="tbtn go" onClick={stopTimer}>Pular</button>
      </div>
    </div>
  );
}

export default function TreinoFoco({ s, onLista }) {
  const timer = useSyncExternalStore(subscribeTimer, getTimer);
  const descansando = !!timer.end;
  useEffect(() => { document.body.classList.add('foco-on'); return () => document.body.classList.remove('foco-on'); }, []);

  const total = s.exercises.length;
  const ei = Math.min(s.foco ?? 0, total - 1);
  const e = s.exercises[ei];
  if (!e) return null;
  const si = e.sets.findIndex((x) => !x.done);
  const completo = si === -1;
  const atual = completo ? e.sets.length - 1 : si;
  const val = sugestao(e, Math.max(0, atual));
  const pv = lastPerformance(e.name);
  const ultimo = ei === total - 1;
  const demo = demoDe(e.name, e.demo);
  const carga = e.tipo === 'carga', cardio = e.tipo === 'cardio';
  const feitas = s.exercises.reduce((n, x) => n + x.sets.filter((y) => y.done).length, 0);
  const todas = s.exercises.reduce((n, x) => n + x.sets.length, 0);

  const setVal = (campo, v) => { if (completo) return; e.sets[si][campo] = v; save(); };
  const registra = () => {
    if (completo) return false;
    const st = e.sets[si];
    st.kg = val.kg; st.reps = val.reps; st.done = true;
    buzz(15);
    return true;
  };
  const irPara = (i) => { s.foco = Math.max(0, Math.min(total - 1, i)); save(); };

  const pausa = () => {
    if (!registra()) return;
    const resta = e.sets.findIndex((x) => !x.done);
    const prox = resta !== -1 ? `Próximo: ${e.name} · série ${resta + 1}` : (ultimo ? 'Última série feita! Finalize o treino.' : `Próximo exercício: ${s.exercises[ei + 1].name}`);
    save();
    startTimer(DESCANSO, prox);
  };
  const proximo = () => {
    registra();
    stopTimer();
    if (ultimo) { save(); finishWorkout(); return; }
    s.foco = ei + 1; save();
  };
  const pular = () => { stopTimer(); if (ultimo) { finishWorkout(); return; } irPara(ei + 1); };

  return (
    <div className="foco">
      <div className="pl-top">
        <button type="button" className="icon-btn" onClick={sairDoTreino} aria-label="Sair sem concluir (fica salvo)"><Icon n="left" /></button>
        <div className="pl-tit"><b>{s.workoutLetter ? `${s.workoutLetter} · ` : ''}{s.workoutName}</b>
          <span className="num"><Relogio start={s.start} /> · {feitas} de {todas} séries</span></div>
        <button type="button" className="text-btn" onClick={onLista}>Lista</button>
      </div>
      <div className="pl-prog" role="tablist" aria-label="Exercícios">
        {s.exercises.map((x, i) => {
          const ok = x.sets.length && x.sets.every((y) => y.done);
          return <button key={i} type="button" role="tab" aria-selected={i === ei} aria-label={`Exercício ${i + 1}: ${x.name}`}
            className={`${i === ei ? 'on' : ''} ${ok ? 'ok' : ''}`} onClick={() => irPara(i)} />;
        })}
      </div>

      <div className="pl-media">
        {descansando ? <Descanso /> : (
          <AnimatePresence mode="wait">
            <motion.div key={ei} className="pl-demo" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
              {demo?.src ? <img src={demo.src} alt={`Demonstração: ${e.name}`} />
                : demo?.frames ? <div className="pl-frames" role="img" aria-label={`Demonstração: ${e.name}`}>
                  {demo.frames.map((f, i) => <img key={f} src={f} alt="" loading="eager" decoding="async" className={`f${i}`} />)}</div>
                : <div className="pl-sem-demo"><Anim nome="login" tamanho={120} /></div>}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="pl-info">
        <div className="pl-count">Exercício {ei + 1} de {total}</div>
        <h2 className="pl-nome">{e.name}</h2>
        <div className="pl-meta">
          {completo ? <span className="pl-ok"><Icon n="check" /> Exercício concluído</span>
            : <>Série <b>{si + 1}</b> de {e.sets.length} · meta {repsTexto(e)}</>}
          {(() => { const u = pv?.sets?.[atual] || pv?.sets?.[pv.sets.length - 1]; return u && carga && !completo ? <span className="pl-last"> · última vez {fmt(u.kg) || '—'} kg × {u.reps || '—'}</span> : null; })()}
        </div>
        <div className="pl-sets" aria-hidden="true">{e.sets.map((x, i) => <i key={i} className={`${x.done ? 'done' : ''} ${i === si ? 'cur' : ''}`} />)}</div>
        {e.notes ? <p className="pl-note">{e.notes}</p> : null}
      </div>

      {!completo ? (
        <div className="pl-fields">
          {carga ? <>
            <Stepper label="Carga" unit="kg" step={2.5} value={val.kg} placeholder={pv?.sets?.[atual]?.kg || '0'} onChange={(v) => setVal('kg', v)} />
            <Stepper label="Repetições" inteiro step={1} value={val.reps} placeholder={metaReps(e, atual) || '0'} onChange={(v) => setVal('reps', v)} />
          </> : cardio ? <>
            <Stepper label="Tempo" unit="min" inteiro step={1} value={val.kg} placeholder={metaReps(e) || '0'} onChange={(v) => setVal('kg', v)} />
            <Stepper label="Distância" unit="km" step={0.5} value={val.reps} onChange={(v) => setVal('reps', v)} />
          </> : (
            <Stepper label="Tempo" unit="seg" inteiro step={5} value={val.kg} placeholder={metaReps(e) || '30'} onChange={(v) => setVal('kg', v)} />
          )}
        </div>
      ) : null}

      <div className="pl-btns">
        {!cardio && !completo ? (
          <button type="button" className="btn soft" onClick={pausa} disabled={descansando}>
            <Icon n="pause" /> Pausa <span className="num">{fmtClock(DESCANSO)}</span></button>
        ) : null}
        <button type="button" className={`btn ${completo || cardio ? 'block' : ''}`} onClick={proximo}>
          {ultimo ? <>Finalizar treino <Icon n="check" /></> : <>Próximo <Icon n="right" /></>}</button>
      </div>
      {!completo && !ultimo ? <button type="button" className="text-btn pl-pular" onClick={pular}>Pular este exercício</button> : null}
    </div>
  );
}
