/* Fora do plano: foto e/ou descrição; a IA estima as calorias (ou a pessoa informa). */
import { useEffect, useState } from 'react';
import { soInteiro } from '../lib/campos.js';
import { state, save, todayKey, dayLog, num, br, pickImage, shrink, estimateFood, aiErrorText } from '../lib/core.js';
import { openSheet, closeSheet } from '../lib/ui.js';
import { Icon, SheetActions, Pensando } from '../components/ui.jsx';

const AI_LABEL = { idle: 'Calcular calorias com IA', busy: 'Calculando…', done: 'Calcular de novo', err: 'Tentar de novo' };

function ExtraSheet() {
  const hasKey = true; // a IA do Pilar roda no servidor; a chave no celular é opcional
  const [text, setText] = useState('');
  const [kcal, setKcal] = useState('');
  const [hora, setHora] = useState(() => new Date().toTimeString().slice(0, 5));
  const [pending, setPending] = useState(null);   // { blob, result }
  const [preview, setPreview] = useState(null);
  const [ai, setAi] = useState('idle');
  const [err, setErr] = useState('');

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const photo = async () => {
    const f = await pickImage();
    if (!f) return;
    const blob = await shrink(f);
    setPending({ blob });
    setPreview(URL.createObjectURL(blob));
  };

  const calc = async () => {
    const t = text.trim(), blob = pending?.blob;
    if (!blob && !t) { alert('Tire uma foto ou descreva o alimento primeiro.'); return; }
    setAi('busy');
    try {
      const r = await estimateFood({ blob, text: t });
      setPending((p) => ({ ...(p || {}), result: r }));
      setKcal(String(Math.round(r.kcal)));
      if (!t) setText(`${r.alimento} (${r.porcao})`);
      setErr('');
      setAi('done');
    } catch (e) {
      setErr(aiErrorText(e));
      setAi('err');
    }
  };

  const add = () => {
    const r = pending?.result;
    const t = text.trim() || (r ? `${r.alimento} (${r.porcao})` : '');
    if (!t) { alert('Descreva o que comeu ou use a foto com a IA.'); return; }
    dayLog(state.ui.dietDay || todayKey()).extras.push({
      text: t, time: hora, kcal: num(kcal),
      ...(r ? { ai: true, proteina: r.proteina_g, carbo: r.carboidrato_g, gordura: r.gordura_g } : {}),
    });
    save(); closeSheet();
  };

  const r = ai === 'done' ? pending?.result : null;
  return (
    <>
      <h2>Fora do plano</h2><p className="lead">Tire uma foto do alimento (ou da embalagem) e/ou descreva. A IA estima as calorias.</p>
      <div className="food-pick">
        <button type="button" className="photo-slot" onClick={photo} aria-label="Tirar ou escolher foto">
          <span id="food-prev">{preview ? <img src={preview} alt="Foto do alimento" /> : <><Icon n="camera" /><small>Foto</small></>}</span>
        </button>
        <div className="field" style={{ flex: 1, margin: 0 }}>
          <textarea name="text" style={{ minHeight: 96 }} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="ex.: 1 barra de chocolate ao leite, uns 3 quadradinhos" /></div>
      </div>
      {hasKey
        ? <button type="button" className="btn soft block" style={{ marginTop: 12 }} disabled={ai === 'busy'} onClick={calc}>{ai === 'busy' ? <Pensando /> : null}{AI_LABEL[ai]}</button>
        : <p className="hint" style={{ marginTop: 12 }}>Para calcular com IA, configure a chave em <b>Perfil › Assistente IA</b>. Sem ela, você pode informar as calorias abaixo.</p>}
      <div id="food-result">
        {r ? (
          <div className="food ai-card">
            <div className="row-between"><div><div className="t">{r.alimento}</div><div className="s">{r.porcao}</div></div>
              <div className="kcal num">{Math.round(r.kcal)}<small> kcal</small></div></div>
            <div className="macros num"><span>Proteína <b>{br(r.proteina_g)} g</b></span><span>Carbo <b>{br(r.carboidrato_g)} g</b></span><span>Gordura <b>{br(r.gordura_g)} g</b></span></div>
            <div className="s" style={{ marginTop: 8 }}>{r.observacao} · confiança {r.confianca === 'media' ? 'média' : r.confianca}</div>
          </div>
        ) : null}
        {ai === 'err' ? <p className="hint" style={{ marginTop: 10, color: 'var(--danger)' }}>{err}</p> : null}
      </div>
      <div className="two" style={{ marginTop: 12 }}>
        <div className="field"><label>Calorias (kcal)</label><input name="kcal" inputMode="numeric" placeholder="opcional" value={kcal} onChange={(e) => setKcal(soInteiro(e.target.value, 4))} /></div>
        <div className="field"><label>Horário</label><input name="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
      </div>
      <SheetActions onCancel={closeSheet} onOk={add} ok="Adicionar" />
    </>
  );
}

export function openExtra() { openSheet(() => <ExtraSheet />); }
