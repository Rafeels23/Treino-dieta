/* Folhas e ações da área Treino. Contrato usado por outras telas:
   openWorkout(id), startWorkout(id), openSession(id), openPlanSettings(). */
import { useEffect, useRef, useState } from 'react';
import {
  state, save, uid, todayKey, fmtDayLong, cap, num, LEVEL_LABEL, generatePlan, estMinutes, nextWorkout,
} from '../lib/core.js';
import { go, openSheet, closeSheet } from '../lib/ui.js';
import { stopTimer, keepAwake } from '../lib/timer.js';
import { Icon, Seg, SheetActions } from '../components/ui.jsx';

/* ----- folha de um treino do plano (A.workout) ----- */
function WorkoutSheet({ id }) {
  const w = state.plan.workouts.find((x) => x.id === id);
  if (!w) return null;
  return (
    <>
      <h2>{w.letter} · {w.name}</h2>
      <p className="lead">{w.exercises.length} exercícios · ~{estMinutes(w)} min</p>
      <div className="group" style={{ background: 'var(--surface-2)' }}>
        {w.exercises.map((e, i) => (
          <div key={e.id || i} className="row plain" style={{ minHeight: 52 }}>
            <span className="body"><div className="t" style={{ fontWeight: 500 }}>{e.name}</div></span>
            <span className="end num">{e.sets} × {e.reps}</span>
          </div>
        ))}
      </div>
      <div className="sheet-actions">
        <button className="btn soft" type="button" onClick={() => editWorkout(w.id)}>Editar</button>
        <button className="btn" type="button" onClick={() => startWorkout(w.id)} disabled={!!state.active}><Icon n="play" /> Começar</button>
      </div>
    </>
  );
}
export function openWorkout(id) {
  if (!state.plan.workouts.find((x) => x.id === id)) return;
  openSheet(() => <WorkoutSheet id={id} />);
}

/* ----- começar (A.start) ----- */
export function startWorkout(id) {
  const w = state.plan.workouts.find((x) => x.id === id);
  if (!w || state.active) return;
  closeSheet();
  state.active = {
    id: uid(), workoutId: w.id, workoutLetter: w.letter, workoutName: w.name, start: Date.now(),
    exercises: w.exercises.map((e) => ({ name: e.name, tipo: e.tipo, reps: e.reps, rest: e.rest, notes: e.notes, demo: e.demo,
      sets: Array.from({ length: e.sets }, () => ({ kg: '', reps: '', done: false })) })),
    foco: 0,
  };
  state.ui.treinoLista = false; // abre na tela de um exercício por vez
  save(); keepAwake(true); go('treino');
}

/* ----- concluir (A.finish) ----- */
function FinishSheet({ s, done, vol, next }) {
  return (
    <>
      <h2>Treino concluído</h2><p className="lead">{s.workoutName}</p>
      <div className="two">
        <div className="group pad" style={{ background: 'var(--surface-2)' }}><div className="hint">Duração</div>
          <div className="big num" style={{ fontSize: 28, fontWeight: 700 }}>{Math.round((s.end - s.start) / 60000)} min</div></div>
        <div className="group pad" style={{ background: 'var(--surface-2)' }}><div className="hint">Séries</div>
          <div className="num" style={{ fontSize: 28, fontWeight: 700 }}>{done}</div></div>
      </div>
      {vol ? <p className="hint" style={{ marginTop: 12 }}>Volume total: <b className="num">{Math.round(vol).toLocaleString('pt-BR')} kg</b></p> : null}
      <p className="hint" style={{ marginTop: 6 }}>Próximo: <b>{next}</b></p>
      <div className="stack-btns"><button type="button" className="btn block" onClick={closeSheet}>Fechar</button></div>
    </>
  );
}
export function finishWorkout() {
  const s = state.active;
  if (!s) return;
  const done = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  if (!done && !confirm('Nenhuma série marcada. Concluir mesmo assim?')) return;
  s.end = Date.now();
  s.exercises = s.exercises.filter((e) => e.sets.some((x) => x.done)).map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }));
  state.sessions.push(s); state.active = null;
  stopTimer(); keepAwake(false); save();
  const vol = s.exercises.reduce((n, e) => n + e.sets.reduce((a, x) => a + (num(x.kg) || 0) * (num(x.reps) || 0), 0), 0);
  const next = nextWorkout()?.name || '';
  openSheet(() => <FinishSheet s={s} done={done} vol={vol} next={next} />);
}

