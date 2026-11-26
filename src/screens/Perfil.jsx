import { Section, Icon } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';
import { go } from '../lib/ui.js';
import { br, initials, latestWeight, weightFeedback, LEVEL_LABEL } from '../lib/core.js';
import {
  WeightCard, openPeso, openPesoReport, openEditProfile, openAiKey, exportBackup, importBackup, resetAll,
} from '../sheets/perfil.jsx';
import { openPlanSettings } from '../sheets/treino.jsx';
import { openDietEditor } from '../sheets/dieta.jsx';
import { useSyncExternalStore } from 'react';
import { getAccount, subscribeAccount, signOut, pull } from '../lib/cloud.js';
import { Seg } from '../components/ui.jsx';
import { getThemePref, setThemePref, subscribeTheme } from '../lib/theme.js';
import { useState } from 'react';
import { config as lembConfig, ligar as lembLigar, ehNativo } from '../lib/lembretes.js';
import { avisoPush } from '../lib/push.js';
import { MetaAgua, LembretesAgua } from '../components/AguaAjustes.jsx';

function Kv({ label, value }) {
  return (
    <button className="row plain kv" onClick={openEditProfile}>
      <span className="body"><div className="t">{label}</div></span>
      <span className="end">{value != null && value !== '' ? <span className="v num">{value}</span> : <span>Adicionar</span>}</span>
    </button>
  );
}

export default function Perfil() {
  const state = useStore();
  const p = state.profile;
  const w = latestWeight();
  const fb = weightFeedback(w, p.altura);
  const groups = state.diet.groups;

  return (
    <>
      <header className="head profile-head">
        <button className="icon-btn" onClick={() => go('hoje')} aria-label="Voltar"><Icon n="left" /></button>
        <div className="avatar big">{p.nome ? initials(p.nome) : <Icon n="user" />}</div>
        <div><div className="kicker">Seu perfil</div><h1>{p.nome || 'Perfil'}</h1></div>
      </header>

      {fb ? <Section title="Seu peso"><WeightCard fb={fb} /></Section>
        : (w || p.altura ? <div className="section"><div className="group empty">Informe {w ? 'a altura' : 'o peso'} para ver se o seu peso está numa faixa saudável.</div></div> : null)}

      {w && p.meta ? (
        <div className="section"><div className="group pad row-between"><div><div className="hint">Até a meta de {br(p.meta)} kg</div>
          <div className="stat num">{Math.abs(w - p.meta) < 0.05 ? 'Chegou!' : <>{br(Math.abs(w - p.meta))}<small> kg</small></>}</div></div>
          {p.meta < fb?.min || p.meta > fb?.max ? <span className="tag">Meta fora da faixa saudável</span> : null}</div></div>
      ) : null}

      <Section title="Dados pessoais" action={<button className="text-btn" onClick={openEditProfile}>Editar</button>}>
        <div className="group">
          <Kv label="Nome" value={p.nome || ''} />
          <Kv label="Idade" value={p.idade ? `${p.idade} anos` : ''} />
          <Kv label="Sexo" value={p.sexo ? (p.sexo === 'm' ? 'Masculino' : 'Feminino') : ''} />
          <Kv label="Altura" value={p.altura ? `${br(p.altura / 100, 2)} m` : ''} />
          <div className="row plain kv split">
            <button className="kv-main" onClick={openPeso}><span className="body"><div className="t">Peso atual</div></span>
              <span className="end">{w != null ? <span className="v num">{br(w)} kg</span> : <span>Atualizar</span>}</span></button>
            <button className="kv-side" onClick={openPesoReport} aria-label="Relatório de peso" title="Relatório de peso"><Icon n="chart" /></button>
          </div>
          <Kv label="Meta de peso" value={p.meta ? `${br(p.meta)} kg` : ''} />
          <Kv label="Nutricionista" value={p.nutri || ''} />
        </div>
      </Section>

      <Section title="Treino">
        <div className="group"><button className="row plain" onClick={() => openPlanSettings()}><span className="body"><div className="t">Plano de treino</div>
          <div className="s">Emagrecimento · {p.dias}x por semana · {LEVEL_LABEL[p.nivel]}</div></span><span className="end"><Icon n="right" /></span></button></div>
      </Section>

      <Section title="Alimentação">
        <div className="group"><button className="row plain" onClick={() => openDietEditor()}>
          <span className="body"><div className="t">Montar refeições</div>
            <div className="s">{groups.length ? `${groups.length} ${groups.length === 1 ? 'refeição' : 'refeições'} · ${groups.reduce((t, g) => t + g.options.length, 0)} opções` : 'Café, almoço, lanche, jantar, ceia…'}</div></span>
          <span className="end"><Icon n="right" /></span></button></div>
      </Section>

      <Section title="Assistente IA">
        <div className="group"><button className="row plain" onClick={openAiKey}><span className="body"><div className="t">Cálculo de calorias por foto</div>
          <div className="s">{state.ai?.key ? 'Usando a chave deste celular' : 'Pela conta do Pilar, para vocês dois'}</div></span>
          <span className="end"><span className="tag ok">Ativo</span><Icon n="right" /></span></button></div>
      </Section>

      <LembretesSection />

      <AparenciaSection />

      <ContaSection />

      <Section title="Seus dados">
        <div className="group">
          <button className="row plain" onClick={exportBackup}><span className="body"><div className="t">Exportar backup</div><div className="s">Salva um arquivo com todos os seus dados</div></span></button>
          <button className="row plain" onClick={importBackup}><span className="body"><div className="t">Importar backup</div><div className="s">Restaura a partir de um arquivo</div></span></button>
        </div>
        <p className="hint" style={{ padding: '10px 4px 0' }}>Fica salvo no celular e na sua conta. O backup é uma cópia extra em arquivo.</p>
        <div className="stack-btns"><button className="btn danger block" onClick={resetAll}>Apagar todos os dados</button></div>
      </Section>
      <p className="hint credits">Animações: Microsoft Fluent Emoji (MIT) e Google Noto Emoji (CC BY 4.0).</p>
    </>
  );
}

