import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: false,
        v3_lazyRouteDiscovery: false,
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5177,
  },
  build: {
    rollupOptions: {
      external: ["pg"],
      output: {
        manualChunks: (id) => {
          // Ensure API routes are included in server bundle
          if (id.includes('/routes/api.')) {
            return 'api-routes';
          }
        }
      }
    },
  },
  ssr: {
    external: ["pg"],
    noExternal: /^(?!.*node_modules).*$/,
  },
});

