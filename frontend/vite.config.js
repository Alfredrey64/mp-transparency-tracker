import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // JSX is compiled against src/glossJsx instead of react's own runtime, so
  // long prose anywhere in the app is offered to the glossary for automatic
  // underlining (see src/glossJsx/prepare.js). It delegates straight back to
  // react/jsx-runtime for everything else. Given as a root-relative source
  // path, not a package name: a bare name gets pre-bundled by the dev server
  // into a separate, stale copy of the runtime.
  plugins: [react({ jsxImportSource: '/src/glossJsx' })],
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
