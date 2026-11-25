import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);

// No app nativo (Android/iOS) os arquivos já vêm no aparelho: o modo offline do navegador não é usado.
const isNative = !!window.Capacitor?.isNativePlatform?.();
if ('serviceWorker' in navigator && !isNative && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
