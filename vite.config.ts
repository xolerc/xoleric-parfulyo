import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  appType: 'mpa',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('firebase')) return 'firebase';
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
