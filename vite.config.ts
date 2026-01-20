import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/hf-api': {
        target: 'https://api-inference.huggingface.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hf-api/, ''),
        headers: {
          'Authorization': 'Bearer HF_TOKEN_PLACEHOLDER',
          'Content-Type': 'application/json'
        }
      }
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SafeGuard',
        short_name: 'SafeGuard',
        description: 'Emergency Response System',
        theme_color: '#080C16',
        background_color: '#080C16',
        display: 'standalone',
        orientation: 'portrait', // <--- הוספה חשובה למובייל
        start_url: '/',          // <--- הוספה חשובה למובייל
        scope: '/',              // <--- הוספה חשובה למובייל
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' // <--- חובה לאנדרואיד!
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // <--- חובה לאנדרואיד!
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
