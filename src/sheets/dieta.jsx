/* Área Dieta: folha da refeição, substituições, diário, humor e registro.
   Contrato usado por outras telas: openMeal, quickMeal, openExtra, openDietEditor. */
import { Anim } from '../components/Illu.jsx';
import {
  state, save, todayKey, dayLog, mealCheck, mealLabel, foodQty, MOODS, pickImage, shrink,
} from '../lib/core.js';
import { openSheet, closeSheet } from '../lib/ui.js';
import { buzz } from '../lib/effects.js';
import { Icon } from '../components/ui.jsx';
import { openExtra } from './dieta-extra.jsx';
import { openDietEditor } from './dieta-editor.jsx';

export { openExtra, openDietEditor };
export { openShopping, openRecipes } from './dieta-tools.jsx';

/* item recém-marcado (animação `just`); a tela limpa depois de desenhar */
let justKey = null, justT = 0;
export const dietJustKey = () => justKey;
export const clearDietJust = () => { justKey = null; };
function setJust(k) {
  justKey = k;
  clearTimeout(justT);
  justT = setTimeout(() => { if (justKey === k) justKey = null; }, 1000);
}

const curLog = () => dayLog(state.ui.dietDay || todayKey());
const parse = (v) => { const [gid, i] = String(v).split(':'); return [gid, i == null || i === '' ? undefined : +i]; };

function SubLine({ x }) {
  return <div className="sub"><div className="t">{x.name}</div>{x.qty ? <div className="s">{x.qty}</div> : null}</div>;
}

/* um alimento: quantidade e o botão das substituições — só as que a nutricionista passou */
function FoodRow({ f, fi, gid, oi }) {
  const total = (f.subs || []).length;
  const qty = foodQty(f);
  return (
    <div className="food">
      <div className="t">{f.name}</div>{qty ? <div className="s">{qty}</div> : null}
      {total ? (
        <button type="button" className="subs-btn" onClick={() => openSubs(gid, oi, fi)}>
          <Icon n="swap" /> Ver opções de substituição
        </button>
      ) : null}
    </div>
  );
}

/* tela própria das substituições, com voltar — como no app da nutricionista */
function SubsSheet({ gid, oi, fi }) {
  const g = state.diet.groups.find((x) => x.id === gid);
  const f = g?.options[oi]?.foods[fi];
  if (!f) return null;
  const own = f.subs || [];
  return (
    <>
      <div className="sheet-nav">
        <button type="button" className="icon-btn" onClick={() => openMeal(gid, oi)} aria-label="Voltar para a refeição"><Icon n="left" /></button>
        <div><div className="kicker">{mealLabel(g, oi)}</div><h2 style={{ margin: 0 }}>{f.name}</h2></div>
      </div>
      <p className="lead">{foodQty(f)}</p>
      <div className="subs-screen">
        <div className="sub-head">Opções para substituir</div>{own.map((x, i) => <SubLine key={i} x={x} />)}
      </div>
    </>
  );
}
export function openSubs(gid, oi, fi) {
  const g = state.diet.groups.find((x) => x.id === gid);
  if (!g?.options[oi]?.foods[fi]) return;
  openSheet(() => <SubsSheet gid={gid} oi={oi} fi={fi} />, 2);
}

function MealSheet({ gid, oi }) {
  const g = state.diet.groups.find((x) => x.id === gid);
  if (!g) return null;
  const log = curLog(), c = mealCheck(log, g);
  const o = g.options[oi] || g.options[0];
  const registered = c && c.opt === oi;
  const diary = (log.diary || {})[g.id], mood = (log.mood || {})[g.id];
  return (
    <>
      <h2>{g.time ? <><span className="num" style={{ color: 'var(--ink-3)' }}>{g.time}</span> · </> : null}{mealLabel(g, oi)}</h2>
      <p className="lead">{o.foods.length} {o.foods.length === 1 ? 'alimento' : 'alimentos'}{g.options.length > 1 ? ` · uma das ${g.options.length} opções desta refeição` : ''}</p>
      <div className="meal-menu">
        <button type="button" className={`mm ${registered ? 'on' : ''}`} onClick={() => mealReg(g.id, oi)}>
          <Icon n={registered ? 'check' : 'meal'} /><span>{registered ? 'Registrada' : 'Registrar refeição'}</span></button>
        <button type="button" className={`mm ${diary ? 'on' : ''}`} onClick={() => mealDiary(g.id)}>
          <Icon n="camera" /><span>Diário alimentar</span></button>
        <button type="button" className={`mm ${mood ? 'on' : ''}`} onClick={() => openMood(g.id)}>
          {mood ? <span className="mm-face"><Anim nome={`humor-${mood}`} tamanho={26} /></span> : <Icon n="pulse" />}<span>Humor na refeição</span></button>
      </div>
      <div className="sub-head">Alimentos</div>
      {o.foods.length
        ? o.foods.map((f, fi) => <FoodRow key={fi} f={f} fi={fi} gid={g.id} oi={oi} />)
        : <p className="hint">Nenhum alimento nesta opção.</p>}
      {diary ? (
        <>
          <div className="sub-head">Diário alimentar</div>
          <div className="food"><img className="diary-img" src={diary.photo} alt="Foto da refeição" />
            <button type="button" className="text-btn" onClick={() => mealDiaryDel(g.id)}>Remover foto</button></div>
        </>
      ) : null}
      {o.notes ? (
        <div className="notes-open"><div className="sub-head">Observação</div>
          <div>{o.notes.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 ? <br /> : null}</span>)}</div></div>
      ) : null}
      <div className="stack-btns">
        <button className="text-btn" type="button" onClick={openExtra}>Comi outra coisa</button>
      </div>
    </>
  );
}

