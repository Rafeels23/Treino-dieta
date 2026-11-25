import { Head } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';

/* TODO: migrar a tela Hoje do app antigo (legacy/app.js) */
export default function Hoje() {
  useStore();
  return <Head kicker="Em migração" title="Hoje" />;
}
