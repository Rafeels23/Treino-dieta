/* Tela de comemoração (estilo Duolingo): animação grande, números que sobem e um botão só.
   Usada ao concluir o treino e nos marcos da sequência (7, 30, 100 dias...). */
import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Anim } from './Illu.jsx';
import { CountUp } from './ui.jsx';
import { closeSheet } from '../lib/ui.js';
import { spark, cssVar, reducedMotion, buzz } from '../lib/effects.js';

export default function Comemoracao({ anim = 'festa', titulo, texto, numeros = [], extra = null, botao = 'Continuar' }) {
  const reduz = useReducedMotion();
  useEffect(() => {
    buzz(30);
    if (reducedMotion()) return undefined;
    const t = setTimeout(() => {
      const el = document.querySelector('.celebra .cel-anim');
      if (!el) return;
      const r = el.getBoundingClientRect(), cores = [cssVar('--accent'), cssVar('--c-dieta'), cssVar('--c-rotina'), '#ffd23f'];
      spark(r.left + r.width / 2, r.top + r.height / 2, cores, 22, 120);
    }, 350);
    return () => clearTimeout(t);
  }, []);
  const entra = (i) => (reduz ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.25 + i * 0.12, type: 'spring', stiffness: 260, damping: 22 } });
  return (
    <div className="celebra">
      <motion.div className="cel-anim" initial={reduz ? false : { scale: 0.3, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12 }}><Anim nome={anim} tamanho={150} /></motion.div>
      <motion.h2 {...entra(0)}>{titulo}</motion.h2>
      {texto ? <motion.p className="cel-texto" {...entra(1)}>{texto}</motion.p> : null}
      {numeros.length ? (
        <div className="cel-nums">
          {numeros.map((n, i) => (
            <motion.div key={n.rotulo} className="cel-num" {...entra(2 + i)}>
              <b className="num"><CountUp value={n.valor} dec={n.casas || 0} />{n.unidade ? <small>{n.unidade}</small> : null}</b>
              <span>{n.rotulo}</span>
            </motion.div>
          ))}
        </div>
      ) : null}
      {extra ? <motion.div {...entra(2 + numeros.length)}>{extra}</motion.div> : null}
      <button type="button" className="btn gordo block cel-btn" onClick={closeSheet}>{botao}</button>
    </div>
  );
}
