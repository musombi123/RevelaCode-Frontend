import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // <-- This maps @ to src
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://revelacode-backend.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/support': {
        target: 'https://revelacode-backend.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
