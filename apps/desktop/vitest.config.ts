import { defineConfig } from "vitest/config";

// On GitHub's macOS runner (where `CI` is set), a failed case runs once more
// before it counts as failed. Two cases of the built app race a 300 ms timer
// against the first start's slow page there (the Open in submenu's pause, and
// the worktree link after a view changes), and fail on some runs only. A case
// that fails twice still fails the run. A run on a person's Mac retries
// nothing. The two cases' causes are issue #117.
export default defineConfig({
  test: {
    retry: process.env.CI ? 1 : 0,
  },
});
