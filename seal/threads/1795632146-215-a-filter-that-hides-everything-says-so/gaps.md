# Closing memo: 1795632146-215-a-filter-that-hides-everything-says-so

## Not verified

| Item | Who must answer |
|---|---|
| Every test file Phase 1 did not run whose cases load the renderer it changed: each built-app file starts the app from `index.html`, `sidebar.ts`, `renderer.ts`, `view.ts` and `themes.css`. Also the repository-wide suite, the typecheck of every package, and the count of headings and table rows across `docs/*.md` against their `.ko.md` editions | the orchestrator, at the broad gate |
| closed `work-item-menu.test.ts` as a whole at `57bcf3ab` and later. It ran whole at `22c8cb83`, and only its new case's inbox count changed after that run (`trail/phases/phase-1.md`) | the fix pass of round 1 ran the file whole at `47b92bd1`, after its last case gained the hidden repository: 31 passed (`node scripts/test-in-electron.mjs test/work-item-menu.test.ts` in `apps/desktop`) |
| closed how the edge on the filter and the empty sidebar's sentence look in each theme and appearance | the screenshot run of Phase 2 at `6b7161d3`, with `OWLERY_SCREENSHOT_THEMES=all`, passed and wrote 84 shots. Its `narrowed` view waited until the sentence, the button, the class `on`, the title and a computed edge stood. The crafter read the six `narrowed` shots, committed in `7f3f35aa` under `screenshots/` (`trail/phases/phase-2.md`). The merge of `origin/release/v0.0.5` at `783e2331` gave the scene's parked work item a reversed decision, so the view now also types "history" into the search field. The run at the merge commit `c73d1b93`, with `OWLERY_SCREENSHOT_THEMES=all`, passed and wrote 108 shots. The crafter read the six `narrowed` shots, which say `No work item under "Decided without asking" matches "history", so the sidebar does not list its repository.`, and they replace the earlier six under `screenshots/` |
| The wait of the screenshot run's `narrowed` view was never seen to fail. The run is a built-app batch that ran in Phase 2 and again after the merge of `783e2331`, so no `seal mutate` run broke the sentence, the class or the edge under it. The unit cases of `view.test.ts` and the built-app case of `work-item-menu.test.ts` pin the same sentence's form, the class and the edge (`trail/phases/phase-1.md`) | the orchestrator, who decides whether a second screenshot run is worth the machine's time |

## Not done

The screenshot runs of Phase 2 and of the merge of `783e2331` each wrote a shot of every view, and only the six `narrowed` shots are committed. In each other view the filter stands at "All" with nothing typed and the sidebar lists its repository, so this work draws none of them differently. `docs/design.md` *A pull request that changes the window carries its screenshots* asks for a shot of each view the pull request changed. The other shots stand in the crafter's scratch directory and are not committed.

**Only the `narrowed` view's shots are committed.** This work changes what the sidebar says where a filter and a search leave no repository, and the screenshot run's `narrowed` view is the one view that shows it; its six shots, one for each theme and appearance, are committed under `screenshots/`, taken again at the merge of `783e2331` (`f6520c10`). Grounds: `docs/design.md` *A pull request that changes the window carries its screenshots*.

![The sidebar where a filter and a search leave no repository, in Night watch, dark](../blob/f6520c10ab8813ee57e8520a2c7a501d20779e2a/seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/screenshots/night-watch-dark-narrowed.png?raw=true)

![The sidebar where a filter and a search leave no repository, in Night watch, light](../blob/f6520c10ab8813ee57e8520a2c7a501d20779e2a/seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/screenshots/night-watch-light-narrowed.png?raw=true)

![The sidebar where a filter and a search leave no repository, in Register, dark](../blob/f6520c10ab8813ee57e8520a2c7a501d20779e2a/seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/screenshots/register-dark-narrowed.png?raw=true)

![The sidebar where a filter and a search leave no repository, in Register, light](../blob/f6520c10ab8813ee57e8520a2c7a501d20779e2a/seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/screenshots/register-light-narrowed.png?raw=true)

![The sidebar where a filter and a search leave no repository, in Desk, dark](../blob/f6520c10ab8813ee57e8520a2c7a501d20779e2a/seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/screenshots/desk-dark-narrowed.png?raw=true)

![The sidebar where a filter and a search leave no repository, in Desk, light](../blob/f6520c10ab8813ee57e8520a2c7a501d20779e2a/seal/threads/1795632146-215-a-filter-that-hides-everything-says-so/screenshots/desk-light-narrowed.png?raw=true)
