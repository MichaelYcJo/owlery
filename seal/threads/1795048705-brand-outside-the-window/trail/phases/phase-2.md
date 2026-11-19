# Phase 2: 1795048705-brand-outside-the-window

## What this phase found

**The frame holds.** Checked at `8f44d8b` before the build: line 9 of each README said there is no code, lines 16 and 18 of each held the three phrases *Scope* item 8 changes, and each README had 4 heading lines and 6 table lines, as `frame/design.md` *Grounding* says of `68dc407`. `package.json` names `pnpm@10.33.0`. `docs/roadmap.md` has the heading *Milestones* and its Korean edition *마일스톤*, which the new section links.

**The scenarios the plan's row names.**

- Scenario 7, read at `b7ced11`: each README opens with the image, the title, the language line and the bold description of *Data & interfaces*, in the words the frame gives. Executed: `test -f apps/desktop/assets/icon/app-icon.svg` exits 0. How GitHub draws the image is a row of `gaps.md` *Not verified*.
- Scenario 8, executed once at `894ac0d`, with Node.js v26.13.1 and pnpm 10.33.0: in a `git clone --no-local` of the branch in scratch, `pnpm install` exited 0 and rebuilt `node-pty`. `pnpm --filter @owlery/desktop start` then built `dist/`, the page answered on the debugging port, the inbox screen was the one not hidden, and the status line read "Daemon running, no agent".
- Scenarios 9 and 10, executed at `b7ced11`: each `git grep` prints nothing. The three English phrases are found in `README.md` at `f48ecc1`, so the searches read the file.
- Scenario 11, executed at `b7ced11`: `grep -c '^#'` gives 5 for each README and `grep -c '^|'` gives 6 for each. The last search of the `Broad gate`, for the word the Korean editions do not use, prints nothing over `docs` and the two READMEs.

**The start command ran with two flags added.** `start` as written keeps the app's data in the user's Application Support folder, which the spawn forbids a drive to touch. The drive ran `pnpm --filter @owlery/desktop start --user-data-dir=<a folder under /private/tmp/claude-501> --remote-debugging-port=9351`. pnpm passes both to `electron .` after the build, so the command a reader types is the same script with no flag. Judged against the spawn's limit on where a launched app keeps its data; the flag-free command on a fresh account is a row of `gaps.md` *Not verified*.

**The install does not download Electron, and the first start does.** In the clone, `pnpm install` finished in 3 seconds and the first `start` printed "Downloading Electron binary..." before the window opened. The READMEs gained one sentence that says so, in the commit after the drive (`b7ced11`). The sentence changes no command, so scenario 8 was not run again.

**Scenario 8's commit is not the phase's last.** The drive ran at `894ac0d`. `b7ced11` adds the one sentence above to each README and `changelog.md`, and changes no file the install or the build reads.

**`TRADEMARKS.md` now says the READMEs show the emblem.** The orchestrator left the choice to this phase. The entry of `app-icon.svg` ends "which both READMEs open with", as the other entries say where the app shows their drawings.

**"Release 0.0.1 runs this much" names the release and no milestone.** *Scope* item 6 asks what the tree's release does today. The paragraph lists the four things the frame names and claims nothing about which milestone the release completes, which `docs/roadmap.md` *Releases and the tracker* decides. It goes stale at the next release, as `frame/plan.md` *Technical context* says of it.

**The Korean edition uses the words of `docs/roadmap.ko.md`.** Its row of milestone 1 says "작업함", "터미널 칸", "worktree" and "헤드리스 Claude 세션", and the new section takes them.

**No unit adds behaviour, so no case and no `seal mutate` run.** The phase changes prose alone: two READMEs, one sentence of `TRADEMARKS.md` and the records. Nothing in the tree parses them but the `Broad gate`'s counts, which scenario 11 ran. No test file reads either README: `git grep -n -e 'README' -- apps/desktop/test` prints lines of `repositories.ts` and `worktrees.test.ts` alone, each of which writes or reads a `README.md` inside a fixture repository the case builds (executed, and the lines read). So no vitest case ran.

**What the drive left.** The clone stays in the phase's scratch. The processes pnpm started were stopped by the recorded PID of their group, the daemon was gone with them, and the data folder under `/private/tmp/claude-501/` was removed. No screen capture was taken.
