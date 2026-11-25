/* Folhas da área Perfil: peso, pesagem, relatório de peso, atividades, dados pessoais,
   chave da IA e backup. Algumas são usadas por outras telas (Hoje, Progresso). */
import { useState } from 'react';
import {
  state, save, replaceState, uid, todayKey, num, br, cap, fmtDay, fmtDayLong,
  defaultState, migrate, weightFeedback, latestWeight, morningSorted, keyToDate,
} from '../lib/core.js';
import { openSheet, closeSheet } from '../lib/ui.js';
import { buzz } from '../lib/effects.js';
import { stopTimer } from '../lib/timer.js';
import { Seg, SheetActions, CountUp } from '../components/ui.jsx';
import Chart from '../components/Chart.jsx';

/* ----- cartão do IMC (faixa saudável) ----- */
export function WeightCard({ fb }) {
  const pos = Math.max(0, Math.min(100, ((fb.imc - 15) / (40 - 15)) * 100));
  const seg = (a, b, cls, label) => <div className={`imc-seg ${cls}`} style={{ width: `${((b - a) / 25) * 100}%` }}><span>{label}</span></div>;
  return (
    <div className="group pad">
      <div className="row-between"><div><div className="hint">IMC</div><div className="stat num">{br(fb.imc)}</div></div>
        <span className={`tag ${fb.imc >= 18.5 && fb.imc < 25 ? 'ok' : ''}`}>{cap(fb.faixa)}</span></div>
      <div className="imc-bar">{seg(15, 18.5, '', 'Abaixo')}{seg(18.5, 25, 'good', 'Saudável')}{seg(25, 30, '', 'Sobrepeso')}{seg(30, 40, '', 'Obesidade')}<i style={{ left: `${pos}%` }} /></div>
      <p style={{ marginTop: 28 }}>{fb.msg}</p>
      <p className="hint" style={{ marginTop: 6 }}>Para a sua altura, a faixa saudável vai de <b className="num">{br(fb.min)}</b> a <b className="num">{br(fb.max)} kg</b>. O IMC é uma referência geral para adultos e não diferencia músculo de gordura. Sua nutricionista avalia melhor o seu caso.</p>
    </div>
  );
}

/* ----- Peso: atualizar quando quiser, sem cobrança diária ----- */
function PesoSheet() {
  const key = todayKey();
  const [ini] = useState(() => {
    const m = state.morning.find((x) => x.date === key) || {};
    const ult = morningSorted().filter((x) => x.peso != null).pop();
    const dias = ult ? Math.round((keyToDate(key) - keyToDate(ult.date)) / 864e5) : null;
    return { w: latestWeight(), dias, peso: m.peso != null ? br(m.peso) : '' };
  });
  const [peso, setPeso] = useState(ini.peso);
  const [data, setData] = useState(key);
  const p = state.profile;
  const ok = () => {
    const v = num(peso);
    if (v == null) { alert('Informe o peso.'); return; }
    const d = data || key;
    const old = state.morning.find((x) => x.date === d);
    /* preserva sono e disposição de um registro que já exista nessa data */
    state.morning = state.morning.filter((x) => x.date !== d)
      .concat({ date: d, peso: v, sono: old?.sono ?? null, disposicao: old?.disposicao ?? null });
    buzz(); save(); closeSheet();
  };
  return (
    <>
      <h2>Atualizar peso</h2>
      <p className="lead">{ini.w != null
        ? `Último peso: ${br(ini.w)} kg${ini.dias ? `, há ${ini.dias} ${ini.dias === 1 ? 'dia' : 'dias'}` : ', hoje'}. Atualize uma vez por semana ou por mês, de preferência no mesmo horário.`
        : 'Informe seu peso atual. Depois, atualize uma vez por semana ou por mês.'}</p>
      <div className="field"><input className="big-input" name="peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0,0 kg" aria-label="Peso em kg" autoFocus /></div>
      <div className="field"><label>Data</label><input name="data" type="date" value={data} max={key} onChange={(e) => setData(e.target.value)} /></div>
      {p.meta ? <p className="hint">Sua meta é {br(p.meta)} kg.</p> : null}
      <SheetActions onCancel={closeSheet} onOk={ok} ok="Atualizar" />
    </>
  );
}
export function openPeso() { openSheet(() => <PesoSheet />); }

