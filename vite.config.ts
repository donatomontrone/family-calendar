import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/panel.tsx",
      formats: ["es"],
      fileName: () => "family-calendar-panel.js"
    },
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
});
