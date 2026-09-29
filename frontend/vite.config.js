import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Every page already lazy-loads on its own, but React, Framer
        // Motion and the Supabase client were all landing in that same
        // eagerly-loaded entry chunk regardless — three large libraries
        // that change far less often than this app's own code does.
        // Splitting them into their own chunks means a browser that's
        // already cached them from a previous visit only has to
        // re-download the (much smaller) app code on the next deploy,
        // instead of the whole bundle every time.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) return "vendor-react";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) return "vendor-motion";
          if (id.includes("@supabase")) return "vendor-supabase";
          return undefined;
        },
      },
    },
  },
})
