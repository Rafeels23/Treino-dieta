import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './lib/theme.js';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);

// Cópia offline (também no app Android, que abre o site do Pilar e precisa funcionar sem internet).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
