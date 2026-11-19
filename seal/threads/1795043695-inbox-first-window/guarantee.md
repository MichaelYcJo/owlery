# Guarantee: 1795043695-inbox-first-window

This run audited `3b21d91` against `277eb35`. The base `release/v0.0.1` resolves to `277eb35` through `release/v0.0.1@{upstream}`, `origin/release/v0.0.1` and `release/v0.0.1` alike (`git rev-parse --verify --quiet`, `executed`). `trail/gate.md` names its newest run at `8636571`, an ancestor of HEAD (`git merge-base --is-ancestor`, exit 0, `executed`). The three commits after it touch the work item's records alone: `a346621` touches `trail/gate.md`, `09304bc` touches `guarantee.md`, and `3b21d91` touches `gaps.md` (`git log --no-merges --name-only 8636571..HEAD ^277eb35`, `executed`). `seal pr-body seal/threads/1795043695-inbox-first-window --body <scratch>/pr-body.md --check` exited 0 and printed `matches` (`executed`).

Three earlier runs withheld, at `09377b4`, at `ad975f3` and at `a346621`. Their verdict blocks stand below, unedited. Under `docs/forms/the-guarantee.md` *The guarantee*, this run re-ran the claims whose coordinates a commit since `a346621` touched. Those commits are `09304bc`, the third run's own guarantee, and `3b21d91`, which rewrote `gaps.md:98` and changed one line of the file. `git diff --stat a346621 HEAD` names `gaps.md` and `guarantee.md` alone, and `git diff --stat ce52a19 HEAD -- . ':!seal'` names no file (`executed`). So the code, the cases and every other record stand as the third run audited them, and its results on them stand. This run read every party again.

