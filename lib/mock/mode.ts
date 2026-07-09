// Single source of truth for whether the app is running without a real database.
// Checked as a function (not a module-level constant) so tests can stub the env var per-case.
export function isMockMode(): boolean {
  return !process.env.DATABASE_URL;
}
