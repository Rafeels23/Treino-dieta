/* Montar a alimentação na mão: refeição › opções › alimentos › substituições.
   Mexe direto em state.diet.groups, então convive com o plano importado por texto. */
import { useState } from 'react';
import {
  state, save, uid, eqNorm, splitFood, parsePlan, MEAL_PRESETS, findGroup, newOption, sortGroups,
} from '../lib/core.js';
import { openSheet, closeSheet } from '../lib/ui.js';
import { Icon, SheetActions } from '../components/ui.jsx';

/* ----- plano em texto ----- */
export function saveDietText(rawText) {
  const raw = String(rawText || '').trim();
  if (!raw) return alert('Cole o texto do plano primeiro.');
  const groups = parsePlan(raw);
  state.diet = { raw, groups }; save();
  openSheet(() => <PlanSaved groups={groups} />);
}
function PlanSaved({ groups }) {
  return (
    <>
      <h2>Plano salvo</h2><p className="lead">Encontrei {groups.length} refeições:</p>
      <div className="group" style={{ background: 'var(--surface-2)' }}>{groups.map((g) => (
        <div key={g.id} className="row plain" style={{ minHeight: 48 }}>
          <span className="body"><div className="t" style={{ fontWeight: 500 }}>
            {g.time ? <span className="num" style={{ color: 'var(--ink-3)', marginRight: 8 }}>{g.time}</span> : null}{g.name}</div></span>
          <span className="end">{g.options.length > 1 ? `${g.options.length} opções` : `${g.options[0].foods.length} itens`}</span>
        </div>
      ))}</div>
      <p className="hint" style={{ marginTop: 12 }}>Se algo ficou errado, toque no lápis e ajuste o texto.</p>
      <div className="stack-btns"><button type="button" className="btn block" onClick={closeSheet}>Ok</button></div>
    </>
  );
}

function EditDietSheet() {
  const [raw, setRaw] = useState(state.diet.raw || '');
  const ok = () => {
    const r = raw.trim(), old = state.diet.groups, groups = parsePlan(r);
    groups.forEach((g) => { const o = old.find((x) => x.name === g.name && x.time === g.time); if (o) g.id = o.id; });
    state.diet = { raw: r, groups }; save(); closeSheet();
  };
  return (
    <>
      <h2>Editar plano</h2><p className="lead">Cada refeição numa linha com o horário. Alimento e quantidade separados por “-”.</p>
      <textarea name="raw" style={{ minHeight: '50vh' }} value={raw} onChange={(e) => setRaw(e.target.value)} />
      <SheetActions onCancel={closeSheet} onOk={ok} />
    </>
  );
}
export function openEditDiet() { openSheet(() => <EditDietSheet />); }

/* ----- lista de refeições do plano, com adicionar e editar ----- */
function DietEditor() {
  const gs = state.diet.groups;
  const presets = MEAL_PRESETS.filter((m) => !gs.some((g) => eqNorm(g.name) === eqNorm(m.name)));
  return (
    <>
      <h2>Alimentação</h2>
      <p className="lead">Monte as refeições do seu dia. Cada uma pode ter várias opções.</p>
      {gs.length ? (
        <div className="group">{gs.map((g) => (
          <button key={g.id} type="button" className="row plain" onClick={() => openGrpEditor(g.id)}>
            <span className="body"><div className="t">{g.time ? <span className="num" style={{ color: 'var(--ink-3)', marginRight: 8 }}>{g.time}</span> : null}{g.name}</div>
              <div className="s">{g.options.length} {g.options.length === 1 ? 'opção' : 'opções'} · {g.options.reduce((t, o) => t + o.foods.length, 0)} alimentos</div></span>
            <span className="end"><Icon n="right" /></span></button>
        ))}</div>
      ) : <p className="hint">Nenhuma refeição ainda. Comece pelas sugestões abaixo.</p>}
      <div className="sub-head">Adicionar refeição</div>
      <div className="chips">{presets.length
        ? presets.map((m) => <button key={m.name} type="button" className="chip" onClick={() => grpAdd(m.name, m.time)}>+ {m.name}</button>)
        : <span className="hint">Todas as refeições sugeridas já estão no plano.</span>}</div>
      <button type="button" className="btn soft block" style={{ marginTop: 12 }} onClick={() => grpAdd('', '')}>+ Outra refeição</button>
      <button type="button" className="text-btn" style={{ marginTop: 14 }} onClick={openEditDiet}><Icon n="pencil" /> Colar ou editar o plano em texto</button>
    </>
  );
}
export function openDietEditor() { openSheet(() => <DietEditor />, 1); }
function grpAdd(name, time) {
  const g = { id: uid(), name: name || 'Nova refeição', time, options: [newOption()] };
  state.diet.groups.push(g); sortGroups(); save();
  openGrpEditor(g.id);
}

