/* Timer de descanso entre séries (fica fora do React para seguir contando entre telas). */
const listeners = new Set();
const emit = () => listeners.forEach((f) => f());
export const subscribeTimer = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

let t = { end: 0, total: 0, beeped: false, next: '', iv: null };
export const getTimer = () => t;

let audio;
function beep() {
  try { navigator.vibrate?.([300, 120, 300]); } catch {}
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((d) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.25, audio.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + d + 0.2);
      o.start(audio.currentTime + d); o.stop(audio.currentTime + d + 0.2);
    });
  } catch {}
}
function tick() {
  const left = (t.end - Date.now()) / 1000;
  if (left <= 0 && !t.beeped) { t.beeped = true; beep(); }
  if (left < -120) return stopTimer();
  emit();
}
export function startTimer(sec, next = '') {
  if (!sec) return;
  clearInterval(t.iv);
  t = { end: Date.now() + sec * 1000, total: sec, beeped: false, next, iv: setInterval(tick, 250) };
  document.body.classList.add('timer-on');
  emit();
}
export function stopTimer() {
  clearInterval(t.iv);
  t = { ...t, end: 0, iv: null };
  document.body.classList.remove('timer-on');
  emit();
}
export function addTimer(sec) {
  if (!t.end) return;
  t.end += sec * 1000;
  t.total = Math.max(t.total, (t.end - Date.now()) / 1000);
  if (t.end > Date.now()) t.beeped = false;
  emit();
}

/* tela ligada durante o treino */
let wakeLock = null;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen');
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}
export const resetWakeLock = () => { wakeLock = null; };
