import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Active le Fast Refresh
      fastRefresh: true,
      // Inclut tous les fichiers .jsx et .js
      include: "**/*.{jsx,js}"
    })
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Configuration HMR (Hot Module Replacement)
    hmr: {
      port: 5173,
      overlay: true
    },
    // Force le rechargement pour certains fichiers
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  // Optimisation pour le développement
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/
  },
  // Cache optimisé
  optimizeDeps: {
    force: true
  }
})