/* ----- Relatório de peso: a linha ao longo do tempo e o histórico ----- */
function PesoReportSheet() {
  const ms = morningSorted().filter((x) => x.peso != null);
  const p = state.profile;
  if (!ms.length) {
    return (
      <>
        <h2>Relatório de peso</h2><p className="lead">Nenhum peso registrado ainda.</p>
        <button type="button" className="btn block" onClick={openPeso}>Informar meu peso</button>
      </>
    );
  }
  const pts = ms.slice(-60).map((x) => ({ y: x.peso, label: fmtDay(x.date) }));
  const cur = ms[ms.length - 1], first = ms[0];
  const dTotal = ms.length > 1 ? cur.peso - first.peso : null;
  const fb = weightFeedback(cur.peso, p.altura);
  const hist = ms.slice().reverse().slice(0, 30);
  return (
    <>
      <h2>Relatório de peso</h2>
      <p className="lead">{ms.length} {ms.length === 1 ? 'registro' : 'registros'} · de {fmtDay(first.date)} até {fmtDay(cur.date)}</p>
      <div className="group pad row-between" style={{ marginBottom: 12 }}>
        <div><div className="hint">Peso atual</div><div className="stat num"><CountUp value={cur.peso} dec={1} k="peso" /><small> kg</small></div></div>
        {dTotal != null ? <span className={`tag delta num ${dTotal < 0 ? 'ok' : ''}`}>{dTotal > 0 ? '+' : ''}{br(dTotal)} kg no total</span> : null}
      </div>
      {p.meta ? <p className="hint" style={{ marginBottom: 12 }}>{Math.abs(cur.peso - p.meta) < 0.05 ? 'Você chegou na meta.' : `Faltam ${br(Math.abs(cur.peso - p.meta))} kg para a meta de ${br(p.meta)} kg.`}</p> : null}
      {ms.length > 1
        ? <div className="group" style={{ marginBottom: 12 }}><Chart id="peso-rep" points={pts} unit="kg" /></div>
        : <p className="hint">Registre pelo menos dois dias para ver a linha.</p>}
      {fb ? <><div className="sub-head">Faixa saudável</div><WeightCard fb={fb} /></> : null}
      <div className="sub-head">Histórico</div>
      <div className="group">{hist.map((x, i) => {
        const ant = hist[i + 1], d = ant ? x.peso - ant.peso : null;
        return (
          <div key={x.date} className="row plain"><span className="body"><div className="t num">{br(x.peso)} kg</div>
            <div className="s">{cap(fmtDayLong(x.date))}</div></span>
            <span className="end">{d != null ? <span className="num" style={{ color: d < 0 ? 'var(--c-dieta)' : d > 0 ? 'var(--ink-2)' : 'var(--ink-3)' }}>{d > 0 ? '+' : ''}{br(d)} kg</span> : null}</span></div>
        );
      })}</div>
      <button type="button" className="btn block" style={{ marginTop: 14 }} onClick={openPeso}>Atualizar peso</button>
    </>
  );
}
export function openPesoReport() { openSheet(() => <PesoReportSheet />); }


/* ----- Atividades ----- */
function ActivitySheet() {
  const [tipo, setTipo] = useState('Caminhada');
  const [minutos, setMinutos] = useState('');
  const [kcal, setKcal] = useState('');
  const [passos, setPassos] = useState('');
  const [date, setDate] = useState(todayKey());
  const ok = () => {
    state.activities.push({ id: uid(), tipo: tipo || 'Outro', minutos: num(minutos), kcal: num(kcal), passos: num(passos), date: date || todayKey(), fonte: 'manual' });
    save(); closeSheet();
  };
  return (
    <>
      <h2>Atividade extra</h2><p className="lead">Até a integração com o relógio, registre aqui.</p>
      <div className="field"><label>Tipo</label>
        <Seg options={[['Caminhada', 'Caminhada'], ['Corrida', 'Corrida'], ['Bicicleta', 'Bike'], ['Outro', 'Outro']]} value={tipo} onChange={setTipo} /></div>
      <div className="two"><div className="field"><label>Minutos</label><input name="minutos" inputMode="numeric" value={minutos} onChange={(e) => setMinutos(e.target.value)} /></div>
        <div className="field"><label>Calorias</label><input name="kcal" inputMode="numeric" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} /></div></div>
      <div className="two"><div className="field"><label>Passos</label><input name="passos" inputMode="numeric" value={passos} onChange={(e) => setPassos(e.target.value)} /></div>
        <div className="field"><label>Data</label><input name="date" type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} /></div></div>
      <SheetActions onCancel={closeSheet} onOk={ok} ok="Adicionar" />
    </>
  );
}
export function openActivity() { openSheet(() => <ActivitySheet />); }
export function deleteActivity(id) { state.activities = state.activities.filter((a) => a.id !== id); save(); }

