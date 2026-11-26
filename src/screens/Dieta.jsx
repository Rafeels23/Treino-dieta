import { useEffect, useRef, useState } from 'react';
import { Head, Section, Rings, CountUp, Icon } from '../components/ui.jsx';
import { Anim } from '../components/Illu.jsx';
import { useStore } from '../lib/hooks.js';
import { openSheet, closeSheet } from '../lib/ui.js';
import {
  state as st, save, todayKey, keyToDate, fmtDayLong, cap, dayLog, mealCheck, nextMeal, mealTitle, mealLabel, extrasKcal, RECIPES,
} from '../lib/core.js';
import {
  openMeal, quickMeal, openExtra, openDietEditor, openShopping, openRecipes, deleteExtra, dietJustKey, clearDietJust,
} from '../sheets/dieta.jsx';
import { saveDietText, openGrpEditor } from '../sheets/dieta-editor.jsx';
import { buzzOnly } from '../lib/effects.js';
import { aguaDe, aguaSomar, aguaMeta, aguaCopo } from '../lib/lembretes.js';
import { MetaAgua, LembretesAgua } from '../components/AguaAjustes.jsx';

const PLACEHOLDER = '07:30 - Café da manhã\nIogurte desnatado - 170 g\nAveia em flocos - 30 g\nMorango - 10 unidades ou 120 g\nSubstituição: Salada de frutas - 1 porção\n\n07:30 - Café da manhã - Opção 2\nPão integral - 2 fatias\n\n12:00 - Almoço\nArroz branco cozido - 125 g\nPeito de frango grelhado - 150 g\nObservação: legumes e folhas à vontade';

function setDietDay(state, v) {
  const d = keyToDate(state.ui.dietDay || todayKey()); d.setDate(d.getDate() + Number(v));
  const k = todayKey(d); state.ui.dietDay = k > todayKey() ? todayKey() : k; save();
}

function EmptyDiet({ state }) {
  const [raw, setRaw] = useState(state.diet.raw || '');
  return (
    <>
      <Head kicker="Plano da nutricionista" title="Alimentação" emoji="dieta" />
      <Section title="Adicionar plano">
        <div className="group pad">
          <p className="hint" style={{ marginBottom: 12 }}>Cole o texto do plano. Pode ter opções, substituições e observações, assim:</p>
          <textarea id="diet-raw" placeholder={PLACEHOLDER} value={raw} onChange={(e) => setRaw(e.target.value)} />
          <div className="stack-btns"><button className="btn block" onClick={() => saveDietText(raw)}>Salvar plano</button></div>
        </div>
      </Section>
    </>
  );
}

function ToolsSection({ state }) {
  const nRec = RECIPES.length + state.recipes.length;
  return (
    <Section title="Ferramentas">
      <div className="group">
        <button className="row" onClick={openShopping}><span className="badge"><Icon n="cart" /></span><span className="body"><div className="t">Lista de compras</div><div className="s">Montada a partir do seu plano</div></span><span className="end"><Icon n="right" /></span></button>
        <button className="row" onClick={openRecipes}><span className="badge"><Icon n="book" /></span><span className="body"><div className="t">Receitas</div><div className="s">{nRec} receitas simples</div></span><span className="end"><Icon n="right" /></span></button>
      </div>
    </Section>
  );
}

