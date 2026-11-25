/* Entrada no Pilar: e-mail e senha. Calma, uma coisa por vez. */
import { useState } from 'react';
import { signIn, signUp, signOut } from '../lib/cloud.js';

function Logo() {
  return (
    <svg className="login-logo" viewBox="0 0 512 512" aria-hidden="true">
      <rect x="150" y="212" width="78" height="184" rx="39" fill="var(--c-treino)" />
      <rect x="284" y="132" width="78" height="264" rx="39" fill="var(--c-dieta)" />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const go = async (e) => {
    e.preventDefault();
    if (!email.trim() || !senha) { setMsg({ err: true, t: 'Preencha e-mail e senha.' }); return; }
    setBusy(true); setMsg(null);
    try {
      if (mode === 'entrar') await signIn(email, senha);
      else {
        const entrou = await signUp(email, senha);
        if (!entrou) setMsg({ err: false, t: 'Conta criada. Abra o e-mail que enviamos e toque no link para confirmar; depois volte aqui e entre.' });
      }
    } catch (er) { setMsg({ err: true, t: er.message }); }
    setBusy(false);
  };

  return (
    <div className="login">
      <div className="login-top">
        <Logo />
        <h1>Pilar</h1>
        <p>Treino e alimentação, um dia de cada vez.</p>
      </div>
      <form className="login-form" onSubmit={go}>
        <div className="field"><label htmlFor="em">E-mail</label>
          <input id="em" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Senha</label>
          <input id="pw" type="password" autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} value={senha} onChange={(e) => setSenha(e.target.value)} />
          {mode === 'criar' && <p className="hint" style={{ marginTop: 6 }}>Pelo menos 6 caracteres.</p>}</div>
        {msg && <p className={`login-msg ${msg.err ? 'err' : ''}`} role="status">{msg.t}</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Aguarde…' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
        <button type="button" className="text-btn login-switch" onClick={() => { setMode(mode === 'entrar' ? 'criar' : 'entrar'); setMsg(null); }}>
          {mode === 'entrar' ? 'Primeira vez? Criar conta' : 'Já tenho conta. Entrar'}
        </button>
      </form>
    </div>
  );
}

/* Conta criada, mas o e-mail ainda não está na lista do Pilar */
export function NotMember({ email }) {
  return (
    <div className="login">
      <div className="login-top">
        <Logo />
        <h1>Quase lá</h1>
        <p>A conta <b>{email}</b> foi criada, mas ainda não está liberada no Pilar. Peça para liberar este e-mail e entre de novo.</p>
      </div>
      <div className="login-form"><button className="btn soft block" onClick={signOut}>Sair</button></div>
    </div>
  );
}

export function Splash() {
  return <div className="login splash"><div className="login-top"><Logo /></div></div>;
}
