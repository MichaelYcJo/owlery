# Closing memo: 1795328774-lightness-is-measured-not-capped

## Not verified

| Item | Who must answer |
|---|---|
| closed The repository's broad gate at the branch's head, `pnpm -r run check` among it. The crafter ran only the documents' part of it by hand before the commit: each `docs/X.md` and its `docs/X.ko.md`, and `README.md` and `README.ko.md`, hold the same count of `#` heading lines and of table lines, the lines that open with a pipe, and `git grep -e '도장'` over `docs`, `README.md` and `README.ko.md` finds nothing (`trail/phases/phase-1.md`) | answered: the orchestrator's broad gate passed at `def6a6d`, the last run of this work item's `trail/gate.md` and the commit its sealer sealed |

## Not done

The rule row of *Memory design* "Only one window is used. There is no built-in browser", with its reason "Each extra window added about 130 MB", and the line of `docs/product.md` *What we deliberately don't do* "We do not build an IDE, a kanban board or a built-in browser" were left as they stand, in both languages. Issue #120 weighs exactly those two and states how it rewrites them. The new rule does not decide the browser: it says only that a feature is not refused for a scene's number.

Nothing runs the measurement of the reference scenes as features land. The rule names `pnpm run measure:memory` and says that no check runs it, because `test/memory.test.ts` measures nothing without `OWLERY_MEASURE_MEMORY=1`. Making it run at each release or in CI was not taken: #121 asks the documents to state the order, and a run on the owner's machine is the only one that gives the person's start (`apps/desktop/measurements/memory.md` *The kind of start*). Issue #75 holds it, in the orchestrator's comment of 2026-11-22.

No comparable product has been measured in the four-terminal scene, and the documents say so in *Memory design* and in `docs/product.md` *Where performance differs*. Measuring one is work of its own, which the roadmap's open decision on the scenes to measure names among its options. Issue #75 holds it too, in the same comment.

`docs/roadmap.md` *Milestones* row 3 does not name the machine-read caps. #32's own *Done when* asks that row to name its cap, so the row is left to #32.
