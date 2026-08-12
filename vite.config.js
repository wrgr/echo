import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ECHO build configuration.
//
// We keep the production output directory as `build/` (Vite's default is
// `dist/`) so the existing Firebase Hosting config (firebase.json ->
// "public": "build") and the gh-pages deploy script continue to work
// unchanged after the migration off Create React App.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: false,
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
