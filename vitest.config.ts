import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Load .env before any test file runs so DATABASE_URL is available
    // to the pg Pool when lib/db.ts is first imported.
    setupFiles: ["./tests/setup.ts"],
  },
});