/* ----- uma refeição: nome, horário e as opções ----- */
function GrpEditor({ gid }) {
  const g = findGroup(gid);
  const [nome, setNome] = useState(g?.name || '');
  const [hora, setHora] = useState(g?.time || '');
  if (!g) return null;
  const saveGrp = () => {
    g.name = nome.trim() || g.name;
    g.time = hora;
    sortGroups(); save(); openGrpEditor(gid);
  };
  const del = () => {
    if (!confirm(`Excluir "${g.name}" e todas as suas opções?`)) return;
    state.diet.groups = state.diet.groups.filter((x) => x.id !== gid);
    save(); openDietEditor();
  };
  const addOpt = () => { g.options.push(newOption()); save(); openOptEditor(gid, g.options.length - 1); };
  return (
    <>
      <div className="sheet-nav">
        <button type="button" className="icon-btn" onClick={openDietEditor} aria-label="Voltar"><Icon n="left" /></button>
        <div><div className="kicker">Refeição</div><h2 style={{ margin: 0 }}>{g.name}</h2></div>
      </div>
      <div className="two" style={{ marginTop: 14 }}>
        <div className="field"><label>Nome</label><input name="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Almoço" /></div>
        <div className="field"><label>Horário</label><input name="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
      </div>
      <button type="button" className="btn soft block" onClick={saveGrp}>Salvar nome e horário</button>
      <div className="sub-head">Opções desta refeição</div>
      <div className="group">{g.options.map((o, oi) => (
        <button key={o.id || oi} type="button" className="row plain" onClick={() => openOptEditor(g.id, oi)}>
          <span className="body"><div className="t">Opção {oi + 1}</div>
            <div className="s">{o.foods.length ? o.foods.map((f) => f.name).join(', ').slice(0, 60) : 'Sem alimentos'}</div></span>
          <span className="end"><Icon n="right" /></span></button>
      ))}</div>
      <button type="button" className="btn soft block" style={{ marginTop: 12 }} onClick={addOpt}>+ Adicionar opção</button>
      <button type="button" className="btn danger block" style={{ marginTop: 12 }} onClick={del}>Excluir refeição</button>
    </>
  );
}
export function openGrpEditor(gid) {
  if (!findGroup(gid)) return openDietEditor();
  openSheet(() => <GrpEditor gid={gid} />, 2);
}

/* ----- uma opção: os alimentos e a observação da nutricionista ----- */
function OptEditor({ gid, oi }) {
  const g = findGroup(gid), o = g?.options[oi];
  const [notes, setNotes] = useState(o?.notes || '');
  if (!o) return null;
  const saveNotes = () => { o.notes = notes.trim(); save(); openOptEditor(gid, oi); };
  const del = () => {
    if (g.options.length < 2 || !confirm(`Excluir a Opção ${oi + 1}?`)) return;
    g.options.splice(oi, 1);
    /* o registro do dia apontava para um índice que mudou: limpa para não marcar a opção errada */
    Object.values(state.dietLog).forEach((l) => { if (l.checked?.[gid] != null) delete l.checked[gid]; });
    save(); openGrpEditor(gid);
  };
  return (
    <>
      <div className="sheet-nav">
        <button type="button" className="icon-btn" onClick={() => openGrpEditor(gid)} aria-label="Voltar"><Icon n="left" /></button>
        <div><div className="kicker">{g.name}</div><h2 style={{ margin: 0 }}>Opção {oi + 1}</h2></div>
      </div>
      <div className="sub-head">Alimentos</div>
      {o.foods.length ? (
        <div className="group">{o.foods.map((f, fi) => (
          <button key={fi} type="button" className="row plain" onClick={() => openFoodEditor(gid, oi, fi)}>
            <span className="body"><div className="t">{f.name}</div><div className="s">{f.qty || 'sem quantidade'}{f.subs?.length ? ` · ${f.subs.length} substituição${f.subs.length > 1 ? 'ões' : ''}` : ''}</div></span>
            <span className="end"><Icon n="right" /></span></button>
        ))}</div>
      ) : <p className="hint">Nenhum alimento nesta opção.</p>}
      <button type="button" className="btn soft block" style={{ marginTop: 12 }} onClick={() => openFoodEditor(gid, oi, -1)}>+ Adicionar alimento</button>
      <div className="field" style={{ marginTop: 18 }}><label>Observação da nutricionista</label>
        <textarea name="notes" style={{ minHeight: 110 }} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="ex.: duas variedades de legumes, consumo livre, mínimo 100 g" /></div>
      <button type="button" className="btn soft block" onClick={saveNotes}>Salvar observação</button>
      {g.options.length > 1 ? <button type="button" className="btn danger block" style={{ marginTop: 12 }} onClick={del}>Excluir esta opção</button> : null}
    </>
  );
}
export function openOptEditor(gid, oi) {
  if (!findGroup(gid)?.options[oi]) return openGrpEditor(gid);
  openSheet(() => <OptEditor gid={gid} oi={oi} />, 3);
}

