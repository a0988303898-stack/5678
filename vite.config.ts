
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // 依照規範，Gemini API Key 仍維持從環境變數讀取
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || null)
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    outDir: 'dist'
  }
});