/* ----- descartar (A['cancel-workout']) ----- */
export function cancelWorkout() {
  if (!confirm('Descartar este treino? O que foi preenchido será perdido.')) return;
  state.active = null; stopTimer(); keepAwake(false); save();
}

/* ----- histórico de um treino (A.session / A['del-session']) ----- */
function SessionSheet({ id }) {
  const s = state.sessions.find((x) => x.id === id);
  if (!s) return null;
  return (
    <>
      <h2>{s.workoutName}</h2>
      <p className="lead">{cap(fmtDayLong(todayKey(new Date(s.start))))} · {Math.round((s.end - s.start) / 60000)} min</p>
      <div className="group" style={{ background: 'var(--surface-2)' }}>
        {s.exercises.map((e, i) => (
          <div key={i} className="row plain" style={{ minHeight: 52 }}>
            <span className="body"><div className="t" style={{ fontWeight: 500 }}>{e.name}</div>
              <div className="s num">{e.sets.map((x) => (e.tipo === 'carga' ? `${x.kg || 0} kg × ${x.reps || 0}` : `${x.kg || '—'}`)).join(' · ')}</div></span>
          </div>
        ))}
      </div>
      <div className="sheet-actions">
        <button className="btn danger" type="button" onClick={() => deleteSession(s.id)}>Apagar</button>
        <button className="btn soft" type="button" onClick={closeSheet}>Fechar</button>
      </div>
    </>
  );
}
export function openSession(id) {
  if (!state.sessions.find((x) => x.id === id)) return;
  openSheet(() => <SessionSheet id={id} />);
}
export function deleteSession(id) {
  if (!confirm('Apagar este treino do histórico?')) return;
  state.sessions = state.sessions.filter((s) => s.id !== id);
  closeSheet(); save();
}

/* ----- ajustar plano (A.plan) ----- */
function PlanSheet() {
  const p = state.profile;
  const custom = state.plan.source === 'personalizado';
  const [dias, setDias] = useState(p.dias);
  const [nivel, setNivel] = useState(p.nivel);
  const [regen, setRegen] = useState(!custom);
  const ok = () => {
    p.dias = Number(dias); p.nivel = nivel;
    if (regen) state.plan = generatePlan(p);
    save(); closeSheet();
  };
  return (
    <>
      <h2>Ajustar plano</h2><p className="lead">Objetivo: emagrecimento. Outros objetivos chegam com a IA.</p>
      <div className="field"><label>Dias por semana</label><Seg options={[2, 3, 4, 5, 6].map((d) => [d, d])} value={dias} onChange={setDias} /></div>
      <div className="field"><label>Nível</label><Seg options={Object.entries(LEVEL_LABEL)} value={nivel} onChange={setNivel} /></div>
      <label className="check-line"><input type="checkbox" checked={regen} onChange={(e) => setRegen(e.target.checked)} /> Gerar um plano novo com essas opções</label>
      {custom && <p className="hint">Atenção: gerar um plano novo substitui as suas edições.</p>}
      <SheetActions onCancel={closeSheet} onOk={ok} />
    </>
  );
}
export function openPlanSettings() { openSheet(() => <PlanSheet />); }

/* ----- editor de treino (exEditor / openEditor) ----- */
const TIPOS = [['carga', 'Carga'], ['tempo', 'Tempo'], ['cardio', 'Cardio']];
const toDraft = (e) => ({ id: e.id || uid(), name: e.name ?? '', sets: String(e.sets ?? ''), reps: String(e.reps ?? ''),
  rest: String(e.rest ?? ''), tipo: e.tipo || 'carga', notes: e.notes ?? '', demo: e.demo || '', nome0: e.name ?? '' });