const SYNC_TXT = { idle: 'Sincronizado', ok: 'Sincronizado', saving: 'Sincronizando…', offline: 'Sem internet: sincroniza quando voltar', error: 'Não sincronizou. Toque para tentar de novo' };
function ContaSection() {
  const acc = useSyncExternalStore(subscribeAccount, getAccount);
  const sair = async () => { if (confirm('Sair da conta? Os dados ficam salvos na nuvem e voltam quando você entrar.')) await signOut(); };
  return (
    <Section title="Conta">
      <div className="group">
        <button className="row plain" onClick={pull}><span className="body"><div className="t">{acc.user?.email}</div>
          <div className="s">{SYNC_TXT[acc.sync] || ''}</div></span>
          <span className={`sync-dot ${acc.sync}`} aria-hidden="true" /></button>
        <button className="row plain" onClick={sair}><span className="body"><div className="t" style={{ color: 'var(--danger)' }}>Sair da conta</div></span></button>
      </div>
    </Section>
  );
}

function AparenciaSection() {
  const pref = useSyncExternalStore(subscribeTheme, getThemePref);
  return (
    <Section title="Aparência">
      <Seg options={[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']]} value={pref} onChange={setThemePref} />
      <p className="hint" style={{ padding: '8px 4px 0' }}>Automático segue o modo do celular.</p>
    </Section>
  );
}

function LembretesSection() {
  const state = useStore();
  const c = lembConfig();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const comHora = state.diet.groups.filter((g) => /^\d{2}:\d{2}$/.test(g.time || '')).length;
  const alternar = async (tipo) => {
    setBusy(tipo); setMsg('');
    const erro = await lembLigar(tipo, !c[tipo]);
    setBusy(''); if (erro) setMsg(erro);
  };
  const aviso = ehNativo() ? '' : avisoPush();
  const Linha = ({ tipo, titulo, sub }) => (
    <button className="row plain" onClick={() => alternar(tipo)} disabled={busy === tipo} aria-pressed={c[tipo]}>
      <span className="body"><div className="t">{titulo}</div><div className="s">{sub}</div></span>
      <span className="end"><span className={`switch ${c[tipo] ? 'on' : ''}`} aria-hidden="true"><i /></span></span>
    </button>
  );
  return (
    <Section title="Lembretes">
      <div className="group">
        <Linha tipo="refeicoes" titulo="Refeições" sub={comHora ? `No horário de cada refeição do plano (${comHora})` : 'Coloque horário nas refeições do plano'} />
        <div className="pad"><MetaAgua /></div>
        <LembretesAgua />
      </div>
      <p className="hint" style={{ padding: '8px 4px 0' }}>
        {ehNativo() ? 'Notificação sem som, com ✓ Sim e ✗ Não: marque direto pela barra de notificações, sem abrir o app.'
          : 'Notificação sem botões (o iPhone não permite em sites): tocar abre o Pilar na tela certa.'}</p>
      {aviso && !c.refeicoes && !c.agua ? <p className="hint" style={{ padding: '6px 4px 0' }}>{aviso}</p> : null}
      {msg ? <p className="hint" style={{ padding: '6px 4px 0', color: 'var(--danger)' }}>{msg}</p> : null}
    </Section>
  );
}
