/* Ferramentas da Dieta: lista de compras e receitas. */
import { useState } from 'react';
import { state, save, uid, num, shoppingItems, allRecipes } from '../lib/core.js';
import { openSheet, closeSheet } from '../lib/ui.js';
import { Icon, SheetActions } from '../components/ui.jsx';

/* ----- Lista de compras ----- */
function ShopRow({ k, name, label, extraIdx }) {
  const sh = state.shopping;
  const check = () => { const c = sh.checked; if (c[k]) delete c[k]; else c[k] = 1; save(); };
  const del = () => { const x = sh.extra.splice(extraIdx, 1)[0]; delete sh.checked['extra:' + x]; save(); };
  return (
    <div className={`meal-row ${sh.checked[k] ? 'done' : ''}`}>
      <button className="circle" type="button" onClick={check} aria-pressed={!!sh.checked[k]}><Icon n="check" /></button>
      <div className="meal-open" style={{ cursor: 'default' }}><span className="body"><div className="t" style={{ fontWeight: 500 }}>{name}</div></span>
        <span className="end num">{label}{extraIdx != null ? <> <button type="button" className="text-btn" style={{ color: 'var(--ink-3)' }} onClick={del}>Remover</button></> : null}</span></div>
    </div>
  );
}

function ShoppingSheet() {
  const sh = state.shopping, days = sh.days || 7;
  const items = shoppingItems(days);
  const [extra, setExtra] = useState('');
  const setDays = (v) => { sh.days = v; save(); };
  const add = () => { const v = extra.trim(); if (v) { sh.extra.push(v); save(); } setExtra(''); };
  const clear = () => { sh.checked = {}; save(); };
  const share = async () => {
    const lines = shoppingItems(sh.days || 7).filter((it) => !sh.checked[it.key]).map((it) => `- ${it.name} (${it.label})`)
      .concat(sh.extra.filter((x) => !sh.checked['extra:' + x]).map((x) => `- ${x}`));
    const text = `Lista de compras (${sh.days || 7} dias)\n${lines.join('\n')}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); alert('Lista copiada.'); }
    } catch { /* cancelado */ }
  };
  return (
    <>
      <h2>Lista de compras</h2>
      <p className="lead">Somada a partir da opção 1 de cada refeição. Peso de alimento cozido muda em relação ao cru, então ajuste na hora.</p>
      <div className="field"><label>Comprar para</label><div className="seg">{[[1, '1 dia'], [3, '3 dias'], [7, '7 dias']].map(([v, l]) => (
        <button key={v} type="button" className={v === days ? 'on' : ''} onClick={() => setDays(v)}>{l}</button>
      ))}</div></div>
      {items.length || sh.extra.length ? (
        <div className="group" style={{ background: 'var(--surface-2)' }}>
          {items.map((it) => <ShopRow key={it.key} k={it.key} name={it.name} label={it.label} />)}
          {sh.extra.map((x, i) => <ShopRow key={'extra:' + i + x} k={'extra:' + x} name={x} label="" extraIdx={i} />)}
        </div>
      ) : <div className="empty">Adicione o plano alimentar para gerar a lista.</div>}
      <div className="field" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <input name="extra" placeholder="Adicionar item (ex.: azeite)" value={extra} onChange={(e) => setExtra(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="btn sm" style={{ minHeight: 48 }} onClick={add}>Adicionar</button>
      </div>
      <div className="sheet-actions"><button className="btn soft" type="button" onClick={clear}>Desmarcar</button><button className="btn" type="button" onClick={share}>Compartilhar</button></div>
    </>
  );
}
export function openShopping() { openSheet(() => <ShoppingSheet />); }

/* ----- Receitas ----- */
function RecipesSheet() {
  const list = allRecipes();
  return (
    <>
      <h2>Receitas</h2><p className="lead">Simples, com alimentos comuns em planos de emagrecimento. Ajuste as quantidades ao seu plano.</p>
      <div className="group" style={{ background: 'var(--surface-2)' }}>{list.map((r) => (
        <button key={r.id} className="row plain" type="button" onClick={() => openRecipe(r.id)}>
          <span className="body"><div className="t">{r.name}</div><div className="s">{r.tag || 'Minha receita'} · {r.tempo || ''}</div></span><span className="end"><Icon n="right" /></span></button>
      ))}</div>
      <div className="stack-btns"><button className="btn soft block" type="button" onClick={openRecipeNew}><Icon n="plus" /> Nova receita</button></div>
    </>
  );
}
export function openRecipes() { openSheet(() => <RecipesSheet />); }

function RecipeSheet({ id }) {
  const r = allRecipes().find((x) => x.id === id);
  if (!r) return null;
  const mine = state.recipes.includes(r);
  const del = () => {
    if (!confirm('Excluir esta receita?')) return;
    state.recipes = state.recipes.filter((x) => x.id !== id); save(); openRecipes();
  };
  return (
    <>
      <button type="button" className="text-btn" onClick={openRecipes} style={{ paddingLeft: 0 }}><Icon n="left" /> Receitas</button>
      <h2 style={{ marginTop: 6 }}>{r.name}</h2>
      <p className="lead">{[r.tempo, r.porcoes ? `${r.porcoes} ${r.porcoes > 1 ? 'porções' : 'porção'}` : ''].filter(Boolean).join(' · ')}</p>
      <div className="food"><div className="t" style={{ marginBottom: 6 }}>Ingredientes</div><ul className="plain-list">{r.ing.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      <div className="food"><div className="t" style={{ marginBottom: 6 }}>Modo de preparo</div><ol className="steps">{r.prep.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
      <div className="sheet-actions">{mine ? <button className="btn danger" type="button" onClick={del}>Excluir</button> : <span />}<button className="btn soft" type="button" onClick={closeSheet}>Fechar</button></div>
    </>
  );
}
export function openRecipe(id) {
  if (!allRecipes().some((x) => x.id === id)) return;
  openSheet(() => <RecipeSheet id={id} />);
}

function RecipeNewSheet() {
  const [f, setF] = useState({ name: '', tempo: '', porcoes: '', ing: '', prep: '' });
  const bind = (k) => ({ name: k, value: f[k], onChange: (e) => setF((o) => ({ ...o, [k]: e.target.value })) });
  const ok = () => {
    const name = f.name.trim();
    if (!name) return;
    const lines = (t) => t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    state.recipes.push({ id: 'u' + uid(), name, tempo: f.tempo.trim(), porcoes: num(f.porcoes), tag: 'Minha receita', ing: lines(f.ing), prep: lines(f.prep) });
    save(); closeSheet();
  };
  return (
    <>
      <h2>Nova receita</h2>
      <div className="field"><label>Nome</label><input {...bind('name')} required /></div>
      <div className="two"><div className="field"><label>Tempo</label><input {...bind('tempo')} placeholder="ex.: 20 min" /></div>
        <div className="field"><label>Porções</label><input {...bind('porcoes')} inputMode="numeric" /></div></div>
      <div className="field"><label>Ingredientes (um por linha)</label><textarea {...bind('ing')} style={{ minHeight: 120 }} /></div>
      <div className="field"><label>Modo de preparo (um passo por linha)</label><textarea {...bind('prep')} style={{ minHeight: 120 }} /></div>
      <SheetActions onCancel={closeSheet} onOk={ok} />
    </>
  );
}
export function openRecipeNew() { openSheet(() => <RecipeNewSheet />); }
