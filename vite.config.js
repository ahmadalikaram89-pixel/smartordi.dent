import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  // The web deployment (Vercel) needs absolute "/assets/..." paths so a
  // hard refresh on a nested route like /patients/:id still finds them.
  // The Electron build needs relative "./assets/..." paths instead, since
  // it loads dist/index.html directly via file:// where an absolute path
  // resolves against the filesystem root, not the dist/ folder.
  base: mode === 'electron' ? './' : '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
}))
