Part of #30. The issue closes when `release/v0.0.2` reaches `main`.

Until now the desktop app's typecheck and tests ran only where a session ran the broad gate by hand, so pull requests merged into the release branch with nothing but local runs between them. A `check` workflow now runs `pnpm -r run check` on GitHub's macOS runner for every pull request into `main` and into a `release/**` branch, and a pull request whose suite fails shows the check as failed.

This is release 0.0.2's first pull request, so it also moves the desktop app's version to 0.0.2.

**Making the suite hold on the runner.** Its first run (on `macos-26-arm64`) failed 18 cases that pass on the owner's Mac. The causes, each fixed where it starts:

| Cause | Fix |
|---|---|
| The runner's screen is 1024 by 768, so the app's 1440 by 900 window was made 1024 by 674. The tab strip clipped a second pane's tab, a pane had too few columns for the path a case wraps, and the removal dialog's buttons stood below the page's foot. 15 cases of `terminal-basics` and 3 of `work-item-menu` failed, most of them in a chain after the first | An app started in the background (`OWLERY_BACKGROUND=1`, as the suite and an agent start it) keeps its window at 1440 by 900 on a smaller screen (`enableLargerThanScreen`). The suite's helper fails a start whose page has another size. The size has one home, `src/main/window-size.ts`. A person's start passes no such option, so a person's window stays inside their screen |
| The daemon's reconnecting-client case started a `sleep` process for each of its forty lines, about 45 ms each on the runner, which took it past its five seconds | It prints the lines in five bursts of eight, and still prints lines before and after the client attaches |

**Two cases still fail on some first starts on the runner**, and their causes are #117. One is the Open in submenu's pointer case, whose 300 ms pause the first start's slow page outruns. The other is the case that opens a work item from its worktree's link, whose cause is not measured. On the runner a failed case runs once more before it counts (`apps/desktop/vitest.config.ts`, under `CI`). A case that fails twice still fails the run. A run on a person's Mac retries nothing. Run 44922266267 at this head passed all 34 files.

For the owner:

- **Whether a failed `check` blocks a merge** is a setting, not this workflow. The rulesets on `main` and `release/**` require no status check today. Adding `check` to them makes a red suite unmergeable.
- **A window smaller than 1440 by 900** clips the tab strip and the removal dialog, which the runner showed. The suite no longer reads the app at such a size, and `gaps.md` names it for a follow-up.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
