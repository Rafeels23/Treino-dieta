/* Ajustes da água: meta do dia (litros) e lembretes (horário e intervalo; o app divide a meta).
   Usado na folha da água (Dieta) e em Perfil › Lembretes. */
import { useState } from 'react';
import { useStore } from '../lib/hooks.js';
import { config, ligar, ajustarAgua, aguaHorarios, aguaCopo, aguaMeta, INTERVALOS, ehNativo } from '../lib/lembretes.js';
import { avisoPush } from '../lib/push.js';

const METAS = [1500, 2000, 2500, 3000, 3500];
const litros = (ml) => (ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function MetaAgua() {
  useStore();
  const c = config(), meta = aguaMeta(c);
  return (
    <div className="field"><label>Meta de água por dia</label>
      <div className="chips">{METAS.map((v) => (
        <button key={v} type="button" className={`chip ${meta === v ? 'on' : ''}`} onClick={() => ajustarAgua({ aguaMeta: v })}>{litros(v)} L</button>
      ))}</div>
      <div className="meta-outra">
        <span>Outra:</span>
        <input inputMode="decimal" defaultValue={litros(meta)} key={meta} aria-label="Meta em litros"
          onBlur={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); if (v > 0 && v <= 8) ajustarAgua({ aguaMeta: Math.round(v * 1000) }); }} />
        <span>litros</span>
      </div>
    </div>
  );
}

export function LembretesAgua() {
  useStore();
  const c = config();
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const alternar = async () => { setBusy(true); setMsg(''); const e = await ligar('agua', !c.agua); setBusy(false); if (e) setMsg(e); };
  const n = aguaHorarios(c).length;
  return (
    <>
      <button type="button" className="row plain lemb-agua" onClick={alternar} disabled={busy} aria-pressed={c.agua}>
        <span className="body"><div className="t">Lembretes de água</div>
          <div className="s">{c.agua ? `${n} lembretes de ${aguaCopo(c)} ml` : 'Notificação para lembrar de beber'}</div></span>
        <span className="end"><span className={`switch ${c.agua ? 'on' : ''}`} aria-hidden="true"><i /></span></span>
      </button>
      {c.agua ? (
        <div className="agua-ajuste">
          <div className="two">
            <div className="field"><label>Das</label><input type="time" value={c.aguaInicio} onChange={(e) => e.target.value && ajustarAgua({ aguaInicio: e.target.value })} /></div>
            <div className="field"><label>Até</label><input type="time" value={c.aguaFim} onChange={(e) => e.target.value && ajustarAgua({ aguaFim: e.target.value })} /></div>
          </div>
          <div className="field"><label>Lembrar a cada</label>
            <select value={c.aguaIntervalo} onChange={(e) => ajustarAgua({ aguaIntervalo: Number(e.target.value) })}>
              {INTERVALOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <p className="hint">O app divide a meta pelos lembretes: {n} × {aguaCopo(c)} ml ≈ {litros(n * aguaCopo(c))} L.
            {ehNativo() ? ' Na notificação, ✓ soma o copo sem abrir o app.' : ''}</p>
        </div>
      ) : (!ehNativo() && avisoPush() ? <p className="hint">{avisoPush()}</p> : null)}
      {msg ? <p className="hint" style={{ color: 'var(--danger)' }}>{msg}</p> : null}
    </>
  );
}
