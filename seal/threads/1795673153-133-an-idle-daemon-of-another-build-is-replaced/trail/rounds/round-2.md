# Review round 2: 1795673153-133-an-idle-daemon-of-another-build-is-replaced

```seal
target: 0f33aba6, fixes b492c073..0f33aba6
```

The round answers the four findings round 1 closed: finding 2 `fixed b51d9dbb`, and findings 1, 3 and 4 `fixed 2e3f5704`. It reads the whole diff `git diff b492c073 0f33aba6`, which also holds the judgment row `2b451482` and the close commit `0f33aba6`, and reviews no code outside it. `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `changelog.md` were read whole at the target. No `pr.md` stands, and `Commit and pull request language` is English. Carried from round 1 and not re-established: the comparison of `ClientMessage` with `Daemon#handle`, the reads of the tags `v0.0.2` to `v0.0.4`, and every confirmation of round 1 on code the fix diff does not touch.

## Findings

No finding.

## Confirmations

```seal
confirms: round-1#1
```
What holds: `frame/design.md` *Rule changes* ends with the two `change` entries of *Screen framework: Electron* and *화면 프레임워크: Electron*, word for word as round 1 gave them, each with its `check:` line. Each `from` stands once in #216's `frame/design.md`, in the `to` of its `add` (`grep -c -F` on each, executed, 1 and 1). #133 merges after #216, so the settle meets #216's sentence before this work's `change`. The release note's half is a row of `frame/plan.md` *Judgments of the run* (`2b451482`). It says that this work's `changelog.md:8` names the change, and that #216's fragment stays as merged. `changelog.md:8` says "A press of the sidebar's refresh button ends this way against such a daemon, before the button's own 15-second wait." (read). Round 1 left this choice to the orchestrator, and the row records it with its grounds.

```seal
confirms: round-1#2
```
What holds: `daemonForLoad` asks `readyOf` only where `otherBuild` is true and `replaced` does not hold the build (`apps/desktop/src/main/daemon-client.ts:59-60`). Every other load reaches `ensureDaemon` with the one hello it says. The stand-in of `apps/desktop/test/daemon-client.test.ts` notes each hello it answers (`:148-152`). The case "keeps a daemon of the script's own build that runs nothing …" reads one (`:342`). The fix pass's red was run again: with the hello moved back before the build is judged, through the `Edit` tool, `-t "daemonForLoad"` exited 1, and the case failed at `:342` with `expected 'hh' to be 'h'`, and nine other cases passed. The source was then restored, and `git status --short` printed nothing. After that, `test/daemon-client.test.ts` and `test/daemon-restart.test.ts` passed whole. The built app's replacement of scenario A is among them, so the load still replaces an idle daemon of another build. No other case of the stand-in reads the `hellos` file. The comment the fix adds at `:58` says what the code does and why. The statements of the records that name the load's hello were listed with `git grep -n -i 'hello'` over the work item's records, outside the rounds (executed). `frame/plan.md:23` and `trail/phases/phase-1.md:23` speak of the replacement's own hello, which stands. The phase records are dated accounts. The search is on one word, so it is a sample.

```seal
confirms: round-1#3
```
What holds: `routing.md`'s *Branch* bullet reads as round 1 gave it, the second paragraph and the two blank lines are gone, and the file ends with a line break (`od -c` of its last bytes, executed). The base it names, `57449b14`, is the merge base of HEAD and `origin/release/v0.0.5`, as round 1 executed.

```seal
confirms: round-1#4
```
What holds: `frame/plan.md:17` says release 0.0.5, before the first public release, 0.1.0. The row of `frame/design.md:24` dates the milestone `release: 0.1.0` to the framer's reading, and names the owner's move to `release: 0.0.5`. `git grep -n -F 'release 0.1.0'` over the work item's records, outside the rounds, prints nothing (executed).

What matched: the new units of the fix diff. They are the two `if` blocks of `daemonForLoad`, the stand-in's note of each hello, and the case's new line and longer name. Each holds what round 1's finding 2 asks, and none changes what another case of the `daemonForLoad` or `stopDaemon` group asserts. `changelog.md` is unchanged, which is right: it states nothing of the hellos a load says.

Nothing stays open in this round. The broad run of the command in `seal/config.json` `Broad gate` is the orchestrator's, and the sealer's spawn follows it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: the whole suite, the package's typecheck and the documents' check at the work item's last commit. The suite stays `unverified` | `gaps.md:7` | the orchestrator, at the broad gate |
| Whether a stop that failed counts as a replacement under *Scope* item 3, carried from round 1. No row of `frame/plan.md` *Judgments of the run* rules on it at the target | `frame/design.md:50`, `apps/desktop/src/main/daemon-client.ts:62` | the orchestrator, by a fold of item 3 or a ruling |
| A load, and a window, against a daemon of a released build, 0.0.2 to 0.0.4 | `gaps.md:11`, `gaps.md:12` | the orchestrator, by a walk with a daemon of a released build, or the owner's walk of the release |
| The tab of a pane listed with `workItemId` null, and the seal button, against a daemon of an earlier build | `gaps.md:14`, `gaps.md:15` | the answerers those rows name |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/daemon-client.test.ts -t "daemonForLoad"` in `apps/desktop`, `OWLERY_BACKGROUND=1`, with `daemonForLoad` saying its hello before the build is judged, as at `b492c073` | exit 1, 1 failed at `test/daemon-client.test.ts:342` with `expected 'hh' to be 'h'`, 9 passed, 19 skipped; the source restored after it |
| `node scripts/test-in-electron.mjs test/daemon-client.test.ts test/daemon-restart.test.ts` in `apps/desktop`, the same environment, at the target | exit 0, 2 files and 39 cases passed |
