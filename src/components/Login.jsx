/* Entrada no Pilar: e-mail → código de 6 dígitos. Senha fica como plano B. */
import { useEffect, useRef, useState } from 'react';
import Illu from './Illu.jsx';
import { sendCode, verifyCode, signIn, signOut } from '../lib/cloud.js';

function Logo() {
  return (
    <svg className="login-logo" viewBox="0 0 512 512" aria-hidden="true">
      <rect x="150" y="212" width="78" height="184" rx="39" fill="var(--c-treino)" />
      <rect x="284" y="132" width="78" height="264" rx="39" fill="var(--c-dieta)" />
    </svg>
  );
}

export default function Login() {
  const [step, setStep] = useState('email');      // email | codigo | senha
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [wait, setWait] = useState(0);
  const codeRef = useRef(null);

  useEffect(() => {
    if (!wait) return undefined;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);
  useEffect(() => { if (step === 'codigo') codeRef.current?.focus(); }, [step]);

  const run = async (fn) => { setBusy(true); setMsg(null); try { await fn(); } catch (er) { setMsg({ err: true, t: er.message }); } setBusy(false); };

  const enviar = (e) => {
    e?.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMsg({ err: true, t: 'Digite um e-mail válido.' }); return; }
    run(async () => { await sendCode(email); setStep('codigo'); setCode(''); setWait(60); });
  };
  const confirmar = (valor) => {
    const v = (valor ?? code).replace(/\D/g, '');
    if (v.length !== 6) { setMsg({ err: true, t: 'O código tem 6 números.' }); return; }
    run(() => verifyCode(email, v));
  };
  const entrarSenha = (e) => {
    e.preventDefault();
    if (!email.trim() || !senha) { setMsg({ err: true, t: 'Preencha e-mail e senha.' }); return; }
    run(() => signIn(email, senha));
  };

  return (
    <div className="login">
      <div className="login-top">
        {step === 'email' ? <Illu nome="login" cor="var(--c-treino)" className="login-illu" />
          : step === 'codigo' ? <Illu key="codigo" nome="codigo" cor="var(--c-dieta)" className="login-illu" /> : <Logo />}
        <h1>Pilar</h1>
        <p>{step === 'codigo' ? <>Enviamos um código de 6 números para <b>{email.trim()}</b>.</> : 'Treino e alimentação, um dia de cada vez.'}</p>
      </div>

      {step === 'email' && (
        <form className="login-form" onSubmit={enviar}>
          <div className="field"><label htmlFor="em">E-mail</label>
            <input id="em" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {msg && <p className={`login-msg ${msg.err ? 'err' : ''}`} role="status">{msg.t}</p>}
          <button className="btn block" disabled={busy}>{busy ? 'Enviando…' : 'Enviar código'}</button>
          <button type="button" className="text-btn login-switch" onClick={() => { setStep('senha'); setMsg(null); }}>Entrar com senha</button>
        </form>
      )}

      {step === 'codigo' && (
        <form className="login-form" onSubmit={(e) => { e.preventDefault(); confirmar(); }}>
          <div className="field"><label htmlFor="cd">Código</label>
            <input id="cd" ref={codeRef} className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              placeholder="000000" value={code}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(v); if (v.length === 6) confirmar(v); }} /></div>
          {msg && <p className={`login-msg ${msg.err ? 'err' : ''}`} role="status">{msg.t}</p>}
          <button className="btn block" disabled={busy}>{busy ? 'Conferindo…' : 'Entrar'}</button>
          <div className="login-links">
            <button type="button" className="text-btn" disabled={busy || wait > 0} onClick={() => enviar()}>
              {wait > 0 ? `Reenviar em ${wait}s` : 'Reenviar código'}</button>
            <button type="button" className="text-btn" onClick={() => { setStep('email'); setMsg(null); }}>Trocar e-mail</button>
          </div>
          <p className="hint login-hint">Não chegou? Veja a caixa de spam.</p>
        </form>
      )}

      {step === 'senha' && (
        <form className="login-form" onSubmit={entrarSenha}>
          <div className="field"><label htmlFor="em2">E-mail</label>
            <input id="em2" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label htmlFor="pw">Senha</label>
            <input id="pw" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
          {msg && <p className={`login-msg ${msg.err ? 'err' : ''}`} role="status">{msg.t}</p>}
          <button className="btn block" disabled={busy}>{busy ? 'Aguarde…' : 'Entrar'}</button>
          <button type="button" className="text-btn login-switch" onClick={() => { setStep('email'); setMsg(null); }}>Entrar com código por e-mail</button>
        </form>
      )}
    </div>
  );
}

/* Conta criada, mas o e-mail ainda não está na lista do Pilar */
export function NotMember({ email }) {
  return (
    <div className="login">
      <div className="login-top">
        <Illu nome="bloqueado" cor="var(--c-treino)" className="login-illu" />
        <h1>Quase lá</h1>
        <p>A conta <b>{email}</b> ainda não está liberada no Pilar. Peça para liberar este e-mail e entre de novo.</p>
      </div>
      <div className="login-form"><button className="btn soft block" onClick={signOut}>Sair</button></div>
    </div>
  );
}

export function Splash() {
  return <div className="login splash"><div className="login-top"><Logo /></div></div>;
}
