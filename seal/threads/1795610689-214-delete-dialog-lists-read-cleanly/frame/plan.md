# Implementation Plan: 1795610689-214-delete-dialog-lists-read-cleanly

## Technical context

The tree as read at `ab7a5730`.

The work is in the renderer, its styles, the cases that pin them, the screenshot run and `docs/design.md`. Nothing in the daemon or the protocol changes. `frame/design.md` *Grounding* names each coordinate, and the build stands on these:

- `apps/desktop/src/renderer/view.ts:1076-1100`: `LossSection` and `lossSections`, the one builder of a loss's sections.
- `apps/desktop/src/renderer/renderer.ts:446-477`: `namedLines` and `lossParts`, which draws the sections. It has two callers, the delete dialog (`:1216`) and the removal dialog (`:1138`).
- `apps/desktop/src/renderer/index.html:558-569`: the dialog list styles. `:1032-1049` is the delete dialog's markup.
- `apps/desktop/src/renderer/index.html:196-204`: the view's `.commit` and `.path` rows, whose parts the dialog's rows reuse.
- `apps/desktop/test/view.test.ts:724-765`, `apps/desktop/test/work-item-menu.test.ts:810-966`, and `apps/desktop/test/screenshots.ts` with `apps/desktop/test/screenshots.test.ts`.

Constraints:

- **`docs/product.md`, the bullet "Owlery deletes nothing of a person's work without that person's word", has the person read each lost entry by name.** So a list scrolls and does not stop at a number of entries.
- **The broad gate compares the headings and the table rows of `docs/*.md` with `docs/*.ko.md`.** The new row of *Components and their states* goes into both editions in one commit.
- **Built-app cases run once per phase, in one batch at the phase's end, never one launch per fix.**

The chosen approach, and what breaks in six months:

- **The approach.** The rows are of one height and the box is ten rows tall, so the scroll snaps on whole rows. Every row is one line, cut with an ellipsis, and its tooltip holds the whole text.
- **What breaks.** A path whose distinguishing part is at its end, a file name deep in a long folder, is cut at that end, and the person reads it only by pointing at it. The view's changed files cut a path the same way (`index.html:209`), so the window already holds that cost. Q3 keeps the choice open for the owner.
- **A second cost.** A dialog whose five lists are all full is about 1,450px tall and scrolls as a whole in a 900px window, so the dialog's own edge can cut a row. The issue speaks of a list's scroll. The whole dialog's scroll is the scroll every modal dialog of the window has. Q2 holds it.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Show the first N entries of each list and count the rest ("and 29 more"), with no scroll | The person forces a delete having read 10 of 39 commits by name. `docs/product.md` (the bullet "Owlery deletes nothing of a person's work without that person's word") has them read each by name before a forced delete. | Rejected: it breaks a product rule. The daemon's cut at 500 stays the one cut. |
| Keep paths whole and wrapped, as #104 chose (`7d3969d5`), with an even gap set by padding instead of `min-height` | A wrapped path makes rows of uneven height. A scroll box of ten rows then cannot rest on whole rows, and the issue's "does not cut a row in half" fails for any list holding a long path. | Rejected for the scrolling lists. Q3 records it for the owner, with the cost of cutting. |
| Cut a path at its start, keeping the file name, with `direction: rtl` | A path is a run of neutral characters (`/`, `.`, `-`) under the bidirectional text algorithm. In an RTL box a leading `.` or `/` moves to the other end, so `.env` can read `env.`. Every path then needs an isolate and a case per character class. | Rejected: a fragile trick for a cost the view already accepts. |
| Keep the `.named` structure and change `dialog .named li` for every dialog | `.named` also draws the session lists of four dialogs, the Accounts list and the record dialog's holds. Their rows would change height and spacing, and the pull request would owe screenshots of every one of those dialogs. The premise that keeps `.named` as it is was checked: its other lists are already one line per row (`index.html:567`) or wrap on purpose (`#accounts-list`, `records-holds`). | Rejected. The loss lists take a class of their own, and `.named` stays for the rest. |
| Replace `.named` with one dialog list form for every dialog | Same cost as above, plus the Accounts rows, which hold several lines each, would need their own exception inside the new form. | Rejected for this work. Every dialog's list in one form is a design pass of its own. |
| Keep the joined `${hash} ${subject}` string and split it in the renderer | The renderer would parse its own builder's output at the first space, and a subject's text would decide the parse. | Rejected: `LossSection` carries the parts. |
| A scene work item made for the delete dialog alone | It adds an eighth work item, changes "seven invented work items" in `docs/design.md`, adds a line to the inbox and the sidebar shots, and shifts the ids the run counts on. | Rejected. The commits go to "Rename the settings file", whose line already stands in every shot. |
| Rule changes for the dialog's row instead of writing it in place | Principle 8 of `docs/design.md` refuses it: a row the settle writes arrives after the form shipped. | Rejected. Only the scene paragraph goes through *Rule changes*, where #224 rewrites the paragraphs beside it. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1, 2, 3, 4, 5, 6, 7 and 8 | `pnpm --filter @owlery/desktop run test -- test/view.test.ts` (unit, while building). At the phase's end, one batch: `pnpm --filter @owlery/desktop run test -- test/work-item-menu.test.ts`, with its delete and removal cases rewritten and the long-list case added. Each new or rewritten case is shown red against `ab7a5730`'s renderer before it is committed. The broad gate is the orchestrator's. | |
| 2 | *Scope* items 9 and 10, and the two `add` operations of *Rule changes* stated in `frame/design.md` | `pnpm --filter @owlery/desktop run test -- test/screenshots.test.ts` without `OWLERY_SCREENSHOTS` (the names case). At the phase's end, one run: `OWLERY_SCREENSHOT_THEMES=all pnpm --filter @owlery/desktop run screenshots`. Its six `*-delete.png` files are committed under `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/screenshots/`. | |

