import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // Testerna får aldrig anropa Anthropic, även om nyckeln finns i miljön.
    env: { ANTHROPIC_API_KEY: "" },
  },
});
