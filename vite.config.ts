import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/hf-api': {
        target: 'https://api-inference.huggingface.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hf-api/, ''), // מוחק את הקידומת המקומית
        headers: {
          // כאן שמתי את הטוקן ששלחת לי
          'Authorization': 'Bearer HF_TOKEN_PLACEHOLDER',
          'Content-Type': 'application/json'
        }
      }
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));