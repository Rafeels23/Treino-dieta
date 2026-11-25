/* Folha (janela que sobe de baixo): X no canto, arrastar para baixo fecha,
   e trocar de tela dentro dela desliza para o lado conforme o nível. */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useMotionValue, animate } from 'motion/react';
import { useStore } from '../lib/hooks.js';
import { subscribeUI, getSheet, closeSheet } from '../lib/ui.js';
import { Icon } from './ui.jsx';

export default function SheetHost() {
  useStore();
  const s = useSyncExternalStore(subscribeUI, getSheet);
  const last = useRef(null);
  if (s.render) last.current = s;
  const shown = s.render ? s : last.current;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AnimatePresence>
      {s.render && (
        <div className="sheet-layer" key="sheet">
          <motion.div className="sheet-scrim" onClick={closeSheet}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} />
          <motion.div className="sheet-wrap" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 360, mass: 0.9 }}>
            <DraggablePanel shown={shown} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DraggablePanel({ shown }) {
  const panel = useRef(null), body = useRef(null);
  const y = useMotionValue(0);

  useEffect(() => {
    const el = panel.current, bd = body.current;
    let y0 = null, dy = 0, t0 = 0, dragging = false;
    const start = (ev) => {
      if (ev.touches.length !== 1 || ev.target.closest('input, textarea, select')) return;
      const onTop = ev.target.closest('.grab') || ev.touches[0].clientY - el.getBoundingClientRect().top < 56;
      if (!onTop && bd.scrollTop > 0) return;
      y0 = ev.touches[0].clientY; dy = 0; t0 = Date.now(); dragging = false;
    };
    const move = (ev) => {
      if (y0 == null) return;
      dy = ev.touches[0].clientY - y0;
      if (!dragging && dy > 8 && bd.scrollTop <= 0) dragging = true;
      if (!dragging) return;
      ev.preventDefault();
      y.set(Math.max(0, dy));
    };
    const end = () => {
      if (y0 == null) return;
      const fast = dy > 40 && dy / Math.max(1, Date.now() - t0) > 0.6;
      if (dragging && (dy > 120 || fast)) closeSheet();
      else if (dragging) animate(y, 0, { type: 'spring', damping: 30, stiffness: 400 });
      y0 = null; dragging = false;
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); };
  }, [y]);

  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [shown?.key]);

  return (
    <motion.div ref={panel} className="sheet" role="dialog" aria-modal="true" style={{ y }}>
      <button type="button" className="sheet-x" onClick={closeSheet} aria-label="Fechar"><Icon n="x" /></button>
      <div className="sheet-body" ref={body}>
        <div className="grab" />
        <motion.div key={shown?.key} initial={shown?.dir ? { x: shown.dir * 48, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
          {shown?.render?.()}
        </motion.div>
      </div>
    </motion.div>
  );
}
