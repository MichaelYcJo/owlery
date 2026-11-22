# Phase 1: 1795329620-role-bundle

## What this phase found

### The frame holds

The frame was read against the tree at `6c39486`, where #26 is merged, before anything was built. Every path and unit `frame/plan.md` *Technical context* names stands in the tree: `RoleRun.stop`, the `errorOutput` of an `exit`, `startHeadless`, `stopHeadless`, `writeWholeFile` and the `app` project of `vitest.config.ts`. The three facts of `frame/design.md` *Scope* item 13 stand in one taken file each. Executed: `grep -rl -F` over `apps/desktop/role-bundle` for `round-<n>/clone`, `8, 16 and 20` and `# Review round <N>`. The issue held one comment at the time of the real run, the orchestrator's post of Q1 and Q2, and no reversal. Executed: `gh issue view 38 --json comments`.

One quotation of the frame differs from the source in its line break alone. *Scope* item 3 quotes rule 11 of the agent contract as one line, and the source breaks it after "base". The words are the same, and the change was made on the source's words.

### What the bundle is, compared with the tag

The 15 files and `LICENSE` were copied from the installed copy `/Users/yc/.claude/plugins/cache/agenticseal/agentic/0.38.4`, and the five changes of *Scope* item 3 were made by a script that asserted each old text matched once.

Scenario 2's comparison, executed at `f56fb32`: `cmp` of each of the 16 files with the same path of the clone of the tag `v0.38.4` (commit `0eca6e7`, the framer's clone in the scratch directory). Eleven files are equal: `LICENSE`, `docs/forms/the-guarantee.md`, `docs/forms/the-round-record.md`, `skills/code-review/SKILL.md`, `skills/implement/SKILL.md`, `skills/implement/fix-pass.md`, `skills/verify/SKILL.md`, `skills/writing-style/SKILL.md` and the three templates. Five differ: the three definitions, `skills/agent-contract/SKILL.md` and `skills/core/SKILL.md`. `diff -r` of the bundle against the clone, run before `README.md` was written, printed for those five the hunks of *Scope* item 3 and no other.

`agents/sealer.md` keeps `model: opus` in its frontmatter, as the source has it. *Scope* item 3 does not name the key, so it stays. A sealer's role session would therefore run on that model whatever the person's default is. No sealer was launched for real, and #42 meets it.

### Decisions made while building

Each was judged against `frame/design.md` *Scope* and *Data & interfaces*, which leave the point open.

- **`roleStageOf` in `protocol.ts`.** The frame names `ROLE_STAGES` and `RoleStage`. The daemon also needs to turn what a client sent into a pair. `roleStageOf(value)` returns the pair of `ROLE_STAGES` with that role and stage, or nothing. The daemon keeps that pair and not the client's object, so a session's `role` carries the two names and nothing else a client sent with them. A case sends a pair with a third key and reads it gone.
- **An `ask` whose `role` is no object** is refused with `no role undefined at the stage undefined`. *Scope* item 10 gives the sentence for a pair the list lacks, and the same sentence is used for a value that names no pair at all. An `ask` with `role: null` is refused the same way, and only an absent `role` starts a session with none.
- **The refusal comes before the worktree is looked up.** A role the protocol does not list is refused though the work item is also unknown.
- **The messages of a start the adapter rejects.** *Scope* item 8 says a role launch on an adapter with no bundle folder rejects the start, and gives no text. The texts are `this adapter was given no role bundle, so it launches no role` and, for an adapter with a bundle and no folder for the rules files, `this adapter was given no folder for the rules files, so it launches no role`. A bundle that lacks a document rejects with `the role bundle lacks <path> (<bundle folder>)`.
- **The rules file is written before the login shell is asked.** A role launch that cannot have its rules fails without a lookup.
- **The fake adapter's default answer for a role** is `As the <role> at the stage <stage>, you asked: "<prompt>"`.
- **A build replaces `dist/bundle/` whole.** *Scope* item 1 says the build copies the folder whole. `build.mjs` removes `dist/bundle/` first. Without that, a file the tree's bundle held once, a hook among them, stays in a person's build and a role session loads it. A case plants `dist/bundle/hooks/hooks.json`, builds, and reads it gone.
- **The frontmatter that is cut** is the lines between a first line `---` and the next `---` line, with the blank lines after it. A document that opens with no frontmatter is taken as it is, a `---` line inside its body included.
- **`roleCheck` reads a plugin error's `message`,** and prints the entry as JSON where it has none.

### A case beyond the scenario table

