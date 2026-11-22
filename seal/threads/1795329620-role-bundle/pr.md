Part of #38. The issue closes when `release/v0.0.2` reaches `main`.

Milestone 2's review rounds, fix passes and seal each run as a role session: the user's `claude`, launched headless and detached, with one role's definition and rules. The app held no definitions, so nothing could launch a proofer, a crafter or a sealer. This ships the role bundle and lets the daemon launch a session as one of the three roles. The stages that use them come with #39 to #43.

| Done when | What holds now |
|---|---|
| The app ships a role bundle with the definitions and rules of proofer, crafter for fix passes, and sealer | `apps/desktop/role-bundle/`, copied into `dist/bundle/` by `build.mjs`: 15 files of AgenticSeal 0.38.4 (tag `v0.38.4`, `0eca6e7`), 11 byte for byte and 5 changed only where the launch requires (the `skills:` key of the three definitions, the sealer's stamp, one sentence of contract rule 11, one `description` each in core and contract) |
| Each file from AgenticSeal keeps its notice and licence | The bundle holds AgenticSeal's `LICENSE` as it is, and its `README.md` names the release, each change and what was left out |
| The daemon launches a role session with the bundle, the role and the appended rules, and a run shows the session following a rule only the appended rules state | `--plugin-dir <bundle> --agent owlery:<role> --append-system-prompt-file <run folder>/roles/<role>-<stage>.md --add-dir <worktree> <bundle>`. One real proofer session on the owner's login (`role:run`, $0.28) answered with three facts only the definition and the appended rules state, and read the bundle's files with no permission request |
| Nothing is installed into the user's Claude Code, and the settings files are unchanged | The four settings and plugin-list files were byte for byte the same after the real session. Claude Code's own state file `~/.claude.json` gains a `pluginUsage` count, `owlery@inline`, which the owner's default answer to #38's Q2 accepts and `docs/architecture.md` will state |
| The bundle holds no hook meant for a watched session | No `hooks` key, no hook file, no stamp |
| The suite launches a role through the fake adapter | Cases in `role-bundle.test.ts`, `fake-adapter.test.ts` and `daemon.test.ts` |
| The daemon reads the CLI's version and tells the person to update below a stated minimum | The minimum is 2.1.326, the version `docs/architecture.md` checked the options on. The daemon reads `claude --version` at start and on each window's hello while a notice stands; below it, the status line says so. An older CLI still runs |

**A role session that did not get its role fails.** Claude Code 2.1.330 starts a plain session, with no error, where the bundle's folder or the role's name is wrong. The daemon reads the session's `init` line and stops it where the role is missing or a plugin error is listed.

**Each start of the daemon now runs the login shell once in the background** to find `claude` and read its version. Whether that slows the suite is #38's Q6, read from the broad run's time.

**AgenticSeal's later releases do not reach the bundle by themselves.** A work item compares the 15 paths between two tags, takes what applies and says why for the rest, as the bundle's `README.md` states.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
