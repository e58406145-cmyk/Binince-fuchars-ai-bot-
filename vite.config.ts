import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'CyberPulse Futures',
          short_name: 'CyberPulse',
          description: 'Crypto futures market analysis radar with live multi-timeframe calculations.',
          theme_color: '#030712',
          background_color: '#030712',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/binance-fapi': {
          target: 'https://fapi.binance.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/binance-fapi/, ''),
        },
        '/api/binance-dapi': {
          target: 'https://dapi.binance.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/binance-dapi/, ''),
        },
        '/api/bitget': {
          target: 'https://api.bitget.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/bitget/, ''),
        },
      },
    },
  };
});