export default function Dieta() {
  const state = useStore();
  const just = dietJustKey();
  useEffect(() => { if (just) clearDietJust(); });

  const groups = state.diet.groups;
  if (!groups.length) return <EmptyDiet state={state} />;

  const key = state.ui.dietDay || todayKey();
  const today = todayKey();
  const log = dayLog(key);
  const done = groups.filter((g) => mealCheck(log, g)).length;
  const nowMeal = nextMeal(log);
  const xk = extrasKcal(log);

  return (
    <>
      <Head kicker="Plano da nutricionista" title="Alimentação" emoji="dieta"
        action={<button className="icon-btn destaque" style={{ '--cor': 'var(--c-dieta)' }} onClick={openAdd} aria-label="Adicionar"><Icon n="plus" /></button>} />
      <div className="section"><div className="day-switch">
        <button className="icon-btn" onClick={() => setDietDay(state, -1)} aria-label="Dia anterior"><Icon n="left" /></button>
        <b>{key === today ? 'Hoje' : cap(fmtDayLong(key))}</b>
        <button className="icon-btn" onClick={() => setDietDay(state, 1)} aria-label="Próximo dia"
          disabled={key >= today} style={key >= today ? { opacity: 0.3 } : undefined}><Icon n="right" /></button>
      </div></div>
      <div className="section"><div className="group diet-sum">
        <Rings items={[{ v: done / groups.length, color: 'var(--c-dieta)' }]} size={76} sw={10} />
        <div><div className="big digits"><CountUp value={done} k="refeicoes" /><small> de {groups.length}</small></div>
          <div className="s">{done === groups.length ? 'todas as refeições feitas' : 'refeições'}{xk ? ` · ${Math.round(xk)} kcal fora do plano` : ''}</div></div>
        {done === groups.length ? <Anim key={key} nome="palmas" tamanho={60} className="sum-anim" /> : null}
      </div></div>
      <AguaCard k={key} />
      <Section title="Refeições">
        <div className="meal-list">{comExtras(groups, log.extras, (g) => g.options.map((o, oi) => {
          const c = mealCheck(log, g);
          const reg = !!c && c.opt === oi;        // esta opção é a registrada
          const other = !!c && c.opt !== oi;      // outra opção da mesma refeição foi registrada
          const isNow = key === today && !c && nowMeal?.id === g.id && oi === 0;
          const cls = ['meal-card', reg && 'done', other && 'faded', isNow && 'now', just === `${g.id}:${oi}` && 'just'].filter(Boolean).join(' ');
          return (
            <div key={`${g.id}:${o.id || oi}`} className={cls}>
              <button className="meal-main" {...segurar(() => openMealActions(g.id, oi), () => openMeal(g.id, oi))}>
                <span className="mc-ic"><Icon n="meal" /></span>
                <span className="body"><div className="t">{mealTitle(g, oi)}</div>{isNow ? <span className="now-tag">Agora</span> : null}</span>
              </button>
              <button className="meal-tick" onClick={() => quickMeal(g.id, oi)} aria-pressed={reg} aria-label={`Marcar ${mealLabel(g, oi)}`}><Icon n="check" /></button>
            </div>
          );
        }), (x, i) => (
          <div key={`extra:${i}`} className="meal-card extra">
            <button className="meal-main" {...segurar(() => openExtraInfo(i), () => openExtraInfo(i))}>
              <span className="mc-ic" aria-hidden="true">!</span>
              <span className="body"><div className="t">{x.time ? `${x.time} - ` : ''}{x.text || 'Fora do plano'}</div>
                <div className="s num">Fora do plano{x.kcal != null ? ` · ${Math.round(x.kcal)} kcal` : ''}{x.ai ? ' · estimado pela IA' : ''}</div></span>
            </button>
          </div>
        ))}</div>
      </Section>
      <ToolsSection state={state} />
    </>
  );
}

/* Junta as refeições do plano com o que foi comido fora do plano, na ordem do horário.
   Os itens fora do plano entram depois da última refeição com horário menor ou igual. */
function comExtras(groups, extras, renderMeal, renderExtra) {
  const out = [];
  const pend = (extras || []).map((x, i) => ({ x, i })).sort((a, b) => (a.x.time || '').localeCompare(b.x.time || ''));
  groups.forEach((g, gi) => {
    while (pend.length && g.time && pend[0].x.time && pend[0].x.time < g.time) { const { x, i } = pend.shift(); out.push(renderExtra(x, i)); }
    out.push(...renderMeal(g, gi));
  });
  pend.forEach(({ x, i }) => out.push(renderExtra(x, i)));
  return out;
}

/* "+" do topo: escolher entre registrar algo fora do plano ou mexer no plano */
function AddSheet() {
  return (
    <>
      <h2>Adicionar</h2>
      <div className="group" style={{ marginTop: 12 }}>
        <button className="row plain" onClick={() => { closeSheet(); setTimeout(openExtra, 0); }}>
          <span className="badge warn" aria-hidden="true">!</span>
          <span className="body"><div className="t">Comi algo fora do plano</div><div className="s">Foto ou descrição; a IA estima as calorias</div></span>
          <span className="end"><Icon n="right" /></span></button>
        <button className="row plain" onClick={() => { closeSheet(); setTimeout(openDietEditor, 0); }}>
          <span className="badge"><Icon n="meal" /></span>
          <span className="body"><div className="t">Refeição do plano</div><div className="s">Adicionar ou editar refeições da nutricionista</div></span>
          <span className="end"><Icon n="right" /></span></button>
      </div>
    </>
  );
}
function openAdd() { openSheet(() => <AddSheet />); }

function ExtraInfo({ i }) {
  const state = useStore();
  const x = dayLog(state.ui.dietDay || todayKey()).extras[i];
  if (!x) return null;
  return (
    <>
      <h2>Fora do plano</h2>
      <p className="lead">{x.time ? `${x.time} · ` : ''}{x.text || 'Sem descrição'}</p>
      <div className="group pad">
        <div className="row-between"><span>Calorias</span><b className="num">{x.kcal != null ? `${Math.round(x.kcal)} kcal` : '—'}</b></div>
        {x.ai ? <p className="hint" style={{ marginTop: 8 }}>Estimado pela IA.</p> : null}
      </div>
      <div className="stack-btns"><button className="btn danger block" onClick={() => { if (confirm('Remover este item?')) { deleteExtra(i); closeSheet(); } }}>Remover</button></div>
    </>
  );
}
function openExtraInfo(i) { openSheet(() => <ExtraInfo i={i} />); }

