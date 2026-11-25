/* Ilustrações do unDraw com as cores do tema (claro/escuro) e a cor da área.
   Entrada suave, uma vez só; nada em loop. */
import { motion, useReducedMotion } from 'motion/react';
import morningWorkout from '../illus/morning-workout.svg?raw';
import runnerStart from '../illus/runner-start.svg?raw';
import breakfast from '../illus/breakfast.svg?raw';
import meditation from '../illus/meditation.svg?raw';
import growthCurve from '../illus/growth-curve.svg?raw';
import celebrating from '../illus/celebrating.svg?raw';
import messageSent from '../illus/message-sent.svg?raw';
import emptyCart from '../illus/empty-cart.svg?raw';
import accessDenied from '../illus/access-denied.svg?raw';

const RAW = { login: morningWorkout, treino: runnerStart, dieta: breakfast, rotina: meditation, progresso: growthCurve, festa: celebrating,
  codigo: messageSent, compras: emptyCart, bloqueado: accessDenied };

const COR = [
  [/#(ff6584|6c63ff)\b/gi, 'var(--illu-accent)'],
  [/#(090814|2f2e41|3f3d56)\b/gi, 'var(--illu-ink)'],
  [/#(b3b3b3|cacaca|ccc)\b/gi, 'var(--illu-mid)'],
  [/#(e6e6e6|e5e5e5|e4e4e4|d6d6e3|f0f0f0|f2f2f2)\b/gi, 'var(--illu-soft)'],
  [/(fill|stroke)="#(090814|2f2e41|3f3d56)"/gi, '$1="var(--illu-ink)"'],
  [/"#fff(fff)?"/gi, '"var(--illu-paper)"'],
];
const cache = {};
function svgDe(nome) {
  if (!cache[nome]) {
    let s = RAW[nome].replace(/\s(id|data-name)="[^"]*"/g, '');
    for (const [re, v] of COR) s = s.replace(re, v);
    cache[nome] = s.replace('<svg', '<svg aria-hidden="true" focusable="false"');
  }
  return cache[nome];
}

export default function Illu({ nome, cor = 'var(--c-treino)', className = '', atraso = 0.05 }) {
  const reduz = useReducedMotion();
  return (
    <motion.div
      className={`illu ${className}`}
      style={{ '--illu-accent': cor }}
      initial={reduz ? false : { opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 22, delay: atraso }}
      dangerouslySetInnerHTML={{ __html: svgDe(nome) }}
    />
  );
}
