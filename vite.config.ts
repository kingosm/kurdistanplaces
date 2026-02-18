import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/kurdistanplaces/' : '/',
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react({
      // Disable fast refresh warnings
      jsxRuntime: 'automatic',
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Ignore UNRESOLVED_IMPORT warnings for /src/main.tsx
        if (
          warning.code === 'UNRESOLVED_IMPORT' &&
          warning.message?.includes('/src/main.tsx')
        ) {
          return;
        }
        // Use default handler for other warnings
        defaultHandler(warning);
      },
    },
  },
}));
