/* Ilustrações animadas: emojis animados do Google (Noto Animated Emoji, CC BY 4.0).
   As animações ficam em public/anim e só carregam quando aparecem na tela.
   Pausam fora da tela; com "reduzir movimento" ficam paradas. */
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const ANIM = {
  login: ['maca', '🍎'], codigo: ['ola', '👋'], bloqueado: ['cadeado', '🔒'],
  treino: ['forca', '💪'], dieta: ['salada', '🥗'], rotina: ['broto', '🌱'], progresso: ['grafico', '📈'],
  compras: ['carrinho', '🛒'], festa: ['festa', '🎉'], trofeu: ['trofeu', '🏆'], fogo: ['fogo', '🔥'],
  manha: ['manha', '🌅'], tarde: ['tarde', '🌞'], noite: ['noite', '🌛'],
};

let lottieP = null;
const carregaLottie = () => (lottieP ||= import('lottie-web/build/player/lottie_light').then((m) => m.default || m));
const dados = {};
const carregaDados = (arq) => (dados[arq] ||= fetch(`./anim/${arq}.json`).then((r) => { if (!r.ok) throw new Error(arq); return r.json(); }));

export function Anim({ nome, tamanho = 120, className = '', loop = true }) {
  const box = useRef(null);
  const reduz = useReducedMotion();
  const [pronto, setPronto] = useState(false);
  const [arq, emoji] = ANIM[nome] || [];

  useEffect(() => {
    if (!arq) return undefined;
    let anim = null, vivo = true, io = null;
    Promise.all([carregaLottie(), carregaDados(arq)]).then(([lottie, data]) => {
      if (!vivo || !box.current) return;
      anim = lottie.loadAnimation({ container: box.current, renderer: 'svg', loop, autoplay: false,
        animationData: data, rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true } });
      anim.addEventListener('DOMLoaded', () => vivo && setPronto(true));
      if (reduz) { anim.goToAndStop(Math.floor(anim.totalFrames / 2), true); return; }
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? anim.play() : anim.pause()), { threshold: 0.1 });
      io.observe(box.current);
    }).catch(() => {});
    return () => { vivo = false; io?.disconnect(); anim?.destroy(); };
  }, [arq, loop, reduz]);

  return (
    <span className={`anim ${pronto ? 'pronto' : ''} ${className}`} style={{ '--tam': `${tamanho}px` }} aria-hidden="true">
      {!pronto && <span className="anim-emoji">{emoji}</span>}
      <span className="anim-box" ref={box} />
    </span>
  );
}

/* Bloco de ilustração (estados vazios, login, dia completo) com entrada suave */
export default function Illu({ nome, className = '', atraso = 0.05, tamanho = 132 }) {
  const reduz = useReducedMotion();
  return (
    <motion.div className={`illu ${className}`}
      initial={reduz ? false : { opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: atraso }}>
      <Anim nome={nome} tamanho={tamanho} />
    </motion.div>
  );
}
