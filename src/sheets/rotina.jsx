/* Folhas da área Rotina: detalhe do hábito, montar a rotina e editar um hábito.
   state.routines = [{id, name, time, dias:[0..6]|[], nota}]
   state.routineLog = { 'AAAA-MM-DD': { idDoItem: timestamp } } */
import { useState } from 'react';
import { state, save, uid, todayKey, keyToDate, routineLog, routinesOf, DIAS_CURTO, DIAS_NOME, ROTINA_PRESETS, eqNorm } from '../lib/core.js';
import { openSheet } from '../lib/ui.js';
import { buzz } from '../lib/effects.js';
import { Icon, CountUp } from '../components/ui.jsx';

/* item recém-marcado (animação `just`); a tela limpa depois de desenhar */
let justKey = null;
export const getJustKey = () => justKey;
export const clearJustKey = () => { justKey = null; };

const findRoutine = (id) => (state.routines || []).find((x) => x.id === id);
const rotKey = () => state.ui.rotDay || todayKey();

export function rotDay(v) {
  const d = keyToDate(rotKey()); d.setDate(d.getDate() + Number(v));
  const k = todayKey(d);
  state.ui.rotDay = k > todayKey() ? todayKey() : k;
  save();
}

export function rotTick(id) {
  const log = routineLog(rotKey());
  if (log[id]) delete log[id]; else { log[id] = Date.now(); justKey = id; buzz(); }
  save();
}

/* ----- detalhe do hábito: marcar, a nota e o quanto você tem mantido ----- */
function RoutineSheet({ id }) {
  const r = findRoutine(id);
  if (!r) return null;
  const key = rotKey(), ok = !!(state.routineLog || {})[key]?.[id];
  /* quantos dos últimos 30 dias em que o hábito valia você cumpriu */
  let prev = 0, tot = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = todayKey(d);
    if (!routinesOf(k).some((x) => x.id === id)) continue;
    tot++; if ((state.routineLog || {})[k]?.[id]) prev++;
  }
  return (
    <>
      <h2>{r.time ? <><span className="num" style={{ color: 'var(--ink-3)' }}>{r.time}</span> · </> : null}{r.name}</h2>
      <p className="lead">{r.dias?.length ? r.dias.map((i) => DIAS_NOME[i]).join(', ') : 'Todos os dias'}</p>
      <div className="meal-menu" style={{ gridTemplateColumns: '1fr' }}>
        <button type="button" className={`mm ${ok ? 'on' : ''}`} onClick={() => rotTick(r.id)}>
          <Icon n="check" /><span>{ok ? 'Feito · toque para desfazer' : 'Marcar como feito'}</span></button>
      </div>
      {r.nota ? (
        <div className="notes-open"><div className="sub-head">Nota</div>
          <div>{r.nota.split('\n').map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</div></div>
      ) : null}
      <div className="sub-head">Nos últimos 30 dias</div>
      <div className="group pad row-between"><div><div className="hint">Dias cumpridos</div>
        <div className="stat num"><CountUp value={prev} k={`habito-${r.id}`} /><small> de {tot}</small></div></div>
        {tot ? <span className={`tag ${prev / tot >= 0.7 ? 'ok' : ''}`}>{Math.round((prev / tot) * 100)}%</span> : null}</div>
      <div className="stack-btns"><button type="button" className="text-btn" onClick={() => openRotEdit(r.id)}>Editar hábito</button></div>
    </>
  );
}
export function openRoutine(id) {
  if (!findRoutine(id)) return;
  openSheet(() => <RoutineSheet id={id} />);
}

