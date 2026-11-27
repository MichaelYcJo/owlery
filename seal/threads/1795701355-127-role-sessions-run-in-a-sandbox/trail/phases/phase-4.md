# Phase 4: 1795701355-127-role-sessions-run-in-a-sandbox

## What this phase found

**The frame holds for item 10, with one more `init` line than it names.** `frame/design.md` *Scope* item 10 has the recorded `init` lines of `claude-adapter.test.ts` and of `test/fixtures/` gain a `claude_code_version`. The fixtures already named one (`claude-stream.jsonl` 2.1.327, `claude-role-stream.jsonl` 2.1.330), so no fixture changed. A third place prints an `init` line for a role launch: the stand-in CLI of the built-app case "is what the built daemon launches a role with…" in `role-bundle.test.ts`. Its line named no version, so under the new check the built daemon's proofer would fail with the sentence on a missing version. The line now names 2.1.330, the version the same script prints for `--version`. The class was listed by `git grep -n -E 'subtype.{0,4}init' -- test src` in `apps/desktop`, which lists every `init` line a case writes or reads. That search is a sample of spellings: a line built another way is not in it. Judged against *Scope* item 10, whose aim is that every case of a role launch reads a line that names a version.

**The cases' `init` lines name 2.1.330, and the cases of scenario 12 name 2.1.328, 2.1.329 and 2.1.332.** The `init(...)` helper of the `roleCheck` cases stands for the line Claude Code 2.1.330 printed, as its comment says. So it and the role-launch lines of `claude-adapter.test.ts` take that version, and the cases of row 12 name each version the row names. One line stays without a version: the second `init` line of "reads the first line of a role launch once…". That case asserts that a later line fails nothing, and a later line that names no version is the same case. Judged against `frame/design.md` *User scenarios* row 12.

**"Holds no version" reads as `versionNotice` reads a version: three numbers joined by dots.** `roleCheck` fails a line whose `claude_code_version` is no string, or is a string without three dot-joined numbers, with "the session did not say which version of Claude Code it is, so its sandbox was not checked". It then fails an older version with `versionNotice`'s sentence, and reads the agents last. Without the first test, a string such as `"2.1"` would reach `versionNotice`, which says nothing where it finds no version, and the launch would pass. Judged against `frame/design.md` *Data & interfaces*, the bullet on `MIN_CLAUDE_VERSION` and `roleCheck`.

**Each new case was seen red against the tree before `da8afa16`'s `claude.ts` (executed).** With the test changes alone, `claude-adapter.test.ts` read 9 failed and 98 passed. The two new `roleCheck` cases failed at `claude-adapter.test.ts:771` (2.1.328 passed) and `:777` (no version passed). The two new rows of the role-launch table each ran to their 20-second limit, because the CLI was not stopped. The five cases of the old CLI's notice failed on 2.1.326 in place of 2.1.329.

**Mutation runs, each `seal mutate` over `src/daemon/adapters/claude.ts` as `da8afa16` committed it, every mutant red (executed).** The tests were `claude-adapter.test.ts -t "the first line of a role launch"`, and for the last mutant also `the notice of an old CLI`. Each red was read on its failing line.

- The no-version branch swallowed: red at `:777`.
- Only a non-string refused, so a string with no version passes: red at `:777`.
- An older version let through: red at `:771`.
- The agents read before the version: red at `:772` and `:778`, the two assertions on the order.
- `MIN_CLAUDE_VERSION` set to 2.1.328: red at the notice's cases and at `:771`.

`seal mutate` runs `--tests` without a shell, so a leading `VAR=value` is taken as the command's name. The first try of the five read `could not start` and wrote nothing. They were run again with `env OWLERY_BACKGROUND=1` in front.

**The phase boundary, each command run alone (executed).**

- `claude-adapter.test.ts` and `view.test.ts`, at the tree `da8afa16` committed: 710 passed.
- `role-bundle.test.ts`, which builds and starts the app: 21 passed. Its notice case and its launch case are the two this phase changed.
- `pnpm --filter @owlery/desktop run role:refusal` at `da8afa16`, against the stand-in model with the installed Claude Code 2.1.332: 1 passed and 1 skipped. `role-session.test.ts` launches through `claudeAdapter`, so the real CLI's `init` line, which named `2.1.332`, passed the new check.

The other test files were not run (`gaps.md` *Not verified*). `tsc --noEmit` exited 0 before the commit. The package configures no formatter or linter.

**Two paragraphs of `trail/phases/phase-3.md` state what the fold of 2026-11-27 overturned.** Its Q4 paragraph says the `.claude/.cc-writes/` folder is "a file the person did not make in their tree, which `docs/roadmap.md` row 1 refuses". `frame/questions.md` Q4 now says that sentence overstated row 1, which names the person's settings files. Its Q5 paragraph says "`MIN_CLAUDE_VERSION` stays 2.1.326 by Q5's default", and the minimum is now 2.1.329. This phase does not write phase 3's record, so both are named in the hand-back.

**No process-change table, and no version move.** The diff changes no file that the plugin's `docs/layout/the-record-layout.md` *A change writes fragments, never a shared file* lists, and `frame/plan.md` *Operational impact* says the release branch sets the version.
