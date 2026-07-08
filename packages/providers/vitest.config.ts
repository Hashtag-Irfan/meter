import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/__tests__/**",
        "src/**/__fixtures__/**",
        "src/index.ts",
        "src/adapters/codex/**",
        "src/adapters/cursor/**",
      ],
    },
  },
});
