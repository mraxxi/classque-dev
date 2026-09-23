import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Note: If @cloudflare/vite-plugin is needed, we can add it. 
// Standard vite with a dev server proxy for the worker is sometimes easier if not using Pages.
// For Workers + Assets, standard practice right now might involve either the plugin or 
// wrangler dev proxying to Vite. Let's start with Vite proxying to wrangler dev or vice-versa.
// Actually, `wrangler dev` proxies to vite with `ASSETS` binding when we have `assets: { directory: "dist" }`.
// Wait, in wrangler 3.60+, running `wrangler dev` with assets will automatically look for the dev server if we configure it.
// Or we just build and serve. Let's use simple React config for now.

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallbackDenylist: [/^\/api\//, /^\/cdn-cgi\//],
      },
      manifest: {
        name: 'ClassQue',
        short_name: 'ClassQue',
        description: 'Responsive web planner for teachers',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [] // Add icons later
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/web'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  server: {
    // When running Vite standalone, we proxy /api to the wrangler worker port 8787
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      }
    }
  }
});
