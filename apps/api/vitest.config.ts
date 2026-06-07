import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    outputFile: {
      junit: "./test-results/vitest-junit.xml",
    },
    passWithNoTests: true,
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
  },
});
