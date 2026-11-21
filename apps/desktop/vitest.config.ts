import { defineConfig } from "vitest/config";

// On GitHub's macOS runner (where `CI` is set), a failed case runs once more
// before it counts as failed. Two cases of the built app fail there on some
// runs only: the Open in submenu's pointer case, whose 300 ms pause the first
// start's slow page outruns, and the worktree link case after a view changes,
// whose cause is not measured. A case that fails twice still fails the run. A
// run on a person's Mac retries nothing. The two cases' causes are issue #117.
export default defineConfig({
  test: {
    retry: process.env.CI ? 1 : 0,
  },
});
