/* Tela Progresso: números de 30 dias, peso, carga por exercício, treinos recentes e atividades extras. */
import { Head, Section, Icon } from '../components/ui.jsx';
import Illu from '../components/Illu.jsx';
import Chart from '../components/Chart.jsx';
import { useStore } from '../lib/hooks.js';
import { morningSorted, fmtDay, fmtDayLong, todayKey, keyToDate, br, num, cap, finished, mealCheck, save } from '../lib/core.js';
import { openSession } from '../sheets/treino.jsx';
import { openPeso, openActivity, deleteActivity } from '../sheets/perfil.jsx';

export default function Progresso() {
  const state = useStore();
  const ms = morningSorted().filter((x) => x.peso != null).slice(-60);
  const wPts = ms.map((x) => ({ y: x.peso, label: fmtDay(x.date) }));
  const cur = ms[ms.length - 1], first = ms[0];
  const dw = cur && ms.length > 1 ? cur.peso - first.peso : null;
  const pesoHero = cur && (
    <div className="hero"><div className="label">Peso atual</div>
      <div className="big">{br(cur.peso)}<small>kg</small></div>
      {dw != null && <span className={`tag delta num ${dw < 0 ? 'ok' : ''}`}>{dw > 0 ? '+' : ''}{br(dw)} kg desde {fmtDay(first.date)}</span>}</div>
  );
  const since = Date.now() - 30 * 864e5;
  const last30 = finished().filter((s) => s.start >= since);
  const minutes30 = last30.reduce((t, s) => t + (s.end - s.start) / 60000, 0);
  const groupsN = state.diet.groups.length;
  const dietDays = groupsN ? Object.entries(state.dietLog).filter(([d, l]) => keyToDate(d).getTime() >= since && state.diet.groups.every((g) => mealCheck(l, g))).length : 0;
  const stats = (
    <div className="section stats">
      <div className="stat-tile"><div className="v digits" style={{ color: 'var(--c-treino)' }}>{last30.length}</div><div className="l">treinos em 30 dias</div></div>
      <div className="stat-tile"><div className="v digits" style={{ color: 'var(--c-treino)' }}>{minutes30 >= 60
        ? <>{br(minutes30 / 60, 1)}<small style={{ fontSize: 14 }}> h</small></>
        : <>{Math.round(minutes30)}<small style={{ fontSize: 14 }}> min</small></>}</div><div className="l">treinando</div></div>
      <div className="stat-tile"><div className="v digits" style={{ color: 'var(--c-dieta)' }}>{dietDays}</div><div className="l">dias com dieta completa</div></div>
    </div>
  );

  const names = [...new Set(finished().flatMap((s) => s.exercises.filter((e) => e.tipo === 'carga' && e.sets.some((x) => num(x.kg))).map((e) => e.name)))];
  const sel = names.includes(state.ui.progressEx) ? state.ui.progressEx : names[0];
  const lPts = sel ? finished().map((s) => {
    const e = s.exercises.find((x) => x.name === sel);
    const kgs = e ? e.sets.map((x) => num(x.kg)).filter((v) => v != null) : [];
    return kgs.length ? { y: Math.max(...kgs), label: fmtDay(todayKey(new Date(s.start))) } : null;
  }).filter(Boolean) : [];

  const recent = finished().slice(-12).reverse();
  const activities = state.activities.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  return (
    <>
      <Head kicker="Seu progresso" title="Progresso" />
      {stats}
      <Section title="Peso" action={<button className="text-btn" onClick={() => openPeso()}>+ Pesagem</button>}>
        <div className="group">{pesoHero}<Chart id="peso" points={wPts} unit="kg" /></div>
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
      <Section title="Treinos recentes">
        {recent.length ? (
          <div className="group">{recent.map((s) => (
            <button key={s.id} className="row plain" onClick={() => openSession(s.id)}><span className="body"><div className="t">{s.workoutName}</div>
              <div className="s num">{cap(fmtDayLong(todayKey(new Date(s.start))))} · {Math.round((s.end - s.start) / 60000)} min · {s.exercises.reduce((n, e) => n + e.sets.length, 0)} séries</div></span>
              <span className="end"><Icon n="right" /></span></button>
          ))}</div>
        ) : <div className="group empty"><Icon n="history" /><div>Seus treinos concluídos aparecem aqui.</div></div>}
      </Section>
      <Section title="Atividades extras" action={<button className="text-btn" onClick={() => openActivity()}>+ Adicionar</button>}>
        {activities.length ? (
          <div className="group">{activities.map((a) => (
            <div key={a.id} className="row plain"><span className="body"><div className="t">{a.tipo}</div>
              <div className="s num">{fmtDay(a.date)}{a.minutos ? ` · ${a.minutos} min` : ''}{a.kcal ? ` · ${a.kcal} kcal` : ''}{a.passos ? ` · ${a.passos.toLocaleString('pt-BR')} passos` : ''}</div></span>
              <button className="text-btn" style={{ color: 'var(--ink-3)' }} onClick={() => deleteActivity(a.id)}>Remover</button></div>
          ))}</div>
        ) : <div className="group empty">Nada registrado ainda.</div>}
      </Section>
    </>
  );
}
