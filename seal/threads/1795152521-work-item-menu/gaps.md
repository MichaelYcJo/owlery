# Closing memo: repositories as a unit, and the menus of a work item and of a repository (#93)

## Not verified

| Item | Who must answer |
|---|---|
| The suite, the typecheck of the whole app and the repository's broad gate. Phase 1 ran seven case files of `apps/desktop` in one command, one case of `apps/desktop/test/korean-input.test.ts`, and `tsc` over the sixteen files it changed, at `8107fa2` (`trail/phases/phase-1.md`). `seal deferrals . --kind all` finds no runner in CI (exit 1) | the orchestrator, at the broad run |
| A build of `apps/desktop/dist` in the owner's clone while the owner's app runs from it. On 2026-11-20 the owner's app (pid 72305) and its daemon (pid 95337) ran from that `dist`, and every built-app case, the broad gate's among them, writes it from the working tree first (`apps/desktop/test/built-app.ts#buildApp`). After such a build the owner's window is this build's at its next reload, against the daemon of the earlier build, and the next daemon the owner's app starts is this build's, which writes `repositories.json` into the owner's run folder at its first change. Phase 1 built only in a clone under its scratch (`trail/phases/phase-1.md`) | the orchestrator, before the broad run or any built-app run in that clone, with the owner |
| The test files that read a path phase 1 changed through the built app and that phase 1 did not run: `apps/desktop/test/work-item-form.test.ts`, `apps/desktop/test/memory.test.ts`, and the cases of `apps/desktop/test/korean-input.test.ts` other than "opens one pane through the form, of the shell kind". Each starts the app | the orchestrator, at the broad run |
| This build's daemon on a run folder a person has used: its first start reads the person's own `work-items.json` and writes `repositories.json` at the first change. Every case ran on a run folder the case made | the owner, at the first start of this build's daemon |
| This build's window against a daemon an earlier build started. `read` in `apps/desktop/src/renderer/sidebar.ts#showStatus` and `apps/desktop/src/renderer/renderer.ts#takeRepositories`: the status line says the earlier build's sentence, the sidebar lists no repository, and the inbox lists the work items. The case of `daemonLists` in `apps/desktop/test/view.test.ts` holds the function, and no case starts an earlier daemon | the owner, at the first start of this build while a daemon of the earlier build is alive |
| The sidebar's "Add a repository" button with the system's folder dialog, which the debugging port does not reach. `read` in `apps/desktop/src/renderer/sidebar.ts#initSidebar`: the folder chosen is sent as `addRepository`. Phase 1's probe added a repository through a second client of the daemon, and the window drew its row | the owner, at the first press of the button in the built app |
| How a repository's row looks when drawn, with its "+" button and its "…" button beside the fold. Phase 1's probe read the page's elements and never the window as a person sees it | the owner, or whoever the orchestrator names |

## Not done

A repository's "…" button is drawn and has no listener, as `frame/plan.md` *Phases* row 1 states. Disabling it until phase 2 was within reach and was not taken: phase 2 gives it its menu.

The store gives a new work item one more than the highest id it holds. Keeping a count that never goes back was within reach, in `apps/desktop/src/daemon/repositories.ts`. It was not taken: no entry can be removed before phase 5, and `frame/design.md` *Scope* item 1 names the fields a stored repository holds, a count not among them. `trail/phases/phase-1.md` hands the point to phase 5.

`apps/desktop/test/daemon.test.ts#runFolderWithWorkItem` still writes `work-items.json`. Writing `repositories.json` there was within reach and was not taken: the helper's cases now also hold the daemon's start from the old file.
