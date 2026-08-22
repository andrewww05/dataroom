/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [TanStackRouterVite({ routeFileIgnorePattern: '\\.spec\\.(ts|tsx)$' }), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Keeps the browser on one origin in dev, so no CORS round-trips.
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
  // @dataroom/shared is a linked workspace package that ships CommonJS,
  // so Vite has to pre-bundle it into ESM.
  optimizeDeps: {
    include: ['@dataroom/shared'],
  },
  build: {
    commonjsOptions: {
      include: [/@dataroom\/shared/, /node_modules/],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
