import { Head } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';

/* TODO: migrar a tela Dieta do app antigo (legacy/app.js) */
export default function Dieta() {
  useStore();
  return <Head kicker="Em migração" title="Dieta" />;
}
