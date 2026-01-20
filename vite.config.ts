import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // שמרנו על ה-Proxy שעובד עם הטוקן שלך:
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
    // --- הגדרות האפליקציה (PWA) ---
    VitePWA({
      registerType: 'autoUpdate',
      // --- הוספנו את החלק הזה כדי שזה יעבוד ב-DEV ---
      devOptions: {
        enabled: true
      },
      // ------------------------------------------------
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SafeGuard',
        short_name: 'SafeGuard',
        description: 'Emergency Response System',
        theme_color: '#080C16',
        background_color: '#080C16',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
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