`skills/code-review/scripts/chain_check.py --baseline 277eb35 --sealing` at HEAD exited 0. Its records arm and its broad gate arm printed nothing, and its guarantee arm named the third run's `withheld` block and `3b21d91` after it, which this run answers (`executed`). The sealer ran nothing broad: the broad gate is `trail/gate.md`'s.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| `gaps.md:98` says every way the theme's notice leaves the status line: a later choice saved, another notice in its place, or the line emptied when the connection to the daemon opens and when the daemon answers a pane started or a work item created | `gaps.md:98`, as `3b21d91` wrote it; the third run's reason, its block below | `git grep -n -w -e tell -e untell -- apps/desktop/src`; `grep -n notice apps/desktop/src/renderer/sidebar.ts`; read `renderer.ts:212-228`, `:265-284`, `:309-315`, `sidebar.ts:75-89`, `view.ts:299-302`; `git grep -n -e 'type: "started"' -e 'type: "workItemCreated"' -- '*.ts'` | holds. `notice` is written at `sidebar.ts:77` alone, inside `tell`, and `tell` is called at eight places, all in `renderer.ts`. The three `tell("")` are `:214` (`started`), `:220` (`workItemCreated`) and `:276` (the socket's `open`), the three the line names. `:244` (a refused request), `:269` (no daemon to reach), `:282` (reconnecting, before the reload) and `:314` (a failed save again) are another notice in its place. `:313`, `untell(THEME_NOT_SAVED)`, is the later choice saved, and `untell` has no other caller. The daemon sends `started` and `workItemCreated` to the requesting socket alone (`daemon.ts:233`, `:249`), so "answers" holds (`executed` for the greps, `read` for the code). This line did not hold in the third run's sample. It holds now, because the three `tell("")` and the line's three events are the same set |
| No other sentence in the tree says how long that notice stands, so `3b21d91` leaves no second statement of the old fact standing (rule 19) | `3b21d91`; `trail/rounds/round-4.md` finding 2's grep | `git grep -n -i -e "could not be saved" -e "not saved" -e notSaved` outside the work item's `trail/` and `guarantee.md`; `git grep -n -i notice` over the frame, `changelog.md`, `pr.md`, `docs` and `README.md` | holds. The first grep lists the constant, the `ThemeActions` member, its call, the case at `test/view.test.ts:816-819` and `gaps.md:98` alone. The second finds no sentence on the status line's notice outside `frame/design.md:315`, which names `noticeWithout` and sets no end to the notice (`executed`) |
| `3b21d91` touched the work item's records alone | `3b21d91` | `git show --stat 3b21d91` | holds: one line of `gaps.md` changed, and no other file (`executed`) |

Not sampled, each `unverified` with its answerer:

- Every claim the three earlier runs re-ran. No commit since `a346621` touched their coordinates, so they stand as those runs' results and were not re-run. The third run's rows include the sidebar's cases seen red, the theme block's case seen red, `noticeWithout`'s case, the form held before `ready`, the press rules, `6f16158`'s two blocks, the rows of `## Removes` and scenarios 10 to 13, 23 and 24, and `pr.md`'s quotes.
- The prompt's account that `3b21d91`'s line is the one the third run offered word for word. That run's guarantee carries no offered line, and this run judged the line against the tree alone. Nobody answers it, because nothing rests on it.
- The fix pass's drive at `571edfa`, and a failed save shown on the built app's status line. Only a run of the built app re-runs them, and this run launched none. The owner answers them at the built app (`gaps.md` rows 8 and 38).
- `frame/questions.md` Q4, Q5 and Q7 to Q11, and the order of the CLI's two events. The owner answers them (`gaps.md` rows 26 to 28).

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| The design (`frame/design.md`, `frame/plan.md` *Judgments of the run* rows 1 to 24) | As the third run read it, unchanged since `a346621`. `frame/design.md:315` names `noticeWithout` and sets no end to the notice | the code at HEAD; `gaps.md:98` | none (`read`) |
| The build (the diff `277eb35...HEAD`, `trail/phases/phase-1.md` to `phase-9.md`, the fix passes) | Unchanged since `ce52a19`. `routing.md` reads `Implementation` `crafter`, and each of the nine phases has its `trail/phases/phase-N.md` | the design; the third run's sample | none (`read`) |
| The orchestrator's routing and its raise (`routing.md` *Why this way*; *Judgments of the run* rows 21 and 22) | The review is raised to the review chain, and round 3 reads the renderer parts that rounds 1 and 2 left under `## Not judged` | `round-3.md:7`, as the third run read it; `routing.md`, which now reads `Review` `through the review chain` | none (`read`) |
| The last round (`trail/rounds/round-4.md`, target `ce52a19`) | A verifying round over `7432f26..ce52a19`. Its two `should` findings are located in the records alone and are `fixed 6f16158` | `frame/plan.md:166` as `6f16158` wrote it. Its finding 2's grounds at `round-4.md:48` list the three `tell("")`, and `gaps.md:98` now names all three | its replacement block at `round-4.md:51`, which left out the connection's opening. `3b21d91` corrected the line in `gaps.md`, where the fact stands. The round is history and stays as written, so this is no reason. Its row numbers for `frame/plan.md:165-166` are off by one and its line coordinates are exact, as the third run found (`read`) |
| The closing memo (`gaps.md`) | `:98`: "The status line says so until a later choice is saved, another notice takes its place, or the line is emptied, which happens when the connection to the daemon opens and when the daemon answers a pane started or a work item created." `:83`: "The theme's control acts as at any time" before `ready` | `renderer.ts:214`, `:220`, `:244`, `:269`, `:276`, `:282`, `:313`, `:314`; `sidebar.ts:76-89`, as the first row above gives them | none (`read`) |
| The changelog (`changelog.md`) | Unchanged since the third run. It says nothing of how long the theme's notice stands | the diff | none (`read`) |
| The orchestrator's part of the pull request body (`pr.md`) | Part of #18, closing when `release/v0.0.1` reaches `main`. It quotes rows 8, 9, 11, 12, 10 and 1 | the rows, as the third run's comparison gives; `seal pr-body --check` exit 0 at HEAD. No `pr.<lang>.md` stands, and `seal/config.json` names English for both language keys | none (`read`) |

**The issue against the owner's recorded decisions.** Issue #18's done-when lines (`gh issue view 18`, `executed`) and what was built differ in these places. The third run read each one at `a346621`. No code has changed since, and this run checked the window's size and title bar at `apps/desktop/src/main/main.ts:19`, `:23`, and `frame/design.md:76`, `:108` again. None of these is a reason against the verdict, because the owner's decisions in *Judgments of the run* cover each one.

- Line 1 says the inbox fills the window. A sidebar stands at the left of every screen (*Judgments of the run* row 12; *Scope* items 1 and 20).
- Line 1 says a line shows its branch and its new commits. A line's second row shows the branch only where the session has no text and the branch has no commit, or while a search is typed (*Scope* item 2). Its badge counts the commits gained since the last look, and is absent on a first run. The preview and the view always show the branch and the count ahead of the base.
- Line 2 puts the title, the branch and the state at the top of a view, with the panes below. The header holds the title and the branch. The state stands in the strip under the terminal and at the top of the right column (*Scope* item 4).
- Line 3 speaks of "the top bar". No top bar exists any more. No pane is offered outside a work item, and the event log is gone from the whole window, not only from the default screen.
- Line 4 names direction B, artboards B1 and B2, "linked from the work item's records". Row 8 replaces them with the polish mockups' variants 3 and 4. Those are local files, and the records name them by path, not by link (`frame/design.md:76`, `:108`).
- Line 5 holds. The summary is also skipped on a first run, where no look is recorded.
- The issue names none of these, which were built: the sidebar with its search, filter and history (row 12), the second theme and its switch (row 8), the wax seal `owl.svg` (row 11), the pull-in from #27 (row 10), `TRADEMARKS.md` (row 3), and the window at 1440 by 900 with a hidden title bar.

```seal
target: 09377b4 against 277eb35
Verdict: withheld reason: routing.md Why this way, row Review (straight to the PR, the orchestrator's choice under agentic): its grounds name a window rebuilt against the chosen mockup, while the diff also changes the daemon and the protocol (src/daemon/daemon.ts greet and readyWaitMs hold ready on a git read and queue or drop early messages; src/daemon/last-look.ts new; src/daemon/worktrees.ts git log and diff parsing; src/daemon/agent-events.ts hook payloads; src/shared/protocol.ts looked, lastLook and seven fields), which the grounds do not name, and no row of frame/plan.md Judgments of the run raises the route as skills/implement/orchestration.md Under agentic asks (a route is raised when the work outgrows it)
```

```seal
target: ad975f3 against 277eb35
Verdict: withheld reason: frame/plan.md Judgments of the run row 21 (frame/plan.md:163, the orchestrator's raise) says a proofer round reads the diff before the sealer is spawned again, while trail/rounds/round-1.md:177 and trail/rounds/round-2.md:106, under Not judged, say no round read apps/desktop/src/renderer/sidebar.ts, the rest of shared.ts, view.ts from line 460, index.html, themes.css, test/view.test.ts and test/themes.test.ts, and name the orchestrator as their answerer in a later round; no later round stands, and no row of Judgments of the run or line of routing.md answers those rows or narrows row 21 to the daemon and the protocol
```

```seal
target: a346621 against 277eb35
Verdict: withheld reason: gaps.md:98 (Not done, written by 6f16158 from trail/rounds/round-4.md finding 2's block, which no round reads) says the theme's notice stays until a later choice is saved, another notice takes its place, or the daemon answers a pane started or a work item created; apps/desktop/src/renderer/renderer.ts:276 also empties the status line with tell("") when the connection to the daemon opens, which round-4.md:48 lists in its grounds and its block at round-4.md:51 leaves out, and the theme's control acts before that (gaps.md:83; the listener at renderer.ts:310, the connection at renderer.ts:335 after ensureDaemon), so a choice that fails to save before the connection opens loses its notice with nothing in its place
```

```seal
target: 3b21d91 against 277eb35
Verdict: sealed
```
