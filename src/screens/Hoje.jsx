/* Tela Hoje: resumo do dia (anéis), treino, próxima refeição, atividade e a semana. */
import { useEffect, useRef } from 'react';
import { Head, Section, Icon, Rings, CountUp } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';
import {
  todayKey, fmtDay, fmtDayLong, cap, finished, nextWorkout, dayLog, estMinutes, mealCheck,
  nextMeal, greet, weekMonday, routinesOf, routineLog, extrasKcal, save,
} from '../lib/core.js';
import { go } from '../lib/ui.js';
import Illu from '../components/Illu.jsx';
import { celebrateDay } from '../lib/effects.js';
import { openWorkout, startWorkout, openSession } from '../sheets/treino.jsx';
import { openMeal, quickMeal } from '../sheets/dieta.jsx';
import { openActivity, openEditProfile } from '../sheets/perfil.jsx';
import { openDay } from '../sheets/hoje-dia.jsx';

const sessMin = (s) => Math.round((s.end - s.start) / 60000);
const sessSets = (s) => s.exercises.reduce((n, e) => n + e.sets.length, 0);

export default function Hoje() {
  const state = useStore();
  const ringsRef = useRef(null);
  const key = todayKey();
  state.ui.dietDay = undefined;
  const nw = nextWorkout();
  const doneToday = finished().filter((s) => todayKey(new Date(s.start)) === key);
  const meals = state.diet.groups;
  const log = dayLog(key);
  const mealsDone = meals.filter((x) => mealCheck(log, x)).length;
  const p = state.profile;
  const acts = state.activities.filter((a) => a.date === key);

  const vTreino = doneToday.length ? 1 : state.active ? 0.5 : 0;
  const vMeal = meals.length ? mealsDone / meals.length : 0;
  const rotList = routinesOf(key), rotLog = routineLog(key);
  const rotDone = rotList.filter((r) => rotLog[r.id]).length;
  const vRot = rotList.length ? rotDone / rotList.length : 0;
  /* o dia é treino + refeições + rotina (a rotina só conta se houver hábitos para hoje); o peso mora no Perfil */
  const parts = [vTreino, vMeal].concat(rotList.length ? [vRot] : []);
  const pct = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
  useEffect(() => { if (pct === 100) celebrateDay(() => ringsRef.current); }, [pct]);

  const summary = (
    <div className="section"><div className={`group today-card ${pct === 100 ? 'complete' : ''}`}>
      <Rings innerRef={ringsRef} items={[{ v: vTreino, color: 'var(--c-treino)' }, { v: vMeal, color: 'var(--c-dieta)' }, { v: vRot, color: 'var(--c-rotina)' }]} />
      <div style={{ flex: 1, minWidth: 0 }}><div className="cap">Seu dia</div>
        <div className="pct digits"><CountUp value={pct} k="pct-dia" /><small>%</small></div>
        <ul className="legend">
          <li><i style={{ background: 'var(--c-treino)' }} />Treino<b>{doneToday.length ? 'Feito' : state.active ? 'Agora' : '—'}</b></li>
          <li><i style={{ background: 'var(--c-dieta)' }} />Refeições<b className="num">{meals.length ? `${mealsDone}/${meals.length}` : '—'}</b></li>
          <li><i style={{ background: 'var(--c-rotina)' }} />Rotina<b className="num">{rotList.length ? `${rotDone}/${rotList.length}` : '—'}</b></li>
        </ul></div></div></div>
  );

  let workout;
  if (state.active) {
    const s = state.active, total = s.exercises.reduce((n, e) => n + e.sets.length, 0), done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
    workout = (
      <div className="hero-workout"><div className="kick">Treino em andamento</div><div className="name">{s.workoutName}</div>
        <div className="meta num">{done} de {total} séries</div><div className="letter">{s.workoutLetter || ''}</div>
        <button className="btn light" onClick={() => go('treino')}><Icon n="play" /> Continuar</button></div>
    );
  } else if (doneToday.length) {
    const s = doneToday[doneToday.length - 1];
    workout = (
      <div className="hero-workout done"><div className="kick">Treino de hoje feito</div><div className="name">{s.workoutName}</div>
        <div className="meta num" style={{ color: 'var(--ink-2)' }}>{sessMin(s)} min · {sessSets(s)} séries</div><div className="letter"><Icon n="check" /></div>
        <button className="btn soft" onClick={() => openSession(s.id)}>Ver resumo</button></div>
    );
  } else if (nw) {
    workout = (
      <div className="hero-workout"><div className="kick shine">Próximo treino</div><div className="name">{nw.name}</div>
        <div className="meta">{nw.exercises.length} exercícios · ~{estMinutes(nw)} min</div><div className="letter">{nw.letter}</div>
        <div className="row-btns" style={{ justifyContent: 'flex-start', gap: 10 }}>
          <button className="btn light glow" onClick={() => startWorkout(nw.id)}><Icon n="play" /> Começar</button>
          <button className="btn" style={{ background: 'rgba(255,255,255,.16)', color: '#fff', marginTop: 18 }} onClick={() => openWorkout(nw.id)}>Ver exercícios</button>
        </div></div>
    );
  } else {
    workout = (
      <button className="next-meal" onClick={() => go('treino')}><span className="body"><div className="k" style={{ color: 'var(--c-treino)' }}>Treino</div><div className="t">Monte seu plano</div></span><Icon n="right" /></button>
    );
  }

  let meal;
  if (!meals.length) {
    meal = (
      <button className="next-meal" onClick={() => go('dieta')}><span className="body"><div className="k">Alimentação</div><div className="t">Adicione seu plano</div><div className="s">Cole o texto da sua nutricionista</div></span><Icon n="right" /></button>
    );
  } else {
    const nm = nextMeal(log);
    meal = nm ? (
      <div className="next-meal" role="button" tabIndex={0} onClick={() => openMeal(nm.id)}
        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openMeal(nm.id); } }}>
        <span className="body"><div className="k">Próxima refeição{nm.time ? ` · ${nm.time}` : ''}</div><div className="t">{nm.name}</div>
          <div className="s">{(nm.options[0]?.foods || []).slice(0, 3).map((f) => f.name).join(', ')}</div></span>
        <button className="tick" aria-label={`Marcar ${nm.name} como feita`} onClick={(e) => { e.stopPropagation(); quickMeal(nm.id); }}><Icon n="check" /></button>
      </div>
    ) : (
      <button className="next-meal" onClick={() => go('dieta')}><span className="body"><div className="k">Alimentação</div><div className="t">Todas as refeições feitas</div>
        <div className="s">{extrasKcal(log) ? `${Math.round(extrasKcal(log))} kcal fora do plano` : 'Nada fora do plano hoje'}</div></span><Icon n="right" /></button>
    );
  }

  const minsAct = acts.reduce((t, a) => t + (a.minutos || 0), 0);
  const bento = (
    <div className="section bento one">
      <button className="tile ativ" onClick={() => openActivity()}><div className="top"><span className="lbl">Atividade</span><span className="badge ativ"><Icon n="pulse" /></span></div>
        {acts.length ? (<><div className="val digits">{minsAct || acts.length}<small>{minsAct ? 'min' : 'reg.'}</small></div><div className="sub">{acts.map((a) => a.tipo).join(', ')}</div></>)
          : (<><div className="cta"><Icon n="plus" /> Registrar</div><div className="sub">Caminhada, bike…</div></>)}</button>
    </div>
  );

  const incomplete = !p.nome || !p.altura;
  return (
    <>
      <Head kicker={cap(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))}
        title={greet() + (p.nome ? `, ${p.nome.split(' ')[0]}` : '')} />
      {incomplete && (
        <div className="section"><button className="row group" onClick={() => openEditProfile()}>
          <span className="badge accent"><Icon n="user" /></span>
          <span className="body"><div className="t">Complete seu perfil</div><div className="s">Nome, altura, peso e meta</div></span>
          <span className="end"><Icon n="right" /></span></button></div>
      )}
      {summary}
      {pct === 100 ? <div className="section"><div className="group day-party"><Illu nome="festa" cor="var(--c-rotina)" atraso={0.5} />
        <div><div className="t">Dia completo</div><div className="s">Treino, refeições e rotina em dia. Bom trabalho.</div></div></div></div> : null}
      <div className="section">{workout}</div>
      <div className="section">{meal}</div>
      {bento}
      <Section title="Esta semana"><WeekStrip /></Section>
    </>
  );
}

