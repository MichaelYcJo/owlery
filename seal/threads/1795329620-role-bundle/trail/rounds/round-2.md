# Review round 2: 1795329620-role-bundle

```seal
target: 2d2056d, fixes 8685647..2d2056d
```

This is a verifying round. Its code bound is `git diff 8685647 2d2056d`, six commits: `f3112ba`, `595798b`, `ccae1e4`, `5eda611`, `88369a9` and `2d2056d`, the last of which commits round 1's close blocks. Round 1's coordinates were carried, and its verdicts were not: the framer's probe output (line 88 of `probe-role-launch.txt`) and this session's `test_tmp_version_home.sh` result were taken as round 1 recorded them, because the fix diff changes neither the CLI nor the probe. The work item's records were read at `2d2056d`. `frame/design.md`, `frame/plan.md`, `gaps.md` and `pr.md` changed in the range and were read again, each in the diff and at the lines around it. `routing.md`, `frame/questions.md`, `changelog.md` and both phase records are unchanged since round 1 read them whole. Executed: `git diff --stat 8685647 2d2056d`.

## Findings

No new finding. The fix diff adds no unit beyond the rewritten body of `roleCheck`, one case, one rewritten case and one changed line of a built-app case, and each is answered below.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `roleCheck` now returns `{ seen: true, failure: null }` where `agents` lists the role's agent, before it reads `plugin_errors` (`apps/desktop/src/daemon/adapters/claude.ts:207`). Where the agent is missing, the first entry's message is the reason, and the agent's name is the reason where the list is empty or absent (`claude.ts:209-215`). The docstring at `claude.ts:181-195` says the same. The case at `apps/desktop/test/claude-adapter.test.ts:558` now expects the launch to go on with the agent listed and a built-in plugin's error present. Against the old order it reads red: the old body returned `the role bundle did not load: …` for that line. The new case at `claude-adapter.test.ts:564` holds the message with the agent missing, with `agents` undefined, and with an empty list. Every other statement of the fact that round 1 listed was rewritten in place: *Scope* item 9 (`frame/design.md:79`), scenario 7 (`:96`), the two rule changes (`:175`, `:180`) and `pr.md:15`. Executed: `git grep` for "or a plugin error is listed", "or lists a plugin that did not load" and "though the agent is listed" finds them only in `trail/rounds/round-1.md`. Executed: `node scripts/test-in-electron.mjs test/claude-adapter.test.ts` at `2d2056d`, exit 0, 66 cases passed.

```seal
confirms: round-1#2
```
What holds: `apps/desktop/test/keep-awake.test.ts:117` starts the app with `SHELL: "/usr/bin/true"`. The lookup runs `/usr/bin/true -l -i -c …`, which prints nothing, so `parseLookup` finds no CLI and the notice stays null. The case opens no pane, so the only other readers of `SHELL` stay unreached: `pty.ts:76` and `claudePaneCommand` (`hooks.ts:90`). Read. `gaps.md:9` and `gaps.md:10` no longer claim that a suite case reaches the person's login shell. `gaps.md:8` lists the five built-app files that neither phase nor the fix pass ran. Its rows were reworded in place, and no row left the memo. Read: the diff of `gaps.md`. Executed: `node scripts/test-in-electron.mjs test/keep-awake.test.ts` at `2d2056d`, alone, exit 0, 4 cases passed.

```seal
confirms: round-1#3
```
What holds: both rule changes say that every session of the CLI rewrites `~/.claude.json`, and that the daemon's `claude --version` writes nothing there (`frame/design.md:185`, `:189`). The same fact in `gaps.md:25` now reads "every session of the CLI". The one remaining "every run of the CLI" stands in `trail/phases/phase-1.md:71`, the phase's dated record. Executed: `git grep -n -e "every run of the CLI" -e "Every run of the CLI" -e "CLI가 실행될 때마다"`. `frame/plan.md:71` records the fold as a judgment of the run.

```seal
confirms: round-1#4
```
What holds: `pr.md:7` counts 10 files byte for byte and 5 changed, and names `LICENSE` apart. `pr.md:10` says that Q2 is left to the owner and that its default accepts the entry. Both agree with `apps/desktop/role-bundle/README.md` and `frame/questions.md:21`. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The whole suite, the typecheck and the `Broad gate` command at HEAD. Contract rule 2 keeps them from this round, which ran one unit file and one built-app file | `seal/config.json` | the orchestrator's broad run |
| Round 1's open questions: the issue's third *Done when* line against a quoted fact, and Q2 | `seal/threads/1795329620-role-bundle/frame/design.md:101`, `seal/threads/1795329620-role-bundle/frame/questions.md:21` | the sealer, and the owner |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/claude-adapter.test.ts`, in `apps/desktop` at `2d2056d` | exit 0, 66 cases passed in 24 seconds |
| `node scripts/test-in-electron.mjs test/keep-awake.test.ts`, in `apps/desktop` at `2d2056d`, run after the first and alone | exit 0, 4 cases passed |