/* ----- Dados pessoais ----- */
function WeightInfoSheet({ fb }) {
  return (
    <>
      <h2>Sobre o seu peso</h2><WeightCard fb={fb} />
      <div className="stack-btns"><button type="button" className="btn block" onClick={closeSheet}>Entendi</button></div>
    </>
  );
}
function EditProfileSheet() {
  const [ini] = useState(() => ({ p: { ...state.profile }, w: latestWeight() }));
  const { p: p0, w } = ini;
  const [f, setF] = useState({
    nome: p0.nome || '', idade: p0.idade ? String(p0.idade) : '', altura: p0.altura ? String(p0.altura) : '',
    sexo: p0.sexo || '', peso: w != null ? br(w) : '', meta: p0.meta ? br(p0.meta) : '', nutri: p0.nutri || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e && e.target ? e.target.value : e });
  const ok = () => {
    const p = state.profile, alt = num(f.altura);
    Object.assign(p, {
      nome: f.nome.trim(), idade: num(f.idade), sexo: f.sexo,
      altura: alt && alt < 3 ? Math.round(alt * 100) : alt, meta: num(f.meta), nutri: f.nutri.trim(),
    });
    const peso = num(f.peso);
    if (peso != null && peso !== w) {
      const key = todayKey(), cur = state.morning.find((x) => x.date === key);
      if (cur) cur.peso = peso; else state.morning.push({ date: key, peso, sono: null, disposicao: null });
    }
    save();
    const fb = weightFeedback(latestWeight(), p.altura);
    if (fb) openSheet(() => <WeightInfoSheet fb={fb} />);
    else closeSheet();
  };
  return (
    <>
      <h2>Seus dados</h2><p className="lead">Ficam só no seu celular. Ajudam a acompanhar a evolução e, no futuro, a IA.</p>
      <div className="field"><label>Nome</label><input name="nome" value={f.nome} onChange={set('nome')} autoComplete="name" placeholder="Como quer ser chamado" /></div>
      <div className="two"><div className="field"><label>Idade</label><input name="idade" inputMode="numeric" value={f.idade} onChange={set('idade')} placeholder="anos" /></div>
        <div className="field"><label>Altura (cm)</label><input name="altura" inputMode="numeric" value={f.altura} onChange={set('altura')} placeholder="ex.: 175" /></div></div>
      <div className="field"><label>Sexo</label><Seg options={[['m', 'Masculino'], ['f', 'Feminino']]} value={f.sexo} onChange={set('sexo')} toggle /></div>
      <div className="two"><div className="field"><label>Peso atual (kg)</label><input name="peso" inputMode="decimal" value={f.peso} onChange={set('peso')} /></div>
        <div className="field"><label>Meta (kg)</label><input name="meta" inputMode="decimal" value={f.meta} onChange={set('meta')} /></div></div>
      <div className="field"><label>Nutricionista</label><input name="nutri" value={f.nutri} onChange={set('nutri')} placeholder="opcional" /></div>
      <SheetActions onCancel={closeSheet} onOk={ok} />
    </>
  );
}
export function openEditProfile() { openSheet(() => <EditProfileSheet />); }

/* ----- Assistente IA ----- */
function AiKeySheet() {
  const [key, setKey] = useState(state.ai?.key || '');
  const ok = () => {
    const k = key.trim();
    state.ai = k ? { key: k } : undefined;
    save(); closeSheet();
  };
  const remover = () => { delete state.ai; save(); closeSheet(); };
  return (
    <>
      <h2>Assistente IA</h2>
      <p className="lead">A IA calcula as calorias dos alimentos fora do plano, por foto ou descrição.</p>
      <div className="food"><div className="s">1. Crie uma chave em <b>console.anthropic.com</b> (menu API Keys) e adicione créditos.<br />
        2. Cole a chave abaixo. Cada cálculo custa poucos centavos.<br />
        3. A chave fica salva só neste celular e não vai no backup.</div></div>
      <div className="field" style={{ marginTop: 12 }}><label>Chave da API</label>
        <input name="key" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..." /></div>
      {state.ai?.key ? <button type="button" className="btn danger block" onClick={remover}>Remover chave</button> : null}
      <SheetActions onCancel={closeSheet} onOk={ok} />
    </>
  );
}
export function openAiKey() { openSheet(() => <AiKeySheet />); }

/* ----- Backup ----- */
export function exportBackup() {
  const blob = new Blob([JSON.stringify({ ...state, active: null, ai: undefined })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `treino-dieta-backup-${todayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export function importBackup() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (!data?.plan || !Array.isArray(data.sessions)) throw new Error('o arquivo não é um backup deste app');
      if (!confirm('Substituir os dados atuais pelo backup?')) return;
      delete data.fotos;
      const ai = state.ai;
      replaceState(migrate(Object.assign(defaultState(), data)));
      if (ai) { state.ai = ai; save(); }
      closeSheet();
    } catch (e) { alert('Não consegui importar: ' + e.message); }
  };
  inp.click();
}
export function resetAll() {
  if (!confirm('Apagar TODOS os dados? Isso não pode ser desfeito.')) return;
  if (!confirm('Tem certeza? Faça um backup antes se quiser guardar.')) return;
  stopTimer(); replaceState(defaultState()); closeSheet();
}
