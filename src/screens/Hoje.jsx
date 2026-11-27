/* Tela Hoje: resumo do dia (anéis), treino, próxima refeição, atividade e a semana. */
import { useEffect, useRef, useState } from 'react';
import { apkDesatualizado, baixarApk, dispensarAviso } from '../lib/versao.js';
import { sequencia, semanaDoResumo, resumoSemana } from '../lib/semana.js';
import { Head, Section, Icon, Rings, CountUp } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';
import {
  todayKey, br, fmtDay, fmtDayLong, cap, finished, nextWorkout, dayLog, estMinutes, mealCheck,
  nextMeal, greet, weekMonday, routinesOf, routineLog, extrasKcal, save,
  nomesSaudacao,
} from '../lib/core.js';
import { go } from '../lib/ui.js';
import Illu, { Anim } from '../components/Illu.jsx';
import { celebrateDay } from '../lib/effects.js';
import { openWorkout, startWorkout, openSession, continuarTreino } from '../sheets/treino.jsx';
import { openMeal, quickMeal } from '../sheets/dieta.jsx';
import { openActivity, openEditProfile } from '../sheets/perfil.jsx';
import { openDay } from '../sheets/hoje-dia.jsx';

const sessMin = (s) => Math.round((s.end - s.start) / 60000);
const sessSets = (s) => s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done !== false).length, 0);
const kgN = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
/* volume do treino (carga × repetições) e recordes: exercícios em que a maior carga passou a de todos os treinos anteriores */
function numerosDoTreino(s) {
  const carga = s.exercises.filter((e) => e.tipo === 'carga' || e.tipo == null);
  const volume = carga.reduce((t, e) => t + e.sets.filter((x) => x.done !== false).reduce((a, x) => a + kgN(x.kg) * kgN(x.reps), 0), 0);
  const antes = finished().filter((x) => x.id !== s.id && x.start < s.start);
  const recordes = carga.filter((e) => {
    const agora = Math.max(0, ...e.sets.map((x) => kgN(x.kg)));
    const melhor = Math.max(0, ...antes.flatMap((x) => x.exercises.filter((y) => y.name === e.name).flatMap((y) => y.sets.map((z) => kgN(z.kg)))));
    return agora > 0 && melhor > 0 && agora > melhor;
  }).map((e) => e.name);
  return { volume: Math.round(volume), recordes };
}

