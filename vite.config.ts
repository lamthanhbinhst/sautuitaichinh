
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Đảm bảo assets chạy đúng trên GitHub Pages sub-folders
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
