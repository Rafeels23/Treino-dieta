import { Head } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';

/* TODO: migrar a tela Treino do app antigo (legacy/app.js) */
export default function Treino() {
  useStore();
  return <Head kicker="Em migração" title="Treino" />;
}
