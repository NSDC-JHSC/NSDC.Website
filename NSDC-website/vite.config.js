import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev`: Vite (hot reload) on :5173 forwards /api and /img to the local Cloudflare runtime on :8788
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8788', '/img': 'http://127.0.0.1:8788' },
  },
});
