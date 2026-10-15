import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  base:'./',publicDir:false,
  build:{outDir:'pages-dist',rollupOptions:{input:{index:fileURLToPath(new URL('./index.html',import.meta.url)),app:fileURLToPath(new URL('./app.html',import.meta.url))}}}
});
