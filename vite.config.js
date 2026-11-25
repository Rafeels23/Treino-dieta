import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './': o mesmo build funciona no GitHub Pages (/Treino-dieta/) e dentro do APK/iOS.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', target: 'es2020' },
});