/* Segurar o dedo ~0,5 s em cima de um item abre as opções (excluir etc.); toque normal abre o item.
   Retorna os handlers para espalhar no botão. */
function segurar(onHold, onTap) {
  let t = null, x0 = 0, y0 = 0, segurou = false;
  const parar = () => { clearTimeout(t); t = null; };
  return {
    onPointerDown: (e) => {
      segurou = false; x0 = e.clientX; y0 = e.clientY; parar();
      t = setTimeout(() => { segurou = true; t = null; buzzOnly(15); onHold(); }, 480);
    },
    onPointerMove: (e) => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) parar(); },
    onPointerUp: parar, onPointerLeave: parar, onPointerCancel: parar,
    onContextMenu: (e) => e.preventDefault(),
    onClick: (e) => { if (segurou) { e.preventDefault(); segurou = false; return; } onTap(); },
  };
}

/* Opções de uma refeição do plano (ao segurar) */
function limpaRegistro(gid) { Object.values(st.dietLog).forEach((l) => { if (l.checked?.[gid] != null) delete l.checked[gid]; }); }
function MealActions({ gid, oi }) {
  useStore();
  const g = st.diet.groups.find((x) => x.id === gid);
  if (!g) return null;
  const variasOpcoes = g.options.length > 1;
  const excluirOpcao = () => {
    if (!confirm(`Excluir "${mealLabel(g, oi)}"?`)) return;
    g.options.splice(oi, 1); limpaRegistro(gid); save(); closeSheet();
  };
  const excluirRefeicao = () => {
    if (!confirm(`Excluir "${g.name}"${variasOpcoes ? ' e todas as suas opções' : ''}?`)) return;
    st.diet.groups = st.diet.groups.filter((x) => x.id !== gid); limpaRegistro(gid); save(); closeSheet();
  };
  return (
    <>
      <h2>{mealTitle(g, oi)}</h2>
      <div className="group" style={{ marginTop: 12 }}>
        <button className="row plain" onClick={() => { closeSheet(); setTimeout(() => openMeal(gid, oi), 0); }}>
          <span className="body"><div className="t">Abrir refeição</div></span><span className="end"><Icon n="right" /></span></button>
        <button className="row plain" onClick={() => { closeSheet(); setTimeout(() => openGrpEditor(gid), 0); }}>
          <span className="body"><div className="t">Editar refeição</div><div className="s">Nome, horário e opções</div></span><span className="end"><Icon n="right" /></span></button>
      </div>
      <div className="stack-btns">
        {variasOpcoes ? <button className="btn soft block danger-text" onClick={excluirOpcao}>Excluir só esta opção</button> : null}
        <button className="btn danger block" onClick={excluirRefeicao}>Excluir refeição</button>
      </div>
    </>
  );
}
function openMealActions(gid, oi) { openSheet(() => <MealActions gid={gid} oi={oi} />); }

/* Água do dia: meta de 2 L, um toque soma um copo */
function AguaCard({ k }) {
  const META = aguaMeta(), COPO = aguaCopo();
  const ml = aguaDe(k), frac = Math.min(1, ml / META);
  const litros = (v) => (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return (
    <div className="section"><div className="group agua-card">
      <div className="agua-top">
        <button type="button" className="agua-info" onClick={openAgua} aria-label="Ajustar meta e lembretes de água">
          <div className="t">Água <Icon n="pencil" /></div><div className="s num">{litros(ml)} de {litros(META)} L{ml >= META ? ' · meta batida!' : ''}</div></button>
        <div className="agua-btns">
          <button type="button" className="icon-btn" onClick={() => aguaSomar(-COPO, k)} disabled={!ml} aria-label="Tirar um copo">−</button>
          <button type="button" className="btn sm agua-mais" onClick={() => { buzzOnly(10); aguaSomar(COPO, k); }}>+ {COPO} ml</button>
        </div>
      </div>
      <div className="agua-bar" role="progressbar" aria-valuemin={0} aria-valuemax={META} aria-valuenow={ml}><i style={{ width: `${frac * 100}%` }} /></div>
    </div></div>
  );
}

function AguaSheet() {
  return (
    <>
      <h2>Água</h2>
      <p className="lead">Escolha quanto você precisa beber por dia. Se quiser, ligue os lembretes: o app divide a meta pelo horário que você escolher.</p>
      <MetaAgua />
      <div className="group" style={{ marginTop: 6 }}><LembretesAgua /></div>
      <div className="stack-btns"><button type="button" className="btn block" onClick={closeSheet}>Pronto</button></div>
    </>
  );
}
export function openAgua() { openSheet(() => <AguaSheet />); }
