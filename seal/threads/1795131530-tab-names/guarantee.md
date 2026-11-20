# Guarantee: 1795131530-tab-names

The sealer audited `c26368c` against the base `release/v0.0.1`, which resolves to `f7769fe` here (`@{upstream}`, `origin/` and the local branch all name it). The work item routes straight to the PR, with no frame, no phase record and no round record (`routing.md`), so the claims below are the session's, the orchestrator's and the records', and the sample covers the one code change, `797fb23`, whole. Every re-run was made in a clone at `<scratchpad>/1795131530-tab-names/at-base/`, never in the tree under audit, and started no Owlery app: `scripts/test-in-electron.mjs` runs vitest in Electron's Node.

## Claims re-run

| Claim | Source | Command | Result |
|---|---|---|---|
| The broad run is at HEAD: `trail/gate.md` names `f65546f`, and only the work item's records follow it | `trail/gate.md:4`; the rule of `chain_check.py#follows` | `git merge-base --is-ancestor f65546f HEAD`; `git log --no-merges --name-only f65546f..HEAD ^f7769fe` | holds (executed): ancestor; the one commit after it, `c26368c`, touches `seal/threads/1795131530-tab-names/gaps.md` and `trail/gate.md` alone |
| The pull request body is `pr.md` above `## From the records` and the records' text below it | the body file the prompt names, `86-pr-body.md` | `seal pr-body seal/threads/1795131530-tab-names --body <file> --check` | holds (executed): exit 0, `matches` |
| The session's `test/view.test.ts` passes after the code (171 passed) | `gaps.md:7` | `node scripts/test-in-electron.mjs test/view.test.ts` from `apps/desktop` of the clone at `c26368c` (its `apps/` equal to `797fb23`'s: `git diff --stat 797fb23 HEAD` lists only the work item's records) | holds (executed): 1 file, 171 passed |
| The new and changed cases were red before the code (the session said 5 failed of 171, on uncommitted files no record names) | the spawn prompt; no record in the tree | the clone at `f7769fe`, `test/view.test.ts` taken from `c26368c`, the same command | holds in substance, not in count (executed): 6 failed, 165 passed. The 6 are the five `tabLabel` cases and `notificationFor`'s "is titled with the tab's label for a pane without a work item". At the base code they fail on the new argument order (`'undefined 3'`), so that run alone does not show the guards; the three runs below do |
| No tab shows the daemon's id (issue #86, *Done when* 3); the cases assert it is not named | `view.ts:13-18`; `view.test.ts:92-115`, `:728` | the clone at `c26368c`, `view.ts`'s return line alone replaced by the old `` `${name} ${session.id}` ``, the same command | holds (executed): 6 failed, each on the id: `'Claude Code 3'`, `['Claude Code 3','Shell 5',…]`, `['Claude Code 3','Claude Code 9']`, `'Agent 6'`, `'shell 7'`, notification title `'Claude Code 3'` |
| The kind alone where the work item has one open pane of that kind (*Done when* 1) | `view.ts:17` (`same.length > 1`) | the same clone, `same.length > 1` alone replaced by `same.length > 0` | holds (executed): 5 failed, each reading a lone pane numbered: `'Claude Code 1'`, `'Shell 1'` in the mixed list, `'Agent 1'`, `'shell 1'`, notification `'Claude Code 1'` |
| Each kind is numbered on its own, 1, 2, 3 in the tabs' order (*Done when* 2) | `view.ts:16` (`tab.kind === session.kind`) | the same clone, the kind filter alone removed (`const same = tabs;`) | holds (executed): 2 failed, `'Claude Code 1'` for the lone Claude Code pane beside a shell, and `'Shell 2'` in the mixed list |
| Numbered again after a close: the number is the place among the open panes of the kind, not the id | `view.ts:17`; `view.test.ts:103-106` | the id run above | holds (executed): `[3, 9]` reads `['Claude Code 1','Claude Code 2']` at HEAD and `['Claude Code 3','Claude Code 9']` with the id put back |
| The tabs are labelled among the list they are drawn from, in the tabs' order | `work-item-view.ts:271-276`, `:326-328`; `view.ts#paneTabs:533-535` | read | holds (read): `showView` passes `listed`, the work item's sessions sorted by id, to every `tabElement`, which hands it to `tabLabel`; the close button's title copies the label. `git grep -n tabLabel` lists two callers, `tabElement` and `notificationFor` |
| A notification for a pane outside any work item is titled with its kind alone | `changelog.md:8`; `view.ts:731` | the id run above | holds (executed): the case fails on `'Claude Code 3'` with the id put back and passes at HEAD |
| The Korean input case's expectation, `["Shell"]` for the one pane the form opens, and the desktop suite and the typecheck passed in the broad run, the app started under `OWLERY_BACKGROUND=1` | `gaps.md:7`; `trail/gate.md:4` | none: the case starts the app, and the suite and typecheck are the broad gate's (contract rule 2) | unverified by the sealer; answered by the orchestrator's broad run at `f65546f`, which `trail/gate.md` records. Read: the one-pane, shell-kind expectation agrees with *Done when* 1 |
| `## Removes` rows and removals the changelog names | none: no `frame/design.md`; `changelog.md` names no removal | read | nothing to confirm. The removed fact, the id in `tabLabel`'s label, stands nowhere in `view.ts` (read) |

## The parties

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| the design | none: `routing.md` *Why this way* names the owner's answer in the issue body as the design, and the orchestrator chose the rows under `agentic`. Its grounds: one pure function, `view.ts#tabLabel`, and its two callers, small enough for the session | the diff: `tabLabel` with its cases, `notificationFor` and `tabElement` as its two callers, the latter's one call in `showView`, and one expectation of `korean-input.test.ts`; the issue body's rule, word for word | none |
| the build | `797fb23`: `tabLabel` takes the work item's open panes in the tabs' order and labels by kind and place within the kind | the issue's three *Done when* lines, each shown by a case failing with its guard alone removed (above); the changelog | none |
| the last round | none: straight to the PR, no `trail/rounds/` | — | — |
| the changelog | the kind alone for one open pane, 1, 2, 3 in the tabs' order for more, each kind on its own, renumbered after a close, a notification outside a work item titled with its kind alone | the build, the issue body, the cases | none |
| the orchestrator's part of the pull request body (`pr.md`) | "Part of #86"; the tab named the kind and the daemon's id; it now names the kind alone or the kind with 1, 2, 3 in the tabs' order; the owner chose the rule on 2026-11-20, as `routing.md` records | the issue body, `routing.md:15`, the build | none. Its second paragraph is the orchestrator's own summary rather than quotes of the records with coordinates, which `docs/forms/the-guarantee.md` asks of `pr.md`; every sentence of it holds against the issue and the tree |
| the closing memo (`gaps.md`) | the broad run closed the suite row; the tabs as the window draws them are the owner's to see; a pane a person names is outside #86 | `trail/gate.md`; the issue body, which asks nothing of a named pane | none |

```seal
target: c26368c against f7769fe
Verdict: sealed
```
