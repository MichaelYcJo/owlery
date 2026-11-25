# Implementation Plan: a filter that hides everything says so (#215)

## Technical context

The tree as read at `06b9b5d6`. `origin/release/v0.0.5` stands at `943b1bfd`, one merge ahead (#256). The crafter merges `origin/release/v0.0.5` into the branch before Phase 1's first edit, so the rows and the views list this work adds sit beside the ones #256 added.

The work builds on four places, each read:

- `apps/desktop/src/renderer/view.ts#sidebarTree` (lines 961 to 975) and `#emptyList` (line 1252). The two new functions stand beside them, so the unit project reads them without a page.
- `apps/desktop/src/renderer/sidebar.ts#showSidebar` (lines 131 to 212), which draws the filter control's title and class (lines 148 to 150) and replaces the children of `#repositories` (line 152).
- `apps/desktop/src/renderer/renderer.ts#showNarrowed` and `#filter` (lines 344 to 353), and the sidebar's actions (lines 2040 to 2066). The press of "Show every work item" is the person's own act, so it draws at once and not through `draws.draw` (`renderer.ts` lines 1530 to 1542).
- `apps/desktop/src/renderer/index.html` line 108 and `apps/desktop/src/renderer/themes.css`'s six blocks, where `--dot-edge` stands at lines 128, 245 and 360 among them, the form a new edge token follows.

Constraints the tree sets:

- `themes.test.ts` refuses a shadow the page writes of its own (line 389) and reads every token's value in both editions (line 447). The edge is therefore a token in all six blocks and in all three theme tables of both editions.
- The broad gate counts the headings and the table rows of each `docs/*.md` against its `.ko.md`. Each edition gains the same three token rows and the same one component row.
- Built-app cases run once per phase, in one batch at the phase's end, and the machine runs one broad gate at a time. Each command in *Verified by* below names three test files at most. A command named in `seal/config.json` under `Heavy commands` runs through the runner `OWLERY_RUN` names, where the crafter's pane names one.

**The failure scenario of the chosen approach, six months on.** #227 lists worktrees made outside Owlery in the sidebar, and #228 draws work items as a tree. Either one adds entries that `sidebarTree` does not count today. If the function of *Scope* item 2 keeps reading "the sidebar lists no repository" from `sidebarTree`'s length alone, a sidebar that shows only an outside worktree's entry stays quiet, which is right, but a sidebar whose outside worktrees the filter also leaves out says "lists none of its 2 repositories" while a worktree a person made by hand is hidden too. The function takes the number of repositories the sidebar lists as an argument for that reason, so the item that adds entries passes its own count and the sentence's words stay one source. The edge has a smaller risk: a second icon's button that turns something on, such as a future sort or a mute of the sidebar, takes the edge by taking the class `on`, which is the rewritten row's intent.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| A dot in the strong ink on the filter's icon, as the earlier triage proposed | In Register and Desk, the signal of *Principles* item 3 is "a filled mark in the strong ink", and the bell's dot beside the filter is exactly that (`index.html` line 253). Two strong-ink dots side by side would read as two things that need the person. *Principles* item 7 would also need a fourth kind of circle. | Rejected. |
| A dot in a colour of no state, such as `--ink-muted` | It avoids the signal's ink, but it is still a filled circle beside the bell's dot and needs *Principles* item 7 changed. A muted dot of 6px is the weakest of these marks at a glance. | Rejected. |
| The edge, `--on-edge`, round the icon, with the strong ink kept | It is a shape and a colour, and the title gives the words. It is the form a Register button already takes, an edge with no fill, so in Register an "on" filter reads as a button. That is a fair reading: the control is engaged. Its risk is that a theme later wants a different edge; the token is where that theme changes it. | Chosen. |
| A ground under the icon, `--selected` or `--pressed`, as "Side by side" stands pressed (`index.html` lines 379 and 380) | `--pressed` is `rgba(243, 239, 230, 0.08)` in Night watch's dark block. A ground that faint is not seen at a glance, and the hover's ground, `0.05`, is nearly the same, so a pointer resting on an "off" filter looks "on". | Rejected. |
| The chosen state's words beside the icon, or in the caption "Repositories" | The head row holds the caption, the bell, the filter and "+", in a sidebar 256px wide, and #216 adds a refresh button to it. "Decided without asking", or a long search, does not fit, so the words would be cut where they matter. The empty sentence and the title carry the words instead. | Rejected. |
| Keep `sidebarTree`'s rule and say nothing: the inbox's list already says "No work item matches." | That is the structure as it stands, and it is the defect: the sidebar is the one place a narrowing empties without words (`design.md` *Grounding*, the callers of the narrowing). | Rejected. |
| Replace `sidebarTree`'s rule: under a filter, list every repository with the count 0 | No repository leaves the list, so nobody takes a filtered repository for a removed one. But a filter over many repositories lists rows of 0 that the person must read past to find the one that matters, which is what the filter is for, and the rule has its own case (`view.test.ts` lines 3322 to 3339). The premise that keeps the structure, that a narrowed list shows only what is left, was checked against the issue: its *Done when* asks for a sentence and a mark, not for the rows back. | Rejected. |
| The press of "Show every work item" chooses "All" and leaves the search | Where the search alone, or the search and the state together, left nothing, the press leaves the sidebar empty or still narrowed, and the person presses again. The issue asks for one press that shows them all. | Rejected: the press empties the search too. |
| The built-app case drives a pane's state through the daemon's hook socket, as `notification-click.test.ts#feed` does, and narrows by the state alone | It reproduces the owner's words exactly, with no search. It needs a Claude Code pane, a second client of the daemon to find the pane's id and the hook's feed in a file that has none of them. The sentence's words for a state alone are read by the unit cases, and the path the case proves, a delete's `inbox` drawing the sentence, is the same either way. | Rejected: the case narrows by a state and a search. |
| The screenshot view narrows by a search that matches nothing | The shot would show "No work item matches" and no state's name, so the reader of the screenshots does not see the state named. | Rejected: the view chooses "Decided without asking", which the scene leaves empty. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | `design.md` *Scope* items 1 to 8. | `pnpm --filter @owlery/desktop run test test/view.test.ts test/themes.test.ts`, with each new case shown red first (contract rule 15). Then, once, as the phase's built-app batch: `pnpm --filter @owlery/desktop run test test/work-item-menu.test.ts`. `git grep -n -F -e 'toggle("on", held.filter' -e 'Showing: ${' -- apps/desktop/src/renderer/sidebar.ts` prints nothing. | |
| 2 | `design.md` *Scope* item 9, and the screenshots the pull request carries. | `pnpm --filter @owlery/desktop run test test/screenshots.test.ts`, whose unit cases name one file for each view. Then, once, as the phase's built-app batch: `OWLERY_SCREENSHOT_THEMES=all pnpm --filter @owlery/desktop run screenshots`. Its `narrowed` shots show the edge on the filter and the sentence naming "Decided without asking", in every theme and both appearances, and are committed under this work item's `screenshots/`. | |

## Overlap with the release

The items read: #216, #217, #224 and #236, which run beside this one, and #227 and #228, later in the release. #217's and #224's diffs were read against `origin/release/v0.0.5` on their branches (executed: `git diff --stat origin/release/v0.0.5...HEAD` in each worktree). #216's frame is a skeleton in its worktree, so its issue was read. #236 changes `apps/desktop/role-bundle/` and `role-bundle.test.ts` alone, so it meets nothing of this work.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #217 (a work item may have no branch) | `view.ts#matchWorkItems` reads `workItem.branch`, which #217 makes nullable, and this work's functions sit beside it without reading the branch. `work-item-menu.test.ts`: #217 changes the `create` helper (its hunks at lines 186 to 214) and adds a case at the file's end, where this work adds its case. `screenshots.test.ts` and `view.test.ts` in other places. | #217 | #217 is at its third review round. Its `create` helper is the one this work's case calls, so this work builds on the helper as #217 leaves it, and the two cases at the file's end merge as two additions. |
| #224 (the Ask section goes) | `screenshots.test.ts` and `screenshots.ts`, where #224 rewrites the scene and this work adds a view; `index.html` and `view.ts` in other places; `docs/design.md` *Components and their states* and the screenshots section. | #224 | #224 is at its third review round and its diff of the scene is large. This work's view is a `show` and a `leave` of a few lines, cheaper to place into #224's scene than the reverse. |
| #216 (a refresh of the daemon's lists) | `#repositories-head` in `index.html`, where #216 adds a button beside the bell and this work draws the filter's edge; `sidebar.ts#initSidebar` and `#showSidebar`; `SidebarActions` and the sidebar's actions in `renderer.ts`; `docs/design.md` *Components and their states*, where #216 names its button in a row of the sidebar's head; the screenshot run, where #216 shoots the head row. | #215 | This work's frame is written and #216's is not, and this diff is the smaller. #216 then states its button beside the filter whose "on" form this work writes, and can take this work's new row, or the rewritten cell of "An icon's button", as the row of the head it adds. A refresh while the sidebar is empty draws through `showSidebar`, so the sentence stays right after a refresh with no change of #216's. |
| #227 (worktrees made outside Owlery in the sidebar) | `view.ts#sidebarTree` and `sidebar.ts#showSidebar`, which #227 extends with entries that are not work items. | #215 | #227 is later in the release. Its entries change what "the sidebar lists no repository" means, so it passes its own count to the function of *Scope* item 2 and says in its frame whether the sentence counts its worktrees (`design.md` *What the daemon could do beyond the issue*). |
| #228 (work items as a tree) | `view.ts#sidebarTree`'s shape and `sidebar.ts#showSidebar`'s drawing of each repository. | #215 | #228 is later in the release and restructures the tree. The sentence and the mark read only the number of repositories listed and the narrowing, so they survive the new shape where #228 keeps passing that number. |

## Operational impact

None. No migration, no environment variable, no dependency and no change of a message between the window and the daemon. A window of this build against an older daemon draws the same sentence, since the sentence reads only the lists the window already holds. This pull request does not move the version.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
