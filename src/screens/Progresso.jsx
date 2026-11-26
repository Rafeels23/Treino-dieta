/* Tela Progresso: resumo da semana ou do mês, constância dia a dia, peso, carga por exercício,
   e os últimos treinos e atividades (o histórico completo abre numa folha, sem lista gigante). */
import { Head, Section, Icon, Seg } from '../components/ui.jsx';
import Illu from '../components/Illu.jsx';
import Chart from '../components/Chart.jsx';
import { useStore } from '../lib/hooks.js';
import {
  morningSorted, fmtDay, fmtDayLong, todayKey, keyToDate, br, num, cap, finished, mealCheck, save, routinesOf,
} from '../lib/core.js';
import { openSheet, closeSheet } from '../lib/ui.js';
import { buzzOnly } from '../lib/effects.js';
import { openSession } from '../sheets/treino.jsx';
import { openPeso, deleteActivity } from '../sheets/perfil.jsx';
import { openDay } from '../sheets/hoje-dia.jsx';

const emOrdem = () => finished().slice().sort((a, b) => a.start - b.start);
const DIAS_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

/* quanto do dia foi cumprido (0 a 1), com a mesma regra da tela Hoje — só lê, não cria nada no estado */
function cumprido(state, k, treinosPorDia) {
  const treino = treinosPorDia.has(k) ? 1 : 0;
  const gs = state.diet.groups, log = state.dietLog[k];
  const ref = gs.length ? (log ? gs.filter((g) => mealCheck(log, g)).length / gs.length : 0) : null;
  const rot = routinesOf(k), rlog = (state.routineLog || {})[k] || {};
  const hab = rot.length ? rot.filter((r) => rlog[r.id]).length / rot.length : null;
  const partes = [treino].concat(ref == null ? [] : [ref], hab == null ? [] : [hab]);
  return partes.reduce((a, b) => a + b, 0) / partes.length;
}

function diasDoPeriodo(n) {
  const out = [], hoje = keyToDate(todayKey());
  for (let i = n - 1; i >= 0; i--) { const d = new Date(hoje); d.setDate(d.getDate() - i); out.push(todayKey(d)); }
  return out;
}

/* segurar ~0,5 s abre a opção de remover; toque normal não faz nada */
function segurar(onHold) {
  let t = null;
  const parar = () => { clearTimeout(t); t = null; };
  return {
    onPointerDown: () => { parar(); t = setTimeout(() => { t = null; buzzOnly(15); onHold(); }, 480); },
    onPointerUp: parar, onPointerLeave: parar, onPointerCancel: parar, onPointerMove: parar,
    onContextMenu: (e) => e.preventDefault(),
  };
}
const removerAtividade = (a) => { if (confirm(`Remover "${a.tipo}" de ${fmtDay(a.date)}?`)) deleteActivity(a.id); };

const linhaTreino = (s) => (
  <button key={s.id} className="row plain" onClick={() => openSession(s.id)}><span className="body"><div className="t">{s.workoutName}</div>
    <div className="s num">{cap(fmtDayLong(todayKey(new Date(s.start))))} · {Math.round((s.end - s.start) / 60000)} min · {s.exercises.reduce((n, e) => n + e.sets.length, 0)} séries</div></span>
    <span className="end"><Icon n="right" /></span></button>
);
const linhaAtividade = (a) => (
  <div key={a.id} className="row plain segura" {...segurar(() => removerAtividade(a))}><span className="body"><div className="t">{a.tipo}</div>
    <div className="s num">{fmtDay(a.date)}{a.minutos ? ` · ${a.minutos} min` : ''}{a.km ? ` · ${br(a.km)} km` : ''}{a.kcal ? ` · ${a.kcal} kcal` : ''}{a.passos ? ` · ${a.passos.toLocaleString('pt-BR')} passos` : ''}</div></span></div>
);

