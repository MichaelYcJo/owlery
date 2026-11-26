# Review round 4: 1795636143-213-a-panes-tab-has-a-menu

```seal
target: 584b72fa against origin/release/v0.0.5
```

The base moved to `8a19d3e2` when #215 merged into the release (PR #290). `584b72fa` merges that base into the branch after the seal at `f29a9b3b`. This round reviews the merge alone: what each side brought, the conflicts' resolutions, and whether the twelve committed shots still show what ships. Round 3 left no finding open, so this round answers no close. Following the coordinator's instruction and contract rule 2, it ran no test. The method was to read `git show --cc 584b72fa`, and to word-diff the merge against each parent, `f29a9b3b` and `8a19d3e2`, for every file the merge resolved.

## Findings

None.

## Confirmations

What matched: `apps/desktop/test/screenshots.ts`, `VIEWS`. The merged list is the branch's list with `"narrowed"` appended after `"delete"`. Against #215's side, it adds `"tabs", "rename"` after `"menu"`. The doc comment names the views of both sides in that order. The list holds 20 views, so a run over three themes in two appearances writes 120 files (read).

What matched: `apps/desktop/test/screenshots.test.ts`. Against the branch, the merge adds only #215's lines: the comment's view and its narrowed paragraph, the two Night watch `narrowed` files, the constants `NARROWED_QUERY` and `NARROWED_SAYS`, the helpers `searchSidebar` and `filterSidebar`, and the `narrowed` show and leave hooks. Against #215, it adds only the branch's lines: `TAB_COLOURS`, `MARKED_NAME`, `AT_REVIEW_ID`, `TAB_COLOURS_DRAWN`, the `tabs` and `rename` hooks, the scene's three marked panes, and the four Night watch `tabs` and `rename` files. Neither side lost a line. The count is 120 in `toHaveLength` and in the `Set` size, and `all[119]` is Desk light's `narrowed`. That holds where `narrowed` is the last view of the last theme and appearance, the same order in which the branch's case named `delete` last (read). The scene's extra panes stand in "Sort the history by date". `NARROWED_QUERY` "history" is meant to match that title, which holds no decision made without asking. So the filter "Decided without asking" still leaves no repository, and the narrowed view's sentence is unchanged by this branch.

What matched: `docs/design.md` and `docs/design.ko.md`. Against the branch, the merge adds only #215's text: `--on-edge` in the names' bullet and in each theme's table, the sidebar filter's sentence, the row "The sidebar where a filter or a search leaves no repository", and the view "the sidebar where a filter and a search leave no repository" at the end of the list. Against #215, it adds only the branch's text: the three tokens' bullet and rows, the rows of the tab, the tab's menu, the close dialog and the rename dialog, the two views in the list, and the four panes of the work item at review. That holds in both editions (read). Both editions hold 15 headings and 402 table rows (executed, `grep -c`). No conflict marker is left in the four files (executed, `grep -c`).

What matched: the twelve committed shots still show what ships. The merge changes nothing of this work item's records or screenshots (executed, `git diff --stat f29a9b3b 584b72fa` on the work item's directory). What #215 adds to the page is drawn only under a filter or a search. `.icon-button.on` gains `--on-edge`, and only the sidebar filter control is ever marked `on` (`sidebar.ts:156`). `filterMark` turns it on only where a query is typed or a state other than All is chosen (`view.ts:1331-1333`). `#sidebar-empty` and `#show-every` stand only where nothing is listed. The `tabs` and `rename` views run before `narrowed`, with no filter and no search, and `narrowed`'s leave hook empties the search and chooses All again. So no part of the twelve shots draws differently at `584b72fa` (read).

What matched: the merge commit's message states the order of `VIEWS`, the 120 files and the last file, and each matches the tree (read).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the screenshot case without the app, the lint and the typecheck at `584b72fa`, after the merge. This round ran no test: `unverified` | `apps/desktop/test/screenshots.test.ts`, the whole tree | the orchestrator's broad gate |
| The seal at `f29a9b3b` no longer stands at HEAD, since a merge of new code follows it | `seal/threads/1795636143-213-a-panes-tab-has-a-menu/guarantee.md` | the orchestrator, through the gate and the sealer again |

## Probes

| Command | Result |
|---|---|
| The broad gate's count of lines that open with a heading mark and with a table bar, on `docs/design.md` and `docs/design.ko.md` | 15 and 402 in each |
| `grep -c` for conflict markers in the four resolved files | 0 in each |
| `git diff --stat f29a9b3b 584b72fa -- seal/threads/1795636143-213-a-panes-tab-has-a-menu` | nothing |