`frame/design.md` *Data & interfaces* says `main.ts` passes the folder `bundle` beside its script and `roles` inside the run folder, and no scenario holds it. `test/role-bundle.test.ts` has a case that starts the built `dist/daemon.js` with a script CLI found through a script `SHELL`, asks as the proofer at a round over the socket, and reads the CLI's arguments and the rules file in the run folder. It starts no window. The file imports `buildApp`, so it runs in the `app` project, one file at a time.

### How each case was seen red

The code of the first commit was written beside its cases, so each red was shown by setting the code aside, and each unit was then broken by `seal mutate`.

- **Against the tree without the change.** The source changes were set aside with `git stash` and the cases run. The ten cases of `test/daemon.test.ts` and `test/fake-adapter.test.ts` that name a role or the new field failed on their own assertions, for example `expected undefined to be null` for a session's `role`. The 21 role cases of `test/claude-adapter.test.ts` failed with `claudeArgs` ignoring the role on its assertion, and the others on a name the old modules do not export (`roleCheck is not a function`, `ROLE_STAGES` undefined). `test/role-bundle.test.ts` failed at its import of `claude-roles`. A failure on a missing name shows no guard, so those cases take their red from the mutants below. `git stash` is shared by every worktree of the clone. Both stashes were popped in the command after the run, and `git stash list` is empty.
- **`seal mutate`, every mutant red**, each run at a committed tree:
  - `src/daemon/adapters/claude.ts`, 14 mutants against the role cases of `test/claude-adapter.test.ts`: the bundle's folder after `--add-dir` dropped, `--agent` dropped, the result-before-init failure removed, the `plugin_errors` branch disabled, the agent test disabled, `refused` never set, the stop removed, the check never marked as settled, each of the two start refusals' texts, the folder's mode, the `init` subtype test, the error's message, and a wrong agent's name.
  - The same file, 2 mutants against the fixture's cases alone: the `agents` key and the `plugin_errors` key renamed.
  - `src/daemon/adapters/claude-roles.ts`, 12 mutants against the same cases: the order of the two documents of every role, each of the three rows of the table, the agent's name, the rules file's name, the frontmatter kept, the frontmatter's anchor removed, the missing document's message, the `=====` line dropped, and two sentences of the head. Two more against `test/role-bundle.test.ts`: the plugin's name, and a document the bundle does not hold.
  - `src/daemon/adapters/fake.ts`, 2 mutants: the role not given to `pieces`, and the default answer without the role.
  - `src/daemon/daemon.ts`, 5 mutants against the `headless sessions` cases: the pair not looked up, the refusal disabled, the refusal's text, the session's `role` set to null, and the role not given to the adapter.
  - `src/shared/protocol.ts`, 2 mutants: the stage not compared, and the sealer's pair removed.
  - `src/daemon/main.ts`, 2 mutants against `test/role-bundle.test.ts`: the bundle's folder name and the rules folder's name.
  - `build.mjs`, 2 mutants: the copy removed, and the removal of the old folder removed. The second SURVIVED at first. The case that plants a stale file was added, and the mutant then read red.
- One mutant was run alone to read its failing line, because a call with several mutants prints verdicts only. The head's sentence "so do not open it again" removed fails the head's case on that line of the diff.

### The real role session (scenario 12, Q1's default)

Run once, at `958ade1`, on the owner's login, with Claude Code 2.1.330: `OWLERY_ROLE_RUN=1 pnpm --filter @owlery/desktop run role:run`. It exited 0 with the one case passed in 11.8 seconds. Executed.

The case starts a daemon in its own process with the Claude adapter, the built bundle `dist/bundle` and a scratch repository's work item, and asks the proofer at a round three questions. The session's answer, whole:

