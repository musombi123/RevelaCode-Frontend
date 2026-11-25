// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const RPSVI_FORBIDDEN_PRODUCTION_HOSTS = [
  'revelacode-backend.onrender.com',
  'revelaai.onrender.com',
];

function rpsviStagingOriginIsolation() {
  return {
    name: 'rpsvi-staging-origin-isolation',
    enforce: 'pre',
    transform(source, id) {
      if (id.includes('/node_modules/')) return null;
      if (!/\.[jt]sx?(?:\?|$)/.test(id)) return null;

      let transformed = source;
      for (const host of RPSVI_FORBIDDEN_PRODUCTION_HOSTS) {
        transformed = transformed.replaceAll(host, '');
      }
      return transformed === source ? null : { code: transformed, map: null };
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'rpsvi-staging' ? [rpsviStagingOriginIsolation()] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
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
    },
    historyApiFallback: true
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  }
}));
