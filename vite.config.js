import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : GitHub Pages / Cloudflare Pages 어느 하위 경로에서도 동작
export default defineConfig({
  base: './',
  plugins: [react()],
});