```
1. `<scratchpad>/<work-item-id>/round-<n>/clone`
2. 8, 16 and 20
3. `# Review round <N>: <work-item-id>`
```

- **Q3, the definition is the session's system prompt.** Line 1 is stated by `agents/proofer.md` alone. The stream holds one tool use, a `Read` of `templates/records/sdd-round.md` with `limit: 1`, so the session did not open its definition and still quoted it. Line 2 is stated by `skills/agent-contract/SKILL.md` alone, which the daemon appended. The launch stands as framed.
- **Q4, a bundle file is read without a permission request.** The `Read` of `<bundle>/templates/records/sdd-round.md` was answered at once. Its line of the stream carries `permission_decision: { decision: "accept", source: "config", reason_type: "mode" }`, and the result's `permission_denials` is empty. So the documents a later step opens are in reach under `--permission-mode default` with the bundle after `--add-dir`.
- **Q5, the start of a proofer's round costs 33,249 tokens.** The first message's `usage` reads `cache_creation_input_tokens: 33249`, with 2 input tokens beside it. That is Claude Code's own prompt and tools, the definition (10 KB) and the appended file (36,274 bytes) together. The run cannot say the appended file's share. The recorded plain session of #8, `test/fixtures/claude-stream.jsonl`, started at 17,675 tokens on 2.1.327 (6,058 created and 11,617 read), so a role adds about 15,600 tokens over a plain session, across two versions of the CLI. The result's whole `usage`: 4 input, 33,509 cache creation, 33,249 cache read, 300 output of which 117 thinking, two turns. `total_cost_usd` is 0.2807378 at list price, on `claude-opus-5-5`, the login's default model.
- **The settings files and plugin lists are unchanged.** The case compared the bytes of `~/.claude/settings.json`, `~/.claude/settings.local.json`, `~/.claude/plugins/installed_plugins.json` and `~/.claude/plugins/known_marketplaces.json` before and after, each where it exists, and they were equal.
- **Q2's entry was seen.** `jq '.pluginUsage["owlery@inline"]' ~/.claude.json` printed `null` before the run and an entry with `usageCount: 0` after it. Executed, outside the case.
- **The session's own skill list holds four of the bundle's skills.** The `init` line lists `owlery:code-review`, `owlery:implement`, `owlery:verify` and `owlery:writing-style` under `skills` and `slash_commands`. It lists neither `owlery:core` nor `owlery:agent-contract`, whose frontmatter says `user-invocable: false`. The frame's probe saw `owlery:core` listed for a scratch plugin. So the two descriptions *Scope* item 3 rewrote are not shown to a session in that list on 2.1.330. They are still true of the files.
- **The CLI left its own state.** The run added the session's transcript under `~/.claude/projects/` and rewrote `~/.claude.json`, as every run of the CLI does. Nothing of it was removed.

**How the stream was captured.** The adapter exposes no raw line. The case asks the person's login shell for the CLI as the adapter does, then gives the adapter a script `SHELL` that names a script in the CLI's place. That script runs the real CLI with the adapter's arguments and environment and copies its output with `tee`. So the run went through the adapter's launch whole, except that the exit code the adapter saw was `tee`'s. The case leaves the folder with the stream in the system's temporary folder for whoever runs it. This run's folder was copied to the scratch directory and removed.

The fixture `test/fixtures/claude-role-stream.jsonl` is that stream's nine lines, with the session id, each `uuid`, each message, request and tool id, the rate limit's numbers, the credential's expiry time, the thinking block's signature and each path of the machine replaced, by `sanitize.py` in the scratch directory. Scenario 7's "the run goes on" case and three more read it.

### What phase 2 needs

- `RoleAdapter` has no `notice` yet, and `ready` no `agentNotice`. `claudeAdapter`'s options are `{ lookupTimeoutMs, bundleDir, rulesDir }`, and its lookup is the `lookup` closure inside it, which `notice` can share with `start` through `found`.
- The stop of a run is now the `stop` function inside `start`, defined before the lines are read. The check of the first line calls it.
- `test/role-bundle.test.ts` already starts the built `dist/daemon.js` with a script `SHELL` and reads its socket, without a window. The drive of scenario 11 needs a window, so it starts the app through `startApp` as the other built-app files do.
- `test/daemon.test.ts` pins the keys of `ready` at line 473, and its `daemon()` helper builds the fake adapter.
- Every daemon the suite starts with `claudeAdapter` now gets a bundle folder from `main.ts`. A daemon whose script has no `bundle` beside it rejects a role launch with the missing document's message.

### Runs and their scope

- The phase boundary set, one command at `f56fb32` with a clean tree: `node scripts/test-in-electron.mjs` over `claude-adapter`, `fake-adapter`, `daemon`, `view`, `last-look`, `role-bundle`, `role-session`, `ask-section`, `keep-awake` and `notification-click`, the test files the phase changed and the ones that import a changed module. It exited 0: 9 files passed and 1 skipped, 697 cases passed and 1 skipped, in 140 seconds. The skipped file is `role-session.test.ts`, which runs only through `role:run`. The four built-app files among them ran one at a time, as the `app` project runs them.
- The other six built-app files (`daemon-restart`, `memory`, `korean-input`, `terminal-basics`, `work-item-form`, `work-item-menu`) also start `dist/daemon.js`, which this phase changed, and were not run. They are a row of `gaps.md`.
- The repository names no linter and no formatter. The changed TypeScript files were typechecked through a project file in the scratch directory that extends the app's `tsconfig.json` and lists those files, and it exited 0. Before that project file existed, `pnpm run typecheck` over the whole app was run twice during the first slice, once failing on `claude-roles.ts` and once passing. The whole typecheck is the broad gate's, so those two runs are named here and claim nothing for it.
- `pnpm install --frozen-lockfile` was run once in the worktree, which had no `node_modules`.
- The commits of this phase end with `Co-Authored-By: Claude Fable 5.2`, the model that built it, where the spawn named another.