/* abre a refeição: openMeal('gid'), openMeal('gid:1') ou openMeal('gid', 1) */
export function openMeal(gid, oi) {
  let [id, i] = parse(gid);
  if (oi != null) i = +oi;
  const g = state.diet.groups.find((x) => x.id === id);
  if (!g) return;
  const c = mealCheck(curLog(), g);
  const o = i ?? (c ? c.opt : 0);
  openSheet(() => <MealSheet gid={id} oi={o} />, 1);
}
/* reabre a refeição na opção certa depois de uma ação */
function mealSheetFor(gid) {
  const g = state.diet.groups.find((x) => x.id === gid);
  if (!g) return;
  const c = mealCheck(curLog(), g);
  openMeal(gid, c ? c.opt : 0);
}

/* Diário alimentar: a foto do que você realmente comeu, guardada no dia */
async function mealDiary(gid) {
  const file = await pickImage();
  if (!file) return;
  const blob = await shrink(file, 640);
  const photo = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
  const log = curLog();
  log.diary = log.diary || {};
  log.diary[gid] = { photo, at: Date.now() };
  if (!save()) { delete log.diary[gid]; return; }
  buzz(); mealSheetFor(gid);
}
function mealDiaryDel(gid) {
  const log = curLog();
  if (log.diary) delete log.diary[gid];
  save(); mealSheetFor(gid);
}

/* Humor na refeição */
function MoodSheet({ gid }) {
  const cur = (curLog().mood || {})[gid];
  return (
    <>
      <h2>Humor na refeição</h2><p className="lead">Como você se sentiu nesta refeição?</p>
      <div className="mood-pick">{MOODS.map((m) => (
        <button type="button" key={m.k} className={`mood ${cur === m.k ? 'on' : ''}`} onClick={() => moodSet(gid, m.k)}>
          <span className="face"><Anim nome={`humor-${m.k}`} tamanho={36} /></span><span className="s">{m.label}</span></button>
      ))}</div>
      {cur ? <button type="button" className="text-btn block" onClick={() => moodSet(gid, '')}>Limpar</button> : null}
    </>
  );
}
function openMood(gid) { openSheet(() => <MoodSheet gid={gid} />); }
function moodSet(gid, k) {
  const log = curLog();
  log.mood = log.mood || {};
  if (k) { log.mood[gid] = k; buzz(); } else delete log.mood[gid];
  save(); mealSheetFor(gid);
}

function mealReg(gid, i) {
  const log = curLog(), c = log.checked[gid];
  if (c != null && (typeof c !== 'object' || c.opt === +i)) delete log.checked[gid];
  else { log.checked[gid] = { opt: +i, at: Date.now() }; setJust(`${gid}:${i}`); buzz(); }
  closeSheet(); save();
}

/* check rápido: quickMeal('gid') (opção 1), quickMeal('gid:1') ou quickMeal('gid', 1) */
export function quickMeal(gid, oi) {
  let [id, i] = parse(gid);
  if (oi != null) i = +oi;
  i = i ?? 0;
  const log = curLog(), c = log.checked[id];
  const cur = c == null ? null : (typeof c === 'object' ? c.opt : 0);
  /* marcada na mesma opção → desmarca; em outra opção → troca a escolha */
  if (cur === i) delete log.checked[id];
  else { log.checked[id] = { opt: i, at: Date.now() }; setJust(`${id}:${i}`); buzz(); }
  save();
}

export function deleteExtra(i) { curLog().extras.splice(+i, 1); save(); }
