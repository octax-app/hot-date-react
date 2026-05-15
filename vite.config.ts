import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
  build: {
    target: "es2022",
    lib: {
      entry: {
        "hot-date": "src/hot-date.ts",
        "hot-date-react": "src/react/index.ts",
      },
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ["react", "react/jsx-runtime", "react-dom"],
      output: { inlineDynamicImports: false },
    },
    emptyOutDir: true,
  },
});
