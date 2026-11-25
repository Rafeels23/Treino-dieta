import { Head } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';

/* TODO: migrar a tela Progresso do app antigo (legacy/app.js) */
export default function Progresso() {
  useStore();
  return <Head kicker="Em migração" title="Progresso" />;
}
