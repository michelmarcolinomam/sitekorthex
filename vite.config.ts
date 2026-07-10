// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { cloudflare } from "@cloudflare/vite-plugin";

// O wrapper só registra cloudflare() quando command === "build" (hard-coded no dist).
// Em dev isso deixa `cloudflare:workers` sem resolver, quebrando D1/R2.
// Injetamos o plugin manualmente APENAS no serve, para não duplicar no build.
const isDev = process.argv.includes("dev") || process.argv.includes("serve");

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: isDev ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : [],
});
