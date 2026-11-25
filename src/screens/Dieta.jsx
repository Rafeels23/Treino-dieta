import { useEffect, useState } from 'react';
import { Head, Section, Rings, CountUp, Icon } from '../components/ui.jsx';
import { Anim } from '../components/Illu.jsx';
import { useStore } from '../lib/hooks.js';
import {
  save, todayKey, keyToDate, fmtDayLong, cap, dayLog, mealCheck, nextMeal, mealTitle, mealLabel, extrasKcal, RECIPES,
} from '../lib/core.js';
import {
  openMeal, quickMeal, openExtra, openDietEditor, openShopping, openRecipes, deleteExtra, dietJustKey, clearDietJust,
} from '../sheets/dieta.jsx';
import { saveDietText } from '../sheets/dieta-editor.jsx';

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
        action={<button className="icon-btn" onClick={openDietEditor} aria-label="Adicionar refeição"><Icon n="plus" /></button>} />
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
      <Section title="Refeições">
        <div className="meal-list">{groups.flatMap((g) => g.options.map((o, oi) => {
          const c = mealCheck(log, g);
          const reg = !!c && c.opt === oi;        // esta opção é a registrada
          const other = !!c && c.opt !== oi;      // outra opção da mesma refeição foi registrada
          const isNow = key === today && !c && nowMeal?.id === g.id && oi === 0;
          const cls = ['meal-card', reg && 'done', other && 'faded', isNow && 'now', just === `${g.id}:${oi}` && 'just'].filter(Boolean).join(' ');
          return (
            <div key={`${g.id}:${o.id || oi}`} className={cls}>
              <button className="meal-main" onClick={() => openMeal(g.id, oi)}>
                <span className="mc-ic"><Icon n="meal" /></span>
                <span className="body"><div className="t">{mealTitle(g, oi)}</div>{isNow ? <span className="now-tag">Agora</span> : null}</span>
              </button>
              <button className="meal-tick" onClick={() => quickMeal(g.id, oi)} aria-pressed={reg} aria-label={`Marcar ${mealLabel(g, oi)}`}><Icon n="check" /></button>
            </div>
          );
        }))}</div>
      </Section>
      <Section title={`Fora do plano${xk ? ` · ${Math.round(xk)} kcal` : ''}`}
        action={<button className="add-btn" onClick={openExtra} aria-label="Registrar algo que comi fora do plano"><Icon n="plus" /></button>}>
        {log.extras.length ? (
          <div className="group">{log.extras.map((x, i) => (
            <div key={i} className="row plain"><span className="body"><div className="t" style={{ fontWeight: 500 }}>{x.text}</div>
              <div className="s num">{x.time}{x.kcal != null ? ` · ${Math.round(x.kcal)} kcal` : ''}{x.ai ? ' · estimado pela IA' : ''}</div></span>
              <button className="text-btn" style={{ color: 'var(--ink-3)' }} onClick={() => deleteExtra(i)}>Remover</button></div>
          ))}</div>
        ) : null}
      </Section>
      <ToolsSection state={state} />
    </>
  );
}