/* histórico completo, separado por mês */
const nomeMes = (k) => cap(keyToDate(k).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
function porMes(itens, chave) {
  const m = new Map();
  itens.forEach((x) => { const k = nomeMes(chave(x)); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
  return [...m.entries()];
}
function HistoricoSheet({ tipo }) {
  const state = useStore();
  const treinos = tipo === 'treinos';
  const itens = treinos ? emOrdem().slice().reverse() : state.activities.slice().sort((a, b) => b.date.localeCompare(a.date));
  const grupos = porMes(itens, (x) => (treinos ? todayKey(new Date(x.start)) : x.date));
  return (
    <>
      <h2>{treinos ? 'Todos os treinos' : 'Todas as atividades'}</h2>
      <p className="lead">{itens.length} {treinos ? (itens.length === 1 ? 'treino' : 'treinos') : (itens.length === 1 ? 'atividade' : 'atividades')}{treinos ? '' : ' · segure uma para remover'}</p>
      {grupos.map(([mes, lista]) => (
        <div key={mes}>
          <div className="sub-head">{mes} · {lista.length}</div>
          <div className="group">{lista.map(treinos ? linhaTreino : linhaAtividade)}</div>
        </div>
      ))}
      <div className="stack-btns"><button type="button" className="btn soft block" onClick={closeSheet}>Fechar</button></div>
    </>
  );
}
const openHistorico = (tipo) => openSheet(() => <HistoricoSheet tipo={tipo} />);

export default function Progresso() {
  const state = useStore();
  const periodo = state.ui.progPeriodo === 30 ? 30 : 7;
  const dias = diasDoPeriodo(periodo);
  const desde = keyToDate(dias[0]).getTime();
  const fim = todayKey();

  /* resumo do período */
  const sess = emOrdem().filter((s) => s.start >= desde);
  const treinosPorDia = new Set(emOrdem().map((s) => todayKey(new Date(s.start))));
  const ativs = state.activities.filter((a) => a.date >= dias[0] && a.date <= fim);
  const minAtivos = sess.reduce((t, s) => t + (s.end - s.start) / 60000, 0) + ativs.reduce((t, a) => t + (num(a.minutos) || 0), 0);
  const gs = state.diet.groups;
  const dietaOk = gs.length ? dias.filter((k) => state.dietLog[k] && gs.every((g) => mealCheck(state.dietLog[k], g))).length : null;
  let habTotal = 0, habFeitos = 0;
  dias.forEach((k) => { const rot = routinesOf(k), rlog = (state.routineLog || {})[k] || {}; habTotal += rot.length; habFeitos += rot.filter((r) => rlog[r.id]).length; });
  const habPct = habTotal ? Math.round((habFeitos / habTotal) * 100) : null;

  /* constância: cada dia mais forte quanto mais foi cumprido */
  const notas = dias.map((k) => ({ k, v: cumprido(state, k, treinosPorDia) }));
  const vazios = (keyToDate(dias[0]).getDay() + 6) % 7;      // alinha com segunda-feira
  const media = Math.round((notas.reduce((a, d) => a + d.v, 0) / notas.length) * 100);

  /* peso */
  const ms = morningSorted().filter((x) => x.peso != null).slice(-60);
  const wPts = ms.map((x) => ({ y: x.peso, label: fmtDay(x.date) }));
  const cur = ms[ms.length - 1], first = ms[0];
  const dw = cur && ms.length > 1 ? cur.peso - first.peso : null;

  /* carga por exercício */
  const names = [...new Set(emOrdem().flatMap((s) => s.exercises.filter((e) => e.tipo === 'carga' && e.sets.some((x) => num(x.kg))).map((e) => e.name)))];
  const sel = names.includes(state.ui.progressEx) ? state.ui.progressEx : names[0];
  const lPts = sel ? emOrdem().map((s) => {
    const e = s.exercises.find((x) => x.name === sel);
    const kgs = e ? e.sets.map((x) => num(x.kg)).filter((v) => v != null) : [];
    return kgs.length ? { y: Math.max(...kgs), label: fmtDay(todayKey(new Date(s.start))) } : null;
  }).filter(Boolean) : [];

  const todosTreinos = emOrdem();
  const recentes = todosTreinos.slice(-3).reverse();
  const ativRecentes = state.activities.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <>
      <Head kicker="Seu progresso" title="Progresso" />
      <div className="section"><Seg options={[[7, 'Semana'], [30, 'Mês']]} value={periodo} onChange={(v) => { state.ui.progPeriodo = v; save(); }} /></div>

      <div className="section stats prog-stats">
        <div className="stat-tile"><div className="v digits" style={{ color: 'var(--c-treino)' }}>{sess.length}</div><div className="l">{sess.length === 1 ? 'treino' : 'treinos'}</div></div>
        <div className="stat-tile"><div className="v digits" style={{ color: 'var(--c-treino)' }}>{minAtivos >= 60
          ? <>{br(minAtivos / 60, 1)}<small style={{ fontSize: 14 }}> h</small></>
          : <>{Math.round(minAtivos)}<small style={{ fontSize: 14 }}> min</small></>}</div><div className="l">ativos</div></div>
        <div className="stat-tile"><div className="v digits" style={{ color: 'var(--c-dieta)' }}>{dietaOk ?? '—'}<small style={{ fontSize: 14 }}>/{periodo}</small></div><div className="l">dias de dieta completa</div></div>
        <div className="stat-tile"><div className="v digits" style={{ color: 'var(--c-rotina)' }}>{habPct ?? '—'}{habPct != null ? <small style={{ fontSize: 14 }}>%</small> : null}</div><div className="l">dos hábitos</div></div>
      </div>

      <Section title={`Constância · ${media}%`}>
        <div className="group pad">
          <div className={`const-grid ${periodo === 7 ? 'semana' : ''}`}>
            {DIAS_SEMANA.map((d, i) => <span key={`h${i}`} className="const-h">{d}</span>)}
            {Array.from({ length: vazios }, (_, i) => <span key={`v${i}`} />)}
            {notas.map(({ k, v }) => (
              <button key={k} type="button" className={`const-d ${k === fim ? 'hoje' : ''}`} onClick={() => openDay(k)}
                style={{ '--v': v }} aria-label={`${fmtDayLong(k)}: ${Math.round(v * 100)}%`}>
                <span className="num">{keyToDate(k).getDate()}</span></button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 10 }}>Quanto mais forte, mais você cumpriu de treino, refeições e hábitos no dia. Toque num dia para ver o resumo.</p>
        </div>
      </Section>

      <Section title="Peso" action={<button className="text-btn" onClick={() => openPeso()}>Atualizar</button>}>
        <div className="group">
          {cur && (
            <div className="hero"><div className="label">Peso atual · {fmtDay(cur.date)}</div>
              <div className="big">{br(cur.peso)}<small>kg</small></div>
              {dw != null && <span className={`tag delta num ${dw < 0 ? 'ok' : ''}`}>{dw > 0 ? '+' : ''}{br(dw)} kg desde {fmtDay(first.date)}</span>}</div>
          )}
          <Chart id="peso" points={wPts} unit="kg" />
        </div>
      </Section>

      <Section title="Carga por exercício">
        {names.length ? (
          <div className="group">
            <div className="pad" style={{ paddingBottom: 0 }}>
              <select aria-label="Exercício" value={sel} onChange={(e) => { state.ui.progressEx = e.target.value; save(); }}>
                {names.map((n) => <option key={n} value={n}>{n}</option>)}
              </select></div>
            {lPts.length > 0 && <div className="hero" style={{ paddingTop: 12 }}><div className="label">Maior carga recente</div><div className="big">{br(lPts[lPts.length - 1].y)}<small>kg</small></div></div>}
            <Chart key={sel} id="carga" points={lPts} unit="kg" className="treino" />
          </div>
        ) : <div className="group empty"><Illu nome="progresso" cor="var(--c-rotina)" /><div>Depois de alguns treinos, a evolução de cada exercício aparece aqui.</div></div>}
      </Section>

      <Section title="Últimos treinos" action={todosTreinos.length > 3 ? <button className="text-btn" onClick={() => openHistorico('treinos')}>Ver todos ({todosTreinos.length})</button> : null}>
        {recentes.length ? <div className="group">{recentes.map(linhaTreino)}</div>
          : <div className="group empty"><Illu nome="historico" /><div>Seus treinos concluídos aparecem aqui.</div></div>}
      </Section>

      <Section title="Atividades fora da academia">
        {ativRecentes.length ? (
          <>
            <div className="group">{ativRecentes.map(linhaAtividade)}</div>
            <div className="row-between" style={{ padding: '8px 4px 0' }}>
              <span className="hint">Segure uma atividade para remover.</span>
              {state.activities.length > 3 ? <button className="text-btn" onClick={() => openHistorico('atividades')}>Ver todas ({state.activities.length})</button> : null}
            </div>
          </>
        ) : <div className="group empty">Caminhada, corrida, bike, futebol… Registre no card Atividade da tela Hoje, e os minutos entram no seu resumo.</div>}
      </Section>
    </>
  );
}
