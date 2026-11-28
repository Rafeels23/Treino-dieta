/* Tela Progresso: resumo da semana ou do mês, constância dia a dia, peso, carga por exercício,
   e os últimos treinos e atividades (o histórico completo abre numa folha, sem lista gigante). */
import { useState } from 'react';
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
import { saude } from '../lib/pulseira.js';

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


/* números de um período (para comparar com o período anterior) */
function resumo(state, dias, sessoes) {
  const desde = keyToDate(dias[0]).getTime(), ate = keyToDate(dias[dias.length - 1]).getTime() + 864e5;
  const sess = sessoes.filter((s) => s.start >= desde && s.start < ate);
  const ativs = state.activities.filter((a) => a.date >= dias[0] && a.date <= dias[dias.length - 1]);
  const min = sess.reduce((t, s) => t + (s.end - s.start) / 60000, 0) + ativs.reduce((t, a) => t + (num(a.minutos) || 0), 0);
  const gs = state.diet.groups;
  const dieta = gs.length ? dias.filter((k) => state.dietLog[k] && gs.every((g) => mealCheck(state.dietLog[k], g))).length : null;
  let tot = 0, feitos = 0;
  dias.forEach((k) => { const rot = routinesOf(k), rlog = (state.routineLog || {})[k] || {}; tot += rot.length; feitos += rot.filter((r) => rlog[r.id]).length; });
  return { sess, treinos: sess.length, min, dieta, hab: tot ? Math.round((feitos / tot) * 100) : null };
}

/* setinha de comparação com o período anterior: ▲ melhorou, ▼ piorou */
function Delta({ v, unidade = '', casas = 0 }) {
  if (v == null || Number.isNaN(v)) return null;
  const r = casas ? Math.round(v * 10) / 10 : Math.round(v);
  if (!r) return <span className="delta-mini igual">= anterior</span>;
  return <span className={`delta-mini ${r > 0 ? 'sobe' : 'desce'}`}>{r > 0 ? '▲' : '▼'} {br(Math.abs(r), casas)}{unidade}</span>;
}

/* minigráfico de linha */
function Mini({ pts, w = 72, h = 26 }) {
  if (pts.length < 2) return <svg className="mini" width={w} height={h} aria-hidden="true" />;
  const min = Math.min(...pts), max = Math.max(...pts), amp = max - min || 1;
  const xy = pts.map((v, i) => `${((i / (pts.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - ((v - min) / amp) * (h - 6)).toFixed(1)}`);
  const ult = xy[xy.length - 1].split(',');
  return (
    <svg className="mini" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={xy.join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ult[0]} cy={ult[1]} r="3" fill="currentColor" />
    </svg>
  );
}

