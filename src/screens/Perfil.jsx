import { Section, Icon } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';
import { go } from '../lib/ui.js';
import { br, initials, latestWeight, weightFeedback } from '../lib/core.js';
import {
  WeightCard, openPeso, openPesoReport, openEditProfile, openAiKey, exportBackup, importBackup, resetAll,
} from '../sheets/perfil.jsx';
import { useSyncExternalStore } from 'react';
import { getAccount, subscribeAccount, signOut, pull } from '../lib/cloud.js';
import { Seg } from '../components/ui.jsx';
import { getThemePref, setThemePref, subscribeTheme, CORES, getCor, setCor } from '../lib/theme.js';
import { useState } from 'react';
import { config as lembConfig, ligar as lembLigar, ehNativo, aguaMeta } from '../lib/lembretes.js';
import { avisoPush } from '../lib/push.js';
import { openAgua } from './Dieta.jsx';
import { pulseiraDisponivel, conectarPulseira, desconectarPulseira, sincronizarPulseira, estadoPulseira, PLAY_SAUDE } from '../lib/pulseira.js';
import { useEffect } from 'react';

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
          <button className="row plain kv" onClick={openPeso}><span className="body"><div className="t">Peso atual</div></span>
            <span className="end">{w != null ? <span className="v num">{br(w)} kg</span> : <span>Atualizar</span>}</span></button>
          <Kv label="Meta de peso" value={p.meta ? `${br(p.meta)} kg` : ''} />
          <Kv label="Nutricionista" value={p.nutri || ''} />
        </div>
      </Section>

      <Section title="Assistente IA">
        <div className="group"><button className="row plain" onClick={openAiKey}><span className="body"><div className="t">Cálculo de calorias por foto</div>
          <div className="s">{state.ai?.key ? 'Usando a chave deste celular' : 'Pela conta do Pilar, para vocês dois'}</div></span>
          <span className="end"><span className="tag ok">Ativo</span><Icon n="right" /></span></button></div>
      </Section>

      <PulseiraSection />

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
  const cor = useSyncExternalStore(subscribeTheme, getCor);
  return (
    <Section title="Aparência">
      <Seg options={[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']]} value={pref} onChange={setThemePref} />
      <p className="hint" style={{ padding: '8px 4px 0' }}>Automático segue o modo do celular.</p>
      <div className="cor-titulo">Cor do app</div>
      <div className="cores" role="radiogroup" aria-label="Cor do app">
        {Object.entries(CORES).map(([k, [nome, claro]]) => (
          <button key={k} type="button" role="radio" aria-checked={cor === k} aria-label={nome} title={nome}
            className={`cor-op ${cor === k ? 'on' : ''}`} onClick={() => setCor(k)}>
            <span className="cor-bola" style={{ background: claro }} />{nome}</button>
        ))}
      </div>
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
        <button className="row plain" onClick={() => { go('dieta'); setTimeout(openAgua, 50); }}>
          <span className="body"><div className="t">Água</div><div className="s">{c.agua ? `Ligado · meta de ${(aguaMeta(c) / 1000).toLocaleString('pt-BR')} L` : 'Desligado'} · ajustar meta e horários</div></span>
          <span className="end"><Icon n="right" /></span></button>
      </div>
      <p className="hint" style={{ padding: '8px 4px 0' }}>
        {ehNativo() ? 'Notificação sem som, com ✓ Sim e ✗ Não: marque direto pela barra de notificações, sem abrir o app.'
          : 'Notificação sem botões (o iPhone não permite em sites): tocar abre o Pilar na tela certa.'}</p>
      {aviso && !c.refeicoes && !c.agua ? <p className="hint" style={{ padding: '6px 4px 0' }}>{aviso}</p> : null}
      {msg ? <p className="hint" style={{ padding: '6px 4px 0', color: 'var(--danger)' }}>{msg}</p> : null}
    </Section>
  );
}

function PulseiraSection() {
  const state = useStore();
  const [st, setSt] = useState(null), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { estadoPulseira().then(setSt); }, [state.saude?.conectado]);
  if (!pulseiraDisponivel()) return null;       // só no app Android
  const sd = state.saude || {};
  const conectada = sd.conectado && st?.permitido;
  const quando = sd.ultima ? Math.round((Date.now() - sd.ultima) / 60000) : null;
  const conectar = async () => { setBusy(true); setMsg(''); const e = await conectarPulseira(); setBusy(false); if (e) setMsg(e); estadoPulseira().then(setSt); };
  const atualizar = async () => { setBusy(true); await sincronizarPulseira(true); setBusy(false); };
  return (
    <Section title="Pulseira">
      <div className="group">
        {st && st.status !== 'ok' && st.status !== 'app_antigo' ? (
          <a className="row plain" href={PLAY_SAUDE} target="_blank" rel="noreferrer">
            <span className="body"><div className="t">Instalar o Saúde Connect</div><div className="s">É por ele que os dados do Zepp chegam ao Pilar</div></span>
            <span className="end"><Icon n="right" /></span></a>
        ) : conectada ? (
          <>
            <div className="row plain"><span className="body"><div className="t">Conectada</div>
              <div className="s">{sd.erro || (quando == null ? 'Lendo…' : quando < 1 ? 'Atualizada agora' : `Atualizada há ${quando} min`)} · passos, sono e exercícios</div></span>
              <span className="sync-dot ok" aria-hidden="true" /></div>
            <button className="row plain" onClick={atualizar} disabled={busy}><span className="body"><div className="t">{busy ? 'Atualizando…' : 'Atualizar agora'}</div></span></button>
            <button className="row plain" onClick={desconectarPulseira}><span className="body"><div className="t" style={{ color: 'var(--ink-2)' }}>Desconectar</div></span></button>
          </>
        ) : (
          <button className="row plain" onClick={conectar} disabled={busy}>
            <span className="body"><div className="t">{busy ? 'Conectando…' : 'Conectar pulseira'}</div><div className="s">Amazfit pelo Zepp → Saúde Connect: passos, sono e exercícios</div></span>
            <span className="end"><Icon n="right" /></span></button>
        )}
      </div>
      <p className="hint" style={{ padding: '8px 4px 0' }}>Os exercícios da pulseira (caminhada, corrida, bike…) entram sozinhos nas atividades. Musculação não entra, porque já é o treino do Pilar.</p>
      {msg ? <p className="hint" style={{ padding: '6px 4px 0', color: 'var(--danger)' }}>{msg}</p> : null}
    </Section>
  );
}