export default function Hoje() {
  const state = useStore();
  const ringsRef = useRef(null);
  const [apk, setApk] = useState(null);
  useEffect(() => { apkDesatualizado().then(setApk); }, []);
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

  const seq = sequencia();
  const summary = (
    <div className="section"><div className={`group today-card ${pct === 100 ? 'complete' : ''}`}>
      <Rings innerRef={ringsRef} items={[{ v: vTreino, color: 'var(--c-treino)' }, { v: vMeal, color: 'var(--c-dieta)' }, { v: vRot, color: 'var(--c-rotina)' }]} />
      <div style={{ flex: 1, minWidth: 0 }}><div className="cap">Seu dia</div>
        <div className="pct digits"><CountUp value={pct} k="pct-dia" /><small>%</small></div>
        <ul className="legend">
          <li><i style={{ background: 'var(--c-treino)' }} />Treino<b>{doneToday.length ? 'Feito' : state.active ? 'Agora' : '—'}</b></li>
          <li><i style={{ background: 'var(--c-dieta)' }} />Refeições<b className="num">{meals.length ? `${mealsDone}/${meals.length}` : '—'}</b></li>
          <li><i style={{ background: 'var(--c-rotina)' }} />Rotina<b className="num">{rotList.length ? `${rotDone}/${rotList.length}` : '—'}</b></li>
        </ul></div></div>
      {seq.dias >= 2 ? (
        <div className="seq-linha"><Anim nome="fogo" tamanho={22} /><b className="num">{seq.dias} dias seguidos</b>
          <span>{seq.folgaEstaSemana ? 'folga da semana já usada' : '1 dia de folga livre nesta semana'}</span></div>
      ) : null}
    </div>
  );

  /* resumo da semana (domingo e segunda), até fechar */
  const diasResumo = semanaDoResumo();
  const rs0 = diasResumo && state.ui.resumoVisto !== diasResumo[0] ? resumoSemana(diasResumo) : null;
  /* semana sem nada registrado: não mostra um resumo zerado */
  const rs = rs0 && (rs0.treinos || rs0.refPct || rs0.agua || rs0.passos || rs0.sono || rs0.dPeso != null) ? rs0 : null;
  const fmtH = (m) => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
  const resumo = rs ? (
    <div className="section"><div className="group pad resumo-semana">
      <div className="row-between"><div className="t">Resumo da semana</div>
        <button type="button" className="text-btn" onClick={() => { state.ui.resumoVisto = diasResumo[0]; save(); }}>Fechar</button></div>
      <div className="s">{fmtDay(diasResumo[0])} a {fmtDay(diasResumo[6])}</div>
      <div className="rs-grade">
        <div><b className="num">{rs.treinos}</b><span>{rs.treinos === 1 ? 'treino' : 'treinos'}</span></div>
        {rs.refPct != null ? <div><b className="num">{rs.refPct}%</b><span>das refeições</span></div> : null}
        {rs.agua ? <div><b className="num">{br(rs.agua / 1000, 1)} L</b><span>água por dia</span></div> : null}
        {rs.passos ? <div><b className="num">{Math.round(rs.passos).toLocaleString('pt-BR')}</b><span>passos por dia</span></div> : null}
        {rs.sono ? <div><b className="num">{fmtH(rs.sono)}</b><span>de sono por noite</span></div> : null}
        {rs.dPeso != null ? <div><b className="num">{rs.dPeso > 0 ? '+' : ''}{br(rs.dPeso, 1)} kg</b><span>no peso</span></div> : null}
      </div>
    </div></div>
  ) : null;

  let workout;
  if (state.active) {
    const s = state.active, total = s.exercises.reduce((n, e) => n + e.sets.length, 0), done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
    workout = (
      <div className="hero-workout"><div className="kick">Treino em andamento</div><div className="name">{s.workoutName}</div>
        <div className="meta num">{done} de {total} séries</div><div className="letter">{s.workoutLetter || ''}</div>
        <button className="btn light" onClick={continuarTreino}><Icon n="play" /> Continuar</button></div>
    );
  } else if (doneToday.length) {
    const s = doneToday.reduce((a, b) => (b.start > a.start ? b : a));
    const feito = numerosDoTreino(s);
    workout = (
      <div className="hero-workout done"><div className="kick">Treino de hoje feito</div><div className="name">{s.workoutName}</div>
        <div className="letter trophy"><Anim nome="trofeu" tamanho={64} /></div>
        <div className="feito-nums num">
          <div><b>{sessMin(s)}</b><span>min</span></div>
          <div><b>{sessSets(s)}</b><span>séries</span></div>
          {feito.volume ? <div><b>{feito.volume >= 1000 ? br(feito.volume / 1000, 1) : feito.volume}</b><span>{feito.volume >= 1000 ? 't levantadas' : 'kg levantados'}</span></div> : null}
        </div>
        {feito.recordes.length ? <div className="feito-pr">🏅 {feito.recordes.length === 1 ? `Recorde em ${feito.recordes[0]}` : `${feito.recordes.length} recordes: ${feito.recordes.join(', ')}`}</div> : null}
        <button className="btn soft" onClick={() => openSession(s.id)}>Ver resumo</button></div>
    );
  } else if (nw) {
    workout = (
      <div className="hero-workout"><div className="kick shine">Próximo treino</div><div className="name">{nw.name}</div>
        <div className="meta">{nw.exercises.length} {nw.exercises.length === 1 ? 'exercício' : 'exercícios'} · ~{estMinutes(nw)} min</div><div className="letter">{nw.letter}</div>
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
  /* pulseira: passos de hoje e sono da noite passada */
  const sd = state.saude?.conectado ? state.saude : null;
  const passos = sd?.dias?.[key]?.passos, sono = sd?.sono?.[key];
  const fmtSono = (m) => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
  const bento = (
    <div className={`section bento ${sd ? 'com-pulseira' : 'one'}`}>
      {sd ? (
        <>
          <div className="tile passos"><div className="top"><span className="lbl">Passos</span><span className="badge passos">👟</span></div>
            <div className="val digits">{passos != null ? passos.toLocaleString('pt-BR') : '—'}</div>
            <div className="sub">{sd.dias?.[key]?.kcal ? `${sd.dias[key].kcal} kcal ativas` : 'da pulseira'}</div></div>
          <div className="tile sono"><div className="top"><span className="lbl">Sono</span><span className="badge sono">🌙</span></div>
            <div className="val digits">{sono ? fmtSono(sono) : '—'}</div>
            <div className="sub">{sono ? 'noite passada' : 'sem registro'}</div></div>
        </>
      ) : null}
      <button className="tile ativ" onClick={() => openActivity()}><div className="top"><span className="lbl">Atividade</span><span className="badge ativ"><Icon n="pulse" /></span></div>
        {acts.length ? (<><div className="val digits">{minsAct || acts.length}<small>{minsAct ? 'min' : 'reg.'}</small></div><div className="sub">{acts.length === 1 ? [acts[0].tipo, acts[0].km ? `${br(acts[0].km, 1)} km` : '', acts[0].kcal ? `${Math.round(acts[0].kcal)} kcal` : ''].filter(Boolean).join(' · ') : acts.map((a) => a.tipo).join(', ')}</div></>)
          : (<><div className="cta"><Icon n="plus" /> Registrar</div><div className="sub">Caminhada, bike…</div></>)}</button>
    </div>
  );

  const incomplete = !p.nome || !p.altura;
  return (
    <>
      <Head emoji={new Date().getHours() < 12 ? 'manha' : new Date().getHours() < 18 ? 'tarde' : 'noite'} kicker={cap(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))}
        title={greet()} titulos={p.nome ? nomesSaudacao(p.nome).map((n) => `${greet()}, ${n}`) : null} />
      {apk ? (
        <div className="section"><div className="group pad aviso-apk">
          <div className="t">Nova versão do app</div>
          <p className="hint">Tem melhorias nos lembretes ou na pulseira. Baixe e instale por cima: nada se perde.</p>
          <div className="row-btns" style={{ justifyContent: 'flex-start', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn" onClick={baixarApk}>Baixar</button>
            <button type="button" className="btn soft" onClick={() => { dispensarAviso(apk.minimo); setApk(null); }}>Agora não</button>
          </div></div></div>
      ) : null}
      {incomplete && (
        <div className="section"><button className="row group" onClick={() => openEditProfile()}>
          <span className="badge accent"><Icon n="user" /></span>
          <span className="body"><div className="t">Complete seu perfil</div><div className="s">Nome, altura, peso e meta</div></span>
          <span className="end"><Icon n="right" /></span></button></div>
      )}
      {resumo}
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