/* passos: semana atual (seg a dom) contra a semana passada */
function Passos() {
  const sd = saude();
  if (!sd.conectado || !sd.dias || !Object.keys(sd.dias).length) return null;
  const hoje = keyToDate(todayKey());
  const seg = new Date(hoje); seg.setDate(seg.getDate() - ((hoje.getDay() + 6) % 7));
  const semana = Array.from({ length: 7 }, (_, i) => { const d = new Date(seg); d.setDate(d.getDate() + i); return todayKey(d); });
  const passada = semana.map((k) => { const d = keyToDate(k); d.setDate(d.getDate() - 7); return todayKey(d); });
  const val = (k) => sd.dias[k]?.passos || 0;
  const hk = todayKey();
  const ate = semana.filter((k) => k <= hk);
  const media = (ks) => { const v = ks.map(val).filter((x) => x > 0); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; };
  const mAtual = media(ate), mPassada = media(passada);
  const topo = Math.max(1, ...semana.map(val), ...passada.map(val));
  const fmt = (n) => n.toLocaleString('pt-BR');
  return (
    <Section title="Passos">
      <div className="group pad passos">
        <div className="passos-nums">
          <div><div className="l">Hoje</div><div className="v digits">{fmt(val(hk))}</div></div>
          <div><div className="l">Média da semana</div><div className="v digits">{fmt(mAtual)}</div>
            {mPassada ? <Delta v={((mAtual - mPassada) / mPassada) * 100} unidade="%" /> : null}</div>
          <div><div className="l">Semana passada</div><div className="v digits fraco">{fmt(mPassada)}</div></div>
        </div>
        <div className="passos-barras" role="img" aria-label={`Passos por dia nesta semana. Média ${fmt(mAtual)}.`}>
          {semana.map((k, i) => (
            <div key={k} className={`pb ${k === hk ? 'hoje' : ''} ${k > hk ? 'futuro' : ''}`}>
              <div className="pb-col"><i className="ant" style={{ height: `${(val(passada[i]) / topo) * 100}%` }} /><i className="atu" style={{ height: `${(val(k) / topo) * 100}%` }} /></div>
              <span>{DIAS_SEMANA[i]}</span>
            </div>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 8 }}>Barra cheia: esta semana. Barra clara: o mesmo dia da semana passada.</p>
      </div>
    </Section>
  );
}

export default function Progresso() {
  const state = useStore();
  const [todosEx, setTodosEx] = useState(false);
  const periodo = state.ui.progPeriodo === 30 ? 30 : 7;
  const dias = diasDoPeriodo(periodo);
  const desde = keyToDate(dias[0]).getTime();
  const fim = todayKey();

  /* resumo do período e do período anterior, para comparar */
  const todas = emOrdem();
  const atual = resumo(state, dias, todas);
  const diasAnt = dias.map((k) => { const d = keyToDate(k); d.setDate(d.getDate() - periodo); return todayKey(d); });
  const ant = resumo(state, diasAnt, todas);
  const { sess, min: minAtivos, dieta: dietaOk, hab: habPct } = atual;
  const treinosPorDia = new Set(todas.map((s) => todayKey(new Date(s.start))));
  const temAnterior = todas.some((s) => s.start < desde) || state.activities.some((a) => a.date < dias[0]);

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
  const ultimaVez = (n) => { for (let i = todas.length - 1; i >= 0; i--) if (todas[i].exercises.some((e) => e.name === n)) return i; return -1; };
  names.sort((a, b) => ultimaVez(b) - ultimaVez(a));
  const sel = names.includes(state.ui.progressEx) ? state.ui.progressEx : names[0];
  const serie = (n) => todas.map((s) => { const e = s.exercises.find((x) => x.name === n); const kgs = e ? e.sets.map((x) => num(x.kg)).filter((v) => v != null) : []; return kgs.length ? Math.max(...kgs) : null; }).filter((v) => v != null);
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
        <div className="stat-tile"><div className="v digits">{sess.length}</div><div className="l"><i className="pt" style={{ background: 'var(--c-treino)' }} />{sess.length === 1 ? 'treino' : 'treinos'}</div>
          {periodo === 7 ? <div className="dots-semana" aria-label={`Treinou em ${dias.filter((k) => treinosPorDia.has(k)).length} dos 7 dias`}>
            {dias.map((k) => <i key={k} className={treinosPorDia.has(k) ? 'on' : ''} title={fmtDay(k)} />)}</div> : null}
          {temAnterior ? <Delta v={atual.treinos - ant.treinos} /> : null}</div>
        <div className="stat-tile"><div className="v digits">{minAtivos >= 60
          ? <>{br(minAtivos / 60, 1)}<small style={{ fontSize: 14 }}> h</small></>
          : <>{Math.round(minAtivos)}<small style={{ fontSize: 14 }}> min</small></>}</div><div className="l"><i className="pt" style={{ background: 'var(--c-treino)' }} />ativos</div>
          {temAnterior ? <Delta v={atual.min - ant.min} unidade=" min" /> : null}</div>
        <div className="stat-tile"><div className="v digits">{dietaOk ?? '—'}<small style={{ fontSize: 14 }}>/{periodo}</small></div><div className="l"><i className="pt" style={{ background: 'var(--c-dieta)' }} />dias de dieta completa</div>
          {temAnterior && dietaOk != null ? <Delta v={atual.dieta - ant.dieta} /> : null}</div>
        <div className="stat-tile"><div className="v digits">{habPct ?? '—'}{habPct != null ? <small style={{ fontSize: 14 }}>%</small> : null}</div><div className="l"><i className="pt" style={{ background: 'var(--c-rotina)' }} />dos hábitos</div>
          {temAnterior && habPct != null && ant.hab != null ? <Delta v={atual.hab - ant.hab} unidade=" pts" /> : null}</div>
      </div>
      <p className="hint prog-comp">{periodo === 7 ? 'Setas: comparado com os 7 dias anteriores.' : 'Setas: comparado com os 30 dias anteriores.'}</p>

      <Passos />

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
            {lPts.length > 0 && <div className="hero" style={{ paddingTop: 14 }}><div className="label">{sel} · maior carga recente</div><div className="big">{br(lPts[lPts.length - 1].y)}<small>kg</small></div></div>}
            <Chart key={sel} id="carga" points={lPts} unit="kg" className="treino" />
            <div className="ex-lista">
              {(todosEx ? names : names.slice(0, 5)).map((n) => {
                const pts = serie(n), dif = pts.length > 1 ? pts[pts.length - 1] - pts[0] : 0;
                return (
                  <button key={n} type="button" className={`row plain ex-linha ${n === sel ? 'on' : ''}`} aria-pressed={n === sel}
                    onClick={() => { state.ui.progressEx = n; save(); }}>
                    <span className="body"><div className="t">{n}</div>
                      <div className="s num">{pts.length} {pts.length === 1 ? 'treino' : 'treinos'} · {br(pts[pts.length - 1])} kg{dif ? <span className={dif > 0 ? 'sobe' : 'desce'}> · {dif > 0 ? '+' : '−'}{br(Math.abs(dif))} kg</span> : null}</div></span>
                    <span className="end ex-mini"><Mini pts={pts.slice(-12)} /></span>
                  </button>
                );
              })}
            </div>
            {names.length > 5 ? <button type="button" className="text-btn ex-mais" onClick={() => setTodosEx((v) => !v)}>{todosEx ? 'Mostrar menos' : `Ver todos os exercícios (${names.length})`}</button> : null}
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
