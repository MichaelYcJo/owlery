# Phase 2: 1795739977-244-207-runner-cases-wait-on-what-they-read

## What this phase found

**The frame holds for phase 2 at `0b940668`** (`read`). `role-bundle.test.ts` did not change between `15701977` and `0b940668` (`git log 15701977..0b940668 -- apps/desktop/test/role-bundle.test.ts` prints nothing, `executed`). The case stands at line 497 and its rewrite, reload and wait at lines 525-529, as `frame/plan.md` *Technical context* says. The stand-in for the CLI stands at line 510, and line 507, which the plan names, holds the declaration of the `hold` path. `daemon.ts#readAgentNotice` drops an answer where a later ask was made meanwhile (`ask !== this.noticeAsks`, `read`), so a read that began before the rewrite and ends after a later one cannot bring the notice back. `claude.ts`'s `notice()` reads what the CLI printed, whatever its exit code, and ends a held run after 10 seconds, as `frame/design.md` *Grounding* says.

**Decisions settled while writing the code**, each judged against `frame/design.md` *Scope* item 5:

- The stand-in reads the file into a variable with `read=$(cat …)`, waits while the hold stands, then prints the variable with `printf '%s\n'`. `$(…)` strips the file's last newline, and `printf` puts it back, so the printed text is the file's text.
- The case writes the new version to `version.next` and renames it over `version`. A rename on one file system replaces the file whole, so no read sees half a file.
- The reload's wait keeps its expression and its `what`. Where it throws, a `catch` reads the status line's text and whether `window.__beforeReload` is gone, and throws the wait's message with `; the status line said "<text>" in the page loaded anew` or `in the page from before the reload` after it. Where the page cannot be read at that moment, the wait's own error is thrown unchanged, so the read never hides the first failure.

**Rows 5 and 6 of *User scenarios & acceptance*** (`executed`, `test_tmp_notice_read_under_way.test.ts`, run once through the lock, not committed). Each of three copies ran the case's steps from this phase in the order of the framer's probe 2. A second client said hello once the notice stood, and the read that hello started was held at one point of its stand-in until the case had renamed the new version into place.

| Copy | Where the second read was held | What the page loaded anew showed |
|---|---|---|
| This commit's stand-in, with this phase's message | between its look at the hold and its read of the version | The notice went before the reload. The wait threw `the window never showed the notice in the page loaded anew; the status line said "Daemon running, no agent" in the page loaded anew`. |
| Item 5's stand-in | after its read of the version, before its look at the hold | The notice. The held read printed 2.1.300, and once the hold went the status line read "Daemon running, no agent". |
| Item 5's stand-in | before its read of the version | The notice. The held read printed 2.1.326, and once the hold went the status line read "Daemon running, no agent". |

The first copy is the red that this phase's stand-in takes away: the stand-in of `0b940668`, under the order #207's message comes from, fails, and its failure shows row 6's message. The probe's own check that the second read had begun read `false` in each copy: it looked for two `begin` lines in a row, and the log put the first run's `printed` line between them. Each copy's log shows the second `begin` before the rewrite, and `paused-until-rewrite 2` after it, so the order was forced as written.

**Mutations** (`executed`, `seal mutate apps/desktop/test/role-bundle.test.ts`, with `-t "notice of an old CLI"` as the tests, after `a0c8800f`):

| Mutant | Verdict |
|---|---|
| The stand-in looks at the hold first and reads the version after it, as at `0b940668` | `SURVIVED` |
| The wait's message adds nothing of the status line | `SURVIVED` |

Each verdict is what the case can give on this Mac. The case's own order meets no read under way at the rewrite here, as the framer's probe 1 found, and a message added only to a failure is read only when the case fails. The red of both units is the probe's first copy above. `frame/questions.md` Q1 holds whether the runner meets the order the probe forced.

**The phase boundary** (`executed`, at `a0c8800f`): the old-CLI case ran twenty times in one locked command, a shell loop over `node scripts/test-in-electron.mjs test/role-bundle.test.ts -t "notice of an old CLI"`, and each run passed. `test/role-bundle.test.ts` then ran whole once and passed its 20 cases. `tsc` over `role-bundle.test.ts` and the files it imports exited 0. No other file reads the case: the stand-in and the wait are local to it.
