# Closing memo: 1795632146-215-a-filter-that-hides-everything-says-so

## Not verified

| Item | Who must answer |
|---|---|
| Every test file Phase 1 did not run whose cases load the renderer it changed: each built-app file starts the app from `index.html`, `sidebar.ts`, `renderer.ts`, `view.ts` and `themes.css`. Also the repository-wide suite, the typecheck of every package, and the count of headings and table rows across `docs/*.md` against their `.ko.md` editions | the orchestrator, at the broad gate |
| closed `work-item-menu.test.ts` as a whole at `57bcf3ab` and later. It ran whole at `22c8cb83`, and only its new case's inbox count changed after that run (`trail/phases/phase-1.md`) | the fix pass of round 1 ran the file whole at `47b92bd1`, after its last case gained the hidden repository: 31 passed (`node scripts/test-in-electron.mjs test/work-item-menu.test.ts` in `apps/desktop`) |
| closed how the edge on the filter and the empty sidebar's sentence look in each theme and appearance | the screenshot run of Phase 2 at `6b7161d3`, with `OWLERY_SCREENSHOT_THEMES=all`, passed and wrote 84 shots. Its `narrowed` view waited until the sentence, the button, the class `on`, the title and a computed edge stood. The crafter read the six `narrowed` shots, committed in `7f3f35aa` under `screenshots/` (`trail/phases/phase-2.md`) |
| The wait of the screenshot run's `narrowed` view was never seen to fail. The run is a built-app batch that ran once in Phase 2, so no `seal mutate` run broke the sentence, the class or the edge under it. The unit cases of `view.test.ts` and the built-app case of `work-item-menu.test.ts` pin the same sentence's form, the class and the edge (`trail/phases/phase-1.md`) | the orchestrator, who decides whether a second screenshot run is worth the machine's time |

## Not done

The screenshot run of Phase 2 wrote a shot of every view, and only the six `narrowed` shots are committed. In each other view the filter stands at "All" with nothing typed and the sidebar lists its repository, so this work draws none of them differently. `docs/design.md` *A pull request that changes the window carries its screenshots* asks for a shot of each view the pull request changed. The other shots stand in the crafter's scratch directory and are not committed.
