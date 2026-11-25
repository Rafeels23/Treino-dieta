// Copia os arquivos do app (que ficam na raiz, servidos pelo GitHub Pages)
// para a pasta www/, que é o que o Capacitor embala dentro do APK.
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';

const FILES = ['index.html', 'style.css', 'app.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'fonts'];

rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of FILES) {
  if (!existsSync(f)) throw new Error(`Arquivo não encontrado: ${f}`);
  cpSync(f, `www/${f}`, { recursive: true });
}
console.log(`www/ pronto com ${FILES.length} itens.`);