/* ----- um alimento: nome, quantidade e as substituições que a nutricionista indicou ----- */
function FoodEditor({ gid, oi, fi }) {
  const g = findGroup(gid), o = g?.options[oi];
  const novo = fi < 0;
  const f0 = novo ? { name: '', qty: '', subs: [] } : o?.foods[fi];
  const [nome, setNome] = useState(f0?.name || '');
  const [qtd, setQtd] = useState(f0?.qty || '');
  const [subs, setSubs] = useState((f0?.subs || []).map((s) => (s.qty ? `${s.name} - ${s.qty}` : s.name)).join('\n'));
  if (!o || !f0) return null;
  const saveFood = () => {
    const name = nome.trim();
    if (!name) { alert('Dê um nome ao alimento.'); return; }
    const list = subs.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      .map((l) => { const p = splitFood(l); return { name: p.name, qty: p.qty }; });
    const food = { name, qty: qtd.trim(), subs: list };
    if (novo) o.foods.push(food); else o.foods[fi] = food;
    save(); openOptEditor(gid, oi);
  };
  const del = () => {
    if (!confirm('Excluir este alimento?')) return;
    o.foods.splice(fi, 1);
    save(); openOptEditor(gid, oi);
  };
  return (
    <>
      <div className="sheet-nav">
        <button type="button" className="icon-btn" onClick={() => openOptEditor(gid, oi)} aria-label="Voltar"><Icon n="left" /></button>
        <div><div className="kicker">{g.name} · Opção {oi + 1}</div><h2 style={{ margin: 0 }}>{novo ? 'Novo alimento' : f0.name}</h2></div>
      </div>
      <div className="field" style={{ marginTop: 14 }}><label>Alimento</label>
        <input name="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Peito de frango grelhado" required /></div>
      <div className="field"><label>Quantidade</label>
        <input name="qtd" value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="ex.: 150 g  ou  2 colheres de sopa ou 30 g" /></div>
      <p className="hint">Se o alimento estiver na nossa tabela, as substituições equivalentes aparecem sozinhas. Abaixo você acrescenta as que a nutricionista indicou.</p>
      <div className="field" style={{ marginTop: 14 }}><label>Substituições da nutricionista (uma por linha)</label>
        <textarea name="subs" style={{ minHeight: 90 }} value={subs} onChange={(e) => setSubs(e.target.value)}
          placeholder={'Salada de frutas - 1 porção\nMamão - 170 g'} /></div>
      <button type="button" className="btn block" onClick={saveFood}>Salvar alimento</button>
      {novo ? null : <button type="button" className="btn danger block" style={{ marginTop: 12 }} onClick={del}>Excluir alimento</button>}
    </>
  );
}
export function openFoodEditor(gid, oi, fi) {
  const o = findGroup(gid)?.options[oi];
  if (!o) return openGrpEditor(gid);
  if (fi >= 0 && !o.foods[fi]) return openOptEditor(gid, oi);
  openSheet(() => <FoodEditor gid={gid} oi={oi} fi={fi} />, 4);
}
