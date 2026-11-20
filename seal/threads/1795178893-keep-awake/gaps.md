# Closing memo: 1795178893-keep-awake

## Not verified

| Item | Who must answer |
|---|---|
| The case files that start the built app, after the daemon's change: `test/terminal-basics.test.ts`, `test/notification-click.test.ts`, `test/work-item-form.test.ts`, `test/korean-input.test.ts` and `test/memory.test.ts`. Each runs `dist/daemon.js`, which is built from `src/daemon/main.ts`, and phase 1's spawn allows no start of the app | The orchestrator's broad gate, `pnpm -r run check`. `seal deferrals . --kind all` names no runner in CI |
| The typecheck of the whole project. Phase 1 ran `tsc` over the eight files it changed, with the options of `apps/desktop/tsconfig.json` typed on the command line | The orchestrator's broad gate |
| That `src/daemon/main.ts` gives the daemon the real holder with its own process id on macOS, and none on another platform. No case of phase 1 runs that file | Phase 2's case for `frame/design.md` scenario 13 answers the macOS half. The other half stays `read` until a platform other than macOS is taken up, which `docs/architecture.md` *Platforms and their order* puts after the first version |

## Not done

Phase 1 ran no probe of whether a process started with `ELECTRON_RUN_AS_NODE=1` can load Electron's `powerSaveBlocker`. `frame/design.md` *Grounding* records that fact as nobody's finding, and the Electron binary is installed now. `frame/plan.md` *Alternatives considered* rejects that approach on a second ground, that the daemon's bundle names no Electron module, so the probe would change no decision.