/* ----- montar a rotina ----- */
function RotEditorSheet() {
  const rs = state.routines || [];
  const sugestoes = ROTINA_PRESETS.filter((n) => !rs.some((r) => eqNorm(r.name) === eqNorm(n)));
  return (
    <>
      <h2>Sua rotina</h2>
      <p className="lead">Monte os hábitos que você quer manter. Marque cada um no dia.</p>
      {rs.length ? (
        <div className="group">{rs.map((r) => (
          <button key={r.id} type="button" className="row plain" onClick={() => openRotEdit(r.id)}>
            <span className="body"><div className="t">{r.time ? <span className="num" style={{ color: 'var(--ink-3)', marginRight: 8 }}>{r.time}</span> : null}{r.name}</div>
              <div className="s">{r.dias?.length ? r.dias.map((i) => DIAS_CURTO[i]).join(' · ') : 'Todos os dias'}</div></span>
            <span className="end"><Icon n="right" /></span></button>
        ))}</div>
      ) : <p className="hint">Nenhum hábito ainda. Comece pelas sugestões.</p>}
      <div className="sub-head">Sugestões</div>
      <div className="chips">{sugestoes.length
        ? sugestoes.map((n) => <button key={n} type="button" className="chip" onClick={() => rotAdd(n)}>+ {n}</button>)
        : <span className="hint">Todas as sugestões já estão na sua rotina.</span>}</div>
      <button type="button" className="btn soft block" style={{ marginTop: 12 }} onClick={() => rotAdd('')}>+ Outro hábito</button>
    </>
  );
}
export function openRotEditor() { openSheet(() => <RotEditorSheet />, 1); }

export function rotAdd(v) {
  state.routines = state.routines || [];
  const r = { id: uid(), name: String(v) || 'Novo hábito', time: '', dias: [], nota: '' };
  state.routines.push(r); save();
  openRotEdit(r.id);
}

function RotEditSheet({ id }) {
  const r = findRoutine(id);
  const [nome, setNome] = useState(r?.name || '');
  const [hora, setHora] = useState(r?.time || '');
  const [nota, setNota] = useState(r?.nota || '');
  if (!r) return null;
  /* guarda o que já está digitado (igual ao antigo, que salvava antes de redesenhar) */
  const keepTyped = () => { r.name = nome.trim() || r.name; r.time = hora; r.nota = nota.trim(); };
  const toggleDia = (n) => {
    r.dias = r.dias || [];
    if (r.dias.includes(n)) r.dias = r.dias.filter((x) => x !== n); else r.dias.push(n);
    r.dias.sort((a, b) => a - b);
    keepTyped(); save();
  };
  const salvar = () => { keepTyped(); save(); openRotEditor(); };
  const excluir = () => {
    if (!confirm(`Excluir "${r.name}"?`)) return;
    state.routines = state.routines.filter((x) => x.id !== id);
    Object.values(state.routineLog || {}).forEach((l) => delete l[id]);
    save(); openRotEditor();
  };
  return (
    <>
      <div className="sheet-nav">
        <button type="button" className="icon-btn" onClick={openRotEditor} aria-label="Voltar"><Icon n="left" /></button>
        <div><div className="kicker">Hábito</div><h2 style={{ margin: 0 }}>{r.name}</h2></div>
      </div>
      <div className="two" style={{ marginTop: 14 }}>
        <div className="field"><label>Nome</label><input name="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Ler 20 páginas" /></div>
        <div className="field"><label>Horário</label><input name="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
      </div>
      <div className="field"><label>Dias da semana</label>
        <div className="chips">{DIAS_NOME.map((n, i) => (
          <button key={i} type="button" className={`chip day-chip ${r.dias?.includes(i) ? 'on' : ''}`} onClick={() => toggleDia(i)}>{n.slice(0, 3)}</button>
        ))}</div>
        <p className="hint" style={{ marginTop: 6 }}>Nenhum dia marcado = todos os dias.</p></div>
      <div className="field"><label>Nota</label><textarea name="nota" style={{ minHeight: 80 }} placeholder="opcional" value={nota} onChange={(e) => setNota(e.target.value)} /></div>
      <button type="button" className="btn block" onClick={salvar}>Salvar hábito</button>
      <button type="button" className="btn danger block" style={{ marginTop: 12 }} onClick={excluir}>Excluir hábito</button>
    </>
  );
}
export function openRotEdit(id) {
  if (!findRoutine(id)) return openRotEditor();
  openSheet(() => <RotEditSheet id={id} />, 2);
}