const NAMES = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
function WeekStrip() {
  const state = useStore();
  const off = state.ui.weekOff || 0;
  const monday = weekMonday(off), sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const trained = new Set(finished().map((s) => todayKey(new Date(s.start))));
  state.activities.forEach((a) => trained.add(a.date));
  const today = todayKey();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const k = todayKey(d), futuro = k > today;
    days.push(
      <button key={k} className="wd" disabled={futuro} aria-label={`Ver ${fmtDayLong(k)}`} onClick={() => openDay(k)}>
        <span className="d">{NAMES[i]}</span>
        <span className={`dot ${trained.has(k) ? 'on' : ''} ${k === today ? 'today' : ''}`}>{d.getDate()}</span></button>,
    );
  }
  const count = finished().filter((s) => { const t = new Date(s.start); return t >= monday && t < new Date(sunday.getTime() + 864e5); }).length;
  const label = off === 0 ? 'Esta semana' : `${fmtDay(todayKey(monday))} – ${fmtDay(todayKey(sunday))}`;
  /* o antigo só re-renderizava; aqui save() re-renderiza (weekOff já morava em state.ui e ia junto no próximo save) */
  const week = (v) => { state.ui.weekOff = Math.min(0, (state.ui.weekOff || 0) + v); save(); };
  return (
    <div className="group"><div className="week-nav">
      <button className="icon-btn" aria-label="Semana anterior" onClick={() => week(-1)}><Icon n="left" /></button>
      <b>{label}</b>
      <button className="icon-btn" aria-label="Próxima semana" disabled={off >= 0} style={off >= 0 ? { opacity: 0.3 } : undefined} onClick={() => week(1)}><Icon n="right" /></button>
    </div>
    <div className="week">{days}</div>
    <div className="pad" style={{ paddingTop: 0 }}><div className="hint">{count} de {state.profile.dias} treinos da semana</div>
      <div className="bar"><i style={{ width: `${Math.min(100, (count / state.profile.dias) * 100)}%`, background: 'var(--accent)' }} /></div></div></div>
  );
}