## Overlap with the release

The spawn named #237, #235, #242, #224 and #217. Their worktrees held no built commit at `2026-11-25`, beyond #237's (`frame/design.md` *Grounding*), so each row reads the issue and the files it names.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #224 | `docs/design.md` and `docs/design.ko.md` *A pull request that changes the window carries its screenshots*. #224 rewrites the scene paragraph and the parked work item's "Ask" paragraph. #214 edits the view list sentence in place and adds a paragraph through *Rule changes*. Also `apps/desktop/test/screenshots.test.ts`: #224 takes out the prompts asked in the view and the view's waits on "Ask". #214 adds a view to `VIEWS`, `show` and `leave`, and the commits in `beforeAll`. Also `apps/desktop/src/renderer/index.html`: #224 is likely to remove the Ask section's styles (`:517-539`) and its markup, and #214 changes the dialog list styles (`:558-569`) and the delete dialog's markup (`:1032-1049`). | #214 | #214 touches no protocol or daemon file and is the smaller diff, so it is likelier to seal first. #224 rebases onto it and meets one added `VIEWS` entry, one added paragraph and one changed sentence, all in rounds it runs anyway. Sending the scene paragraph through *Rule changes* keeps #214 out of the paragraphs #224 rewrites. |
| #217 | The delete dialog reads `WorkItem.branch`. #217 makes the branch optional, and its issue says the delete dialog then names no branch. That reads the branch-and-folder head of *Scope* item 4 ("The folder removed from disk" where no branch stands). Both may touch `apps/desktop/test/work-item-menu.test.ts`, whose delete case creates a work item through the form #217 changes. | #214 | The spawn orders #217 to build after #214. #217's frame then reads the head forms in `lossSections` as merged, not as planned. |
| #242 | No file both change. #214's screenshot step opens a sidebar line's menu, and #242 changes how `sidebar.ts` redraws those lines. The step reads a line by its `data-work-item` selector, which #242's issue keeps. | Either | Neither change edits what the other reads. #242 makes the step's right-press steadier, if anything. |
| #237 | No file both change. #237 changes `hooks.ts`, `main.ts`, `pane-chain.ts`, `apps/desktop/package.json` and `.github/workflows/owlery-seal.yml`. | #237 | The spawn orders it first. It moves the version to 0.0.5, which #214 does not touch. |
| #235 | No file both change. #235 changes `apps/desktop/src/daemon/chain.ts` and `chain-command.ts`. | Either | No overlap. |

## Operational impact

None. No migration, no environment variable, no dependency and no compatibility break. The version does not move in this pull request. #237 moves it to 0.0.5.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
