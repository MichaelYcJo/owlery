# Guarantee: 1795043695-inbox-first-window

This run audited `67f270d` against `277eb35`. The base `release/v0.0.1` resolves to `277eb35` through `release/v0.0.1@{upstream}`, `origin/release/v0.0.1` and `release/v0.0.1` alike (`git rev-parse --verify --quiet`, `executed`). `trail/gate.md` names its newest run at `56e730b`, an ancestor of HEAD (`git merge-base --is-ancestor`, exit 0, `executed`). The one commit after it, `67f270d`, touches `trail/gate.md` alone (`git log --no-merges --name-only 56e730b..HEAD ^277eb35`, `executed`). `seal pr-body seal/threads/1795043695-inbox-first-window --body <scratch>/pr-body.md --check` exited 0 and printed `matches` (`executed`). The sealer ran nothing broad: the broad run is `trail/gate.md`'s, and its exit codes are the orchestrator's account.

Four earlier runs stand below, unedited: three withheld, at `09377b4`, `ad975f3` and `a346621`, and the fourth sealed at `3b21d91`. Under `docs/forms/the-guarantee.md` *The guarantee*, this run re-ran the claims whose coordinates a commit since `3b21d91` touched, and read every party again. `git diff --stat 3b21d91 HEAD` names `apps/desktop/src/main/appearance.ts`, `apps/desktop/test/appearance.test.ts`, and of the records `frame/design.md`, `frame/plan.md`, `gaps.md`, `guarantee.md`, `trail/gate.md` and `trail/rounds/round-5.md` (`executed`). The same command over `changelog.md`, `pr.md`, `src/main/main.ts`, `src/shared/`, `src/preload/` and `src/renderer/` printed nothing (`executed`), so the callers of `writeAppearance` and every other record stand as the fourth run audited them.

`skills/code-review/scripts/chain_check.py --baseline 277eb35 --sealing` at HEAD exited 0. Its records arm and its broad gate arm printed nothing. Its guarantee arm named the fourth run's block as behind HEAD, with `731b956` after it touching `frame/design.md`, which this run answers (`executed`).

## Claims re-run

The cases below ran as `node scripts/test-in-electron.mjs test/appearance.test.ts` in `apps/desktop` of a `git clone --no-local` of the worktree at `67f270d`, under `<scratch>/sealer-5/at-base`, with the worktree's `node_modules` linked in. Each is a narrow run of one case file, not the broad gate.

| Claim | Source | Command | Result |
|---|---|---|---|
| The theme's case file passes at HEAD, with its two new cases | `48b7e6e`; `trail/rounds/round-5.md` *Probes* row 1 | the narrow command at `67f270d` | holds: 1 file, 13 cases passed, exit 0 (`executed`) |
| The two new cases were red against the code before the change: a failed rename and a failed write each left `appearance.json.<pid>` | `48b7e6e`'s message; `frame/plan.md:167`; `trail/rounds/round-5.md` *Confirmations*, third bullet | `git checkout 3b21d91 -- apps/desktop/src/main/appearance.ts` in the clone, then the narrow command | holds: exit 1, 2 failed and 11 passed. `test/appearance.test.ts:88` received `["appearance.json", "appearance.json.61720"]` and `:98` received `["appearance.json.61720"]`, each at its `readdirSync` line. Both `toThrow` lines before them passed, so the old code threw too (`executed`) |
| Each new case asserts a file is not left, so it pins the removal only where the removal alone taken out turns it red (rule 15) | `test/appearance.test.ts:83-99` | HEAD's `appearance.ts` in the clone with `rmSync(partial, { force: true });` alone replaced by `void rmSync;` through the `Edit` tool, the narrow command, then `git checkout HEAD -- apps/desktop/src/main/appearance.ts` | holds: exit 1, the same two cases failed at `:88` and `:98` with the partial file listed, and no other case failed. No second guard holds either case (`executed`) |
| `writeAppearance` throws what refused the save after it tries to remove the partial file, and a refused removal leaves the file and says nothing | `appearance.ts:27`, `:35-42`; `frame/design.md:221`; `gaps.md:98` | read `appearance.ts:27-43` | holds: the outer `catch` calls `rmSync` inside its own `try`, swallows that error with the comment at `:39`, and rethrows the save's error at `:41` (`read`). That the removal's own failure leaves the file is round 5's probe, not re-run here |
| No sentence in the tree still says a failed save leaves no partial file in every case (rule 19) | `1d91709`; round 5 finding 1 | `git grep -n -i -e 'partial file' -e 'appearance.json.<pid>' -e 'appearance\.json\.'` outside the work item's `trail/` and `guarantee.md` | holds: the hits are `appearance.ts:27`, `:39`, the case names and comments at `test/appearance.test.ts:75`, `:83`, `:85`, `:92`, `:94`, `:95`, `frame/design.md:221`, `:282`, `frame/plan.md:167`, `gaps.md:98`, and two lines on other files (`frame/design.md:58`, `:271`; `gaps.md:59`; another work item's `phase-1.md:29`). Each agrees with the code (`executed`, `read`) |
| The commits since `3b21d91` touch no row of `frame/design.md` *Removes* and no removal `changelog.md` names | `git diff 3b21d91 HEAD -- frame/design.md`, `changelog.md` | the diff above | holds: the frame's diff is two lines of *Scope* item 24 and *Data & interfaces*, and `changelog.md` did not change, so the fourth run's checks of `## Removes` stand (`executed`) |

