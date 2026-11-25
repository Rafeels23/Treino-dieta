import { Head } from '../components/ui.jsx';
import { useStore } from '../lib/hooks.js';

/* TODO: migrar a tela Perfil do app antigo (legacy/app.js) */
export default function Perfil() {
  useStore();
  return <Head kicker="Em migração" title="Perfil" />;
}
