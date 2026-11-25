import { Head } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';

/* TODO: migrar a tela Rotina do app antigo (legacy/app.js) */
export default function Rotina() {
  useStore();
  return <Head kicker="Em migração" title="Rotina" />;
}