Not sampled, each `unverified` with its answerer:

- Every claim the four earlier runs re-ran whose coordinates no commit since `3b21d91` touched. They stand as those runs' results and were not re-run.
- That a removal which itself fails leaves the partial file. Round 5 showed it with a mocked `rmSync` (`round-5.md` *Probes* row 4). This run read the code that produces it and did not re-run the probe. The round answers it, and nothing in the verdict rests on more than the code read.
- `frame/plan.md:167` says the fix pass over round 3 found the leftover partial file. The close of round 3's finding 4 (`round-3.md:205`) does not record it, as round 5 also noted. The fact itself holds by the run against the old code above. Who found it is the orchestrator's account, and nothing rests on it.
- The write case's red depends on a user who is not root, since root writes through mode 0400. No workflow runs the suite (`gaps.md:7`). The owner answers it if the suite is ever run as root.
- A failed save shown on the built app's status line. Only a run of the built app re-runs it, and this run launched none. The owner answers it at the built app, as `gaps.md` rows 8 and 38 already name.
- Whether the owner's choice should reach the other writers with the same cause: `last-look.ts:120-125` (phase 3), `work-items.ts:70-76` and `discovery.ts:17-19`. *Judgments of the run* row 25 names the theme's file alone, and round 5 left it under `## Not judged`. The owner answers it, through the orchestrator. It is no reason here, because no party claims those writers remove their partial files.
- The pull request #37 carries a shortened body, because the composed body is over GitHub's limit, so the body the check reads at a ready pull request is not the one `seal pr-body --check` matched here. The owner answers it before #37 is made ready.

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| The design (`frame/design.md`, `frame/plan.md` *Judgments of the run* rows 1 to 25) | `:221`: "A save that fails, at its write or at its rename, removes the partial file it wrote, and where that file cannot be removed either, it stays (`gaps.md` *Not done*)." `:282`: the file is written "to a partial file it then renames, except that a save that fails removes its partial file". `plan.md:167`, row 25: the owner chose on 2026-11-19 to fix it in this work item | `appearance.ts:35-42`; `gaps.md:98`; `work-items.ts:70-76`, which writes and renames with no removal, as `:282` says by "except that" | none (`read`) |
| The build (the diff `277eb35...HEAD`, `trail/phases/phase-1.md` to `phase-9.md`, `48b7e6e`) | `48b7e6e`: "It now removes the partial file and throws what refused the save, so the page's notice is unchanged." `routing.md` reads `Implementation` `crafter`, and each of the nine phases whose Status cell holds a commit has its `trail/phases/phase-N.md`. The change is no phase of `frame/plan.md`: it is row 25, and round 5 read it | the design; the runs above; `theme.ts:39` and `renderer.ts:309-314`, unchanged since `3b21d91`, show one fixed notice whatever the error | none (`read`) |
| The orchestrator's routing (`routing.md` *Why this way*) | Review through the review chain, raised by row 21 | `round-5.md`, a round over `607f8b0..55250b7`; the diff, which changes one function of the main process and its cases | none (`read`) |
| The last round (`trail/rounds/round-5.md`, target `55250b7, fixes 607f8b0..55250b7`) | One `should`, located in `frame/design.md:221` alone, `fixed 1d91709` with its replacement block | `1d91709`, which changed that one line, and only within the work item's records. `frame/design.md:221` at HEAD is the block word for word (`git show 1d91709`, `executed`) | none (`read`) |
| The closing memo (`gaps.md`) | `:98`: "The failed save removes the partial file it wrote, and where that file cannot be removed either, it stays and nothing says so." | `appearance.ts:36-40`; `frame/design.md:221` | none (`read`) |
| The changelog (`changelog.md`) | Unchanged since `3b21d91`. It says nothing of the partial file, which no release ever left, since phase 9 of this work item made it | the diff | none (`read`) |
| The orchestrator's part of the pull request body (`pr.md`) | Unchanged since `3b21d91`. It quotes rows 1, 8, 9, 10, 11 and 12 of *Judgments of the run* | those rows at `frame/plan.md:143`, `:150-154`, which row 25's append at `:167` did not move; `seal pr-body --check` exit 0. No `pr.<lang>.md` stands, and `seal/config.json` names English for both language keys | none (`read`) |

**The issue against the owner's recorded decisions.** Issue #18's done-when lines (`gh issue view 18`, `executed`) and the window built differ where the fourth run's paragraph listed them: the sidebar beside the inbox, a line's second row, the state's place in a view, no top bar, and the polish mockups in place of direction B's artboards. No code a done-when line reads has changed since `3b21d91`, and the owner's decisions in *Judgments of the run* rows 8 to 12 still cover each difference. `seal/parity.json` is not in git (`git ls-files seal/parity.json` printed nothing, `executed`), so no comparison with an original is owed.

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

```seal
target: 67f270d against 277eb35
Verdict: sealed
```