function ExEditor({ e, onChange, onDelete, nameRef }) {
  const f = (k) => ({ value: e[k], onChange: (ev) => onChange({ ...e, [k]: ev.target.value }) });
  return (
    <div className="ed-ex">
      <div className="top"><input ref={nameRef} {...f('name')} placeholder="Nome do exercício" />
        <button type="button" className="btn sm soft" style={{ background: 'var(--surface)' }} onClick={onDelete} aria-label="Remover">✕</button></div>
      <div className="three">
        <div><small>Séries</small><input inputMode="numeric" {...f('sets')} /></div>
        <div><small>Reps / tempo</small><input {...f('reps')} /></div>
        <div><small>Descanso (s)</small><input inputMode="numeric" {...f('rest')} /></div>
      </div>
      <div className="three" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div><small>Tipo</small><select {...f('tipo')}>{TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><small>Observação</small><input {...f('notes')} placeholder="ex.: banco no 4" /></div>
      </div>
    </div>
  );
}

function EditorSheet({ w, isNew }) {
  const [name, setName] = useState(w.name);
  const [list, setList] = useState(() => w.exercises.map(toDraft));
  const [focusId, setFocusId] = useState(null);
  const nameInput = useRef(null), newRef = useRef(null);
  useEffect(() => { if (focusId && newRef.current) { newRef.current.focus(); setFocusId(null); } }, [focusId]);

  const addEx = () => {
    const e = toDraft({ id: uid(), name: '', sets: 3, reps: '12', rest: 60, tipo: 'carga', notes: '' });
    setList((l) => [...l, e]); setFocusId(e.id);
  };
  const ok = () => {
    if (isNew && !name.trim()) { nameInput.current?.reportValidity(); return; }
    w.name = name.trim() || w.name;
    w.exercises = list.map((e) => ({
      id: e.id,
      name: e.name.trim(),
      sets: Math.max(1, parseInt(e.sets, 10) || 1),
      reps: e.reps.trim() || '10',
      rest: Math.max(0, parseInt(e.rest, 10) || 0),
      tipo: e.tipo,
      notes: e.notes.trim(),
      /* a demonstração escolhida pela IA só vale enquanto o nome não muda */
      ...(e.demo && e.name.trim() === e.nome0 ? { demo: e.demo } : {}),
    })).filter((e) => e.name);
    if (isNew) state.plan.workouts.push(w);
    state.plan.source = 'personalizado';
    save(); closeSheet();
  };
  return (
    <>
      <h2>{isNew ? 'Novo treino' : 'Editar treino'}</h2>
      <div className="field"><label>Nome</label><input ref={nameInput} value={name} onChange={(e) => setName(e.target.value)} required={isNew} /></div>
      <div id="ed-list">
        {list.map((e) => (
          <ExEditor key={e.id} e={e} nameRef={e.id === focusId ? newRef : undefined}
            onChange={(n) => setList((l) => l.map((x) => (x.id === e.id ? n : x)))}
            onDelete={() => setList((l) => l.filter((x) => x.id !== e.id))} />
        ))}
      </div>
      <button type="button" className="btn soft block" onClick={addEx}><Icon n="plus" /> Exercício</button>
      {!isNew && <button type="button" className="btn danger block" style={{ marginTop: 10 }} onClick={() => deleteWorkout(w.id)}>Excluir treino</button>}
      <SheetActions onCancel={closeSheet} onOk={ok} />
    </>
  );
}
function openEditor(w, isNew) { openSheet(() => <EditorSheet w={w} isNew={isNew} />); }
export function editWorkout(id) { const w = state.plan.workouts.find((x) => x.id === id); if (w) openEditor(w, false); }
function addManual() {
  openEditor({ id: uid(), letter: String.fromCharCode(65 + state.plan.workouts.length), name: '', exercises: [] }, true);
}

/* "+ Novo": montar com IA ou sozinho */
function NovoTreinoSheet() {
  return (
    <>
      <h2>Novo treino</h2>
      <p className="lead">Como você quer montar?</p>
      <div className="group">
        <button type="button" className="row plain" onClick={() => openSheet(() => <TreinoIASheet />, 1)}>
          <span className="badge ia" aria-hidden="true">✦</span>
          <span className="body"><div className="t">Montar com IA</div><div className="s">Descreva o treino ou cole o que seu personal passou</div></span>
          <span className="end"><Icon n="right" /></span></button>
        <button type="button" className="row plain" onClick={addManual}>
          <span className="badge"><Icon n="pencil" /></span>
          <span className="body"><div className="t">Montar sozinho</div><div className="s">Escolha nome, exercícios, séries e descanso</div></span>
          <span className="end"><Icon n="right" /></span></button>
      </div>
    </>
  );
}
export function addWorkout() { openSheet(() => <NovoTreinoSheet />); }

const EXEMPLOS = [
  'Treino ABC para hipertrofia, 4x por semana, foco em pernas e glúteos',
  'Treino de 40 minutos para emagrecer, corpo todo, com cardio no final',
  'Peito e tríceps: supino reto 4x10, crucifixo 3x12, tríceps corda 3x15',
];
function TreinoIASheet() {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('');        // '' | 'busy' | mensagem de erro
  const [res, setRes] = useState(null);
  const montar = async () => {
    if (texto.trim().length < 5) { setEstado('Descreva o treino que você quer montar.'); return; }
    setEstado('busy'); setRes(null);
    try { setRes(await montarTreinoIA(texto)); setEstado(''); } catch (e) { setEstado(e.message || 'Não consegui montar agora. Tente de novo.'); }
  };
  const salvar = (substituir) => {
    if (substituir && !confirm('Trocar todos os treinos do plano por estes?')) return;
    const novos = res.treinos.filter((t) => t.exercicios?.length).map((t) => ({
      id: uid(), letter: '', name: t.nome || 'Treino',
      exercises: t.exercicios.map((e) => ({
        id: uid(), name: e.nome, sets: Math.max(1, e.series || 3), reps: String(e.reps || '12'),
        rest: Math.max(0, e.descanso ?? 90), tipo: ['carga', 'tempo', 'cardio'].includes(e.tipo) ? e.tipo : 'carga',
        notes: e.obs || '', ...(e.demo ? { demo: e.demo } : {}),
      })),
    }));
    state.plan.workouts = substituir ? novos : state.plan.workouts.concat(novos);
    state.plan.workouts.forEach((w, k) => { w.letter = String.fromCharCode(65 + k); });
    state.plan.source = 'personalizado';
    save(); closeSheet();
  };
  return (
    <>
      <h2>Montar com IA</h2>
      <p className="lead">Conte o treino que você quer, ou cole o treino que você já tem. A IA organiza com séries, repetições, descanso e a demonstração de cada exercício.</p>
      <div className="field"><textarea value={texto} onChange={(e) => setTexto(e.target.value)} style={{ minHeight: 120 }}
        placeholder="ex.: treino ABC, 4x por semana, foco em pernas" /></div>
      {!texto ? <div className="chips">{EXEMPLOS.map((x) => <button key={x} type="button" className="chip" onClick={() => setTexto(x)}>{x}</button>)}</div> : null}
      <button type="button" className="btn block" style={{ marginTop: 12 }} disabled={estado === 'busy'} onClick={montar}>
        {estado === 'busy' ? 'Montando…' : res ? 'Montar de novo' : 'Montar treino'}</button>
      {estado && estado !== 'busy' ? <p className="hint" style={{ color: 'var(--danger)', marginTop: 10 }}>{estado}</p> : null}
      {res?.treinos?.length ? (
        <>
          {res.treinos.map((t, ti) => (
            <div key={ti}>
              <div className="sub-head">{String.fromCharCode(65 + (state.plan.workouts.length + ti) % 26)} · {t.nome}</div>
              <div className="group" style={{ background: 'var(--surface-2)' }}>{(t.exercicios || []).map((e, i) => (
                <div key={i} className="row plain" style={{ minHeight: 50 }}>
                  <span className="body"><div className="t" style={{ fontWeight: 500 }}>{e.nome}</div>
                    {e.obs ? <div className="s">{e.obs}</div> : null}</span>
                  <span className="end num">{e.tipo === 'cardio' ? e.reps : `${e.series} × ${e.reps}`}</span>
                </div>
              ))}</div>
            </div>
          ))}
          <div className="stack-btns">
            <button type="button" className="btn block" onClick={() => salvar(false)}>Adicionar ao meu plano</button>
            {state.plan.workouts.length ? <button type="button" className="btn soft block" onClick={() => salvar(true)}>Trocar meu plano por estes</button> : null}
          </div>
        </>
      ) : null}
    </>
  );
}
async function montarTreinoIA(texto) {
  const { supabase } = await import('../lib/cloud.js');
  const { data, error } = await supabase.functions.invoke('pilar-ia', { body: { tipo: 'treino', texto } });
  if (error) {
    let corpo = null;
    try { corpo = await error.context?.json?.(); } catch { /* sem corpo */ }
    throw new Error(corpo?.erro || (navigator.onLine ? 'Não consegui montar agora. Tente de novo.' : 'Sem internet. A IA precisa de conexão.'));
  }
  if (!data?.resultado?.treinos?.length) throw new Error('A IA não montou nenhum treino. Tente descrever de outro jeito.');
  return data.resultado;
}
export function deleteWorkout(id) {
  if (!confirm('Excluir este treino do plano?')) return;
  state.plan.workouts = state.plan.workouts.filter((w) => w.id !== id);
  state.plan.workouts.forEach((w, k) => { w.letter = String.fromCharCode(65 + k); });
  state.plan.source = 'personalizado';
  closeSheet(); save();
}
