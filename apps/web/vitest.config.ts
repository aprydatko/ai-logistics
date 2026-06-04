import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": dirname,
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
    },
    environment: "jsdom",
    exclude: ["**/e2e/**", "**/node_modules/**", "**/.git/**"],
    outputFile: {
      junit: "./test-results/vitest-junit.xml",
    },
    passWithNoTests: true,
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
