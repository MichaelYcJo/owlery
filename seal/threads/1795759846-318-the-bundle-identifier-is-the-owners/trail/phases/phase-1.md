# Phase 1: the bundle identifier is the owner's

Built by the orchestrator, as `routing.md` answers `Implementation` with `the session`, at `a6492dde`.

## What changed

`BUNDLE_ID` became `com.akmaios.owlery`, its comment names the owner's choice of 2026-11-27 and issue #318, and the case of `apps/desktop/test/package.test.ts` that pins it is renamed "keeps the bundle identifier the owner named" and expects the new value.

## Seen red, then green (executed, once each, through the lock)

- With `BUNDLE_ID` set back to `app.owlery.desktop` and the case expecting the new value: `node scripts/test-in-electron.mjs test/package.test.ts` exited 1, the one failure "expected 'app.owlery.desktop' to be 'com.akmaios.owlery'".
- At `a6492dde`: the same command exited 0, 27 passed.
- `npx tsc --noEmit` in `apps/desktop` exited 0.
- No mutation ran: the change sets a constant and adds no behaviour, and the red run above is the case failing without it.

## The read of the range (executed)

`git diff 06222134 a6492dde` holds two hunks, each a constant or its pin, read with the unit around it. `git grep -n "owlery.desktop"` outside `seal/threads/` printed nothing, and `git grep -n -i "bundle id"` printed only `package.ts`'s comment. A search on words is a sample.
