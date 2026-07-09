import { describe, it, expect, afterEach, vi } from "vitest";
import { isMockMode } from "../lib/mock/mode";

describe("isMockMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true when DATABASE_URL is not set", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(isMockMode()).toBe(true);
  });

  it("returns false when DATABASE_URL is set", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    expect(isMockMode()).toBe(false);
  });
});
