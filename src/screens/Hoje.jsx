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
  iconeRefeicao,
} from '../lib/core.js';
import { go, openSheet } from '../lib/ui.js';
import Comemoracao from '../components/Comemoracao.jsx';
import Illu, { Anim } from '../components/Illu.jsx';
import { celebrateDay, spark, cssVar, reducedMotion } from '../lib/effects.js';
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
  useEffect(() => {
    const MARCOS = [3, 7, 14, 30, 50, 100, 150, 200, 300, 365, 500];
    const marco = [...MARCOS].reverse().find((m) => seq.dias >= m);
    if (!marco || (state.ui.marcoSeq || 0) >= marco) return;
    state.ui.marcoSeq = marco; save();
    const frase = marco >= 100 ? 'Isso é constância de verdade.' : marco >= 30 ? 'Um mês inteiro cuidando de você.' : marco >= 7 ? 'Uma semana inteira. Continua assim!' : 'Bom começo. Amanhã tem mais.';
    setTimeout(() => openSheet(() => <Comemoracao anim="fogo" titulo={`${marco} dias seguidos!`} texto={frase}
      numeros={[{ valor: seq.dias, rotulo: 'dias na sequência' }]} botao="Bora!" />), 600);
  }, [seq.dias]); // eslint-disable-line react-hooks/exhaustive-deps
  const summary = (
    <div className="section"><div className={`today-card plano ${pct === 100 ? 'complete' : ''}`}>
      <Rings innerRef={ringsRef} items={[{ v: vTreino, color: 'var(--c-treino)' }, { v: vMeal, color: 'var(--c-dieta)' }, { v: vRot, color: 'var(--c-rotina)' }]} />
      <div style={{ flex: 1, minWidth: 0 }}><div className="cap">Seu dia</div>
        <div className="pct digits"><CountUp value={pct} k="pct-dia" /><small>%</small></div>
        <ul className="legend">
          <li><i style={{ background: 'var(--c-treino)' }} />Treino<b>{doneToday.length ? 'Feito' : state.active ? 'Agora' : '—'}</b></li>
          <li><i style={{ background: 'var(--c-dieta)' }} />Refeições<b className="num">{meals.length ? `${mealsDone}/${meals.length}` : '—'}</b></li>
          <li><i style={{ background: 'var(--c-rotina)' }} />Rotina<b className="num">{rotList.length ? `${rotDone}/${rotList.length}` : '—'}</b></li>
        </ul></div></div>
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
        <button className="btn gordo block" onClick={continuarTreino}><Icon n="play" /> Continuar treino</button></div>
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
      <div className="hero-workout"><button type="button" className="hw-abre" onClick={() => openWorkout(nw.id)} aria-label={`Ver exercícios do ${nw.name}`}>
        <div className="kick">Próximo treino</div><div className="name">{nw.name}</div>
        <div className="meta">{nw.exercises.length} {nw.exercises.length === 1 ? 'exercício' : 'exercícios'} · ~{estMinutes(nw)} min</div></button>
        <div className="letter">{nw.letter}</div>
        <button className="btn gordo block" onClick={() => startWorkout(nw.id)}><Icon n="play" /> Começar treino</button></div>
    );
  } else {
    workout = (
      <button className="next-meal" onClick={() => go('treino')}><span className="body"><div className="k" style={{ color: 'var(--c-treino)' }}>Treino</div><div className="t">Monte seu plano</div></span><Icon n="right" /></button>
    );
  }

  const minsAct = acts.reduce((t, a) => t + (a.minutos || 0), 0);
  /* pulseira: passos de hoje e sono da noite passada */
  const sd = state.saude?.conectado ? state.saude : null;
  const passos = sd?.dias?.[key]?.passos, sono = sd?.sono?.[key];
  const fmtSono = (m) => `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
  const nm = meals.length ? nextMeal(log) : null;
  const marcar = (e, id) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    quickMeal(id);
    if (!reducedMotion()) spark(r.left + r.width / 2, r.top + r.height / 2, [cssVar('--c-dieta'), cssVar('--accent'), '#ffd23f'], 12, 30);
  };
  const lista = (
    <div className="section"><div className="group lista-dia">
      {!meals.length ? (
        <button className="row plain" onClick={() => go('dieta')}><span className="ld-ic dieta"><Icon n="meal" /></span>
          <span className="body"><div className="t">Adicione seu plano</div><div className="s">Cole o texto da sua nutricionista</div></span><span className="end"><Icon n="right" /></span></button>
      ) : nm ? (
        <div className="row plain" role="button" tabIndex={0} onClick={() => openMeal(nm.id)}
          onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openMeal(nm.id); } }}>
          <span className="ld-ic dieta"><Icon n={iconeRefeicao(nm.name)} /></span>
          <span className="body"><div className="s">Próxima refeição{nm.time ? ` · ${nm.time}` : ''}</div><div className="t">{nm.name}</div></span>
          <button className="tick" aria-label={`Marcar ${nm.name} como feita`} onClick={(e) => marcar(e, nm.id)}><Icon n="check" /></button>
        </div>
      ) : (
        <button className="row plain" onClick={() => go('dieta')}><span className="ld-ic dieta"><Icon n="check" /></span>
          <span className="body"><div className="t">Refeições do dia feitas</div>
            <div className="s">{extrasKcal(log) ? `${Math.round(extrasKcal(log))} kcal fora do plano` : 'Nada fora do plano hoje'}</div></span><span className="end"><Icon n="right" /></span></button>
      )}
      <button className="row plain" onClick={() => openActivity()}><span className="ld-ic ativ"><Icon n="pulse" /></span>
        <span className="body"><div className="t">Atividade</div>
          <div className="s">{acts.length ? (acts.length === 1 ? [acts[0].tipo, acts[0].km ? `${br(acts[0].km, 1)} km` : '', acts[0].kcal ? `${Math.round(acts[0].kcal)} kcal` : ''].filter(Boolean).join(' · ') : acts.map((a) => a.tipo).join(', ')) : 'Caminhada, corrida, bike…'}</div></span>
        <span className="end ld-val">{acts.length ? <><b className="num">{minsAct || acts.length}</b><small>{minsAct ? 'min' : 'reg.'}</small></> : <span className="ld-add"><Icon n="plus" /> Registrar</span>}</span></button>
      {sd ? (
        <>
          <div className="row plain"><span className="ld-ic passos">👟</span>
            <span className="body"><div className="t">Passos</div><div className="s">{sd.dias?.[key]?.kcal ? `${sd.dias[key].kcal} kcal ativas` : 'da pulseira'}</div></span>
            <span className="end ld-val"><b className="num">{passos != null ? passos.toLocaleString('pt-BR') : '—'}</b></span></div>
          <div className="row plain"><span className="ld-ic sono">🌙</span>
            <span className="body"><div className="t">Sono</div><div className="s">{sono ? 'noite passada' : 'sem registro'}</div></span>
            <span className="end ld-val"><b className="num">{sono ? fmtSono(sono) : '—'}</b></span></div>
        </>
      ) : null}
    </div></div>
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
      <Semana seq={seq} />
      {resumo}
      {pct === 100 ? <div className="section"><div className="group day-party"><Illu nome="festa" cor="var(--c-rotina)" atraso={0.5} />
        <div><div className="t">Dia completo</div><div className="s">Treino, refeições e rotina em dia. Bom trabalho.</div></div></div></div> : null}
      <div className="section">{workout}</div>
      {summary}
      {lista}
    </>
  );
}

const NAMES = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
/* a semana numa tira: ✓ nos dias com treino ou atividade; a sequência (com o dia de folga) ao lado */
function Semana({ seq }) {
  const state = useStore();
  const monday = weekMonday(0), fimSemana = new Date(monday); fimSemana.setDate(monday.getDate() + 7);
  const feitos = new Set(finished().map((s) => todayKey(new Date(s.start))));
  state.activities.forEach((a) => feitos.add(a.date));
  const hoje = todayKey(), meta = state.profile.dias || 3;
  const count = finished().filter((s) => { const t = new Date(s.start); return t >= monday && t < fimSemana; }).length;
  return (
    <div className="section semana-tira">
      <div className="st-top">
        <span className="st-meta">{count >= meta ? <><b>Meta da semana batida</b> · {count} {count === 1 ? 'treino' : 'treinos'}</> : <><b className="num">{count} de {meta}</b> treinos na semana</>}</span>
        {seq.dias >= 2 ? <span className="st-fogo" title={`${seq.dias} dias seguidos`}><Anim nome="fogo" tamanho={20} /><b className="num">{seq.dias}</b></span> : null}
      </div>
      <div className="st-dias">
        {NAMES.map((l, i) => {
          const d = new Date(monday); d.setDate(monday.getDate() + i);
          const k = todayKey(d), futuro = k > hoje, ok = feitos.has(k);
          return (
            <button key={k} type="button" className={`sd ${ok ? 'on' : ''} ${k === hoje ? 'hoje' : ''}`} disabled={futuro} onClick={() => openDay(k)}
              aria-label={`${fmtDayLong(k)}${ok ? ': treinou' : ''}`}>
              <span className="l">{l}</span><span className="c">{ok ? <Icon n="check" /> : <span className="num">{d.getDate()}</span>}</span></button>
          );
        })}
      </div>
      {seq.dias >= 2 && seq.folgaEstaSemana ? <p className="st-folga">Você usou a folga da semana. A sequência continua.</p> : null}
    </div>
  );
}
