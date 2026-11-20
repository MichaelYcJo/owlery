# Closing memo: 1795178893-keep-awake

## Not verified

| Item | Who must answer |
|---|---|
| The case files that start the built app, after the daemon's change: `test/terminal-basics.test.ts`, `test/notification-click.test.ts`, `test/work-item-form.test.ts`, `test/korean-input.test.ts` and `test/memory.test.ts`. Each runs `dist/daemon.js`, which is built from `src/daemon/main.ts`, and the window's page, which phase 2 changed. Phase 1's spawn allows no start of the app, and phase 2's allows it to the case of `frame/design.md` scenario 13 alone | The orchestrator's broad gate, `pnpm -r run check`. `seal deferrals . --kind all` names no runner in CI |
| The typecheck of the whole project. Phase 1 ran `tsc` over the eight files it changed and phase 2 over the seven TypeScript files it changed, each with the options of `apps/desktop/tsconfig.json` typed on the command line | The orchestrator's broad gate |
| closed that `src/daemon/main.ts` gives the daemon the real holder with its own process id on macOS. No case of phase 1 runs that file | `executed` at `d67ba47`: the built-app case of `test/keep-awake.test.ts` reads the daemon's one child, whose arguments are `/usr/bin/caffeinate -i -w <the daemon's process id>` |
| That `src/daemon/main.ts` gives the daemon no holder on a platform other than macOS. No case runs that file on one, and the fact is `read` | The work item that takes up a platform other than macOS, which `docs/architecture.md` *Platforms and their order* puts after the first version |
| `frame/design.md` scenario 15, the Mac itself: with an agent working in the built app as it ships, the Mac stays awake past its own idle sleep time while the display sleeps, on battery and on power, and it sleeps when the lid closes and, under "Never", as its settings say. No case can wait out that time or close the lid | The owner's hand run in the built app, before the release (`frame/questions.md` Q1) |
| That the window hides the control and says nothing of a hold against a daemon that sends no `keepAwake`. `test/view.test.ts` runs the function that answers so, and no case runs a page against such a daemon: the built-app case's daemon always sends one. That the page hides the control before `ready` is `read`, from the `hidden` attribute in `src/renderer/index.html` | The owner's hand run of this build's window against the daemon an earlier build left running, which `frame/plan.md` *Operational impact* names as such a one |
| How the control looks in the foot: its icon, its place beside the theme's, and the system's menu of the three choices at a press. The built-app case reads the page's elements and draws nothing a person saw | The owner's hand run in the built app |

## Not done

Phase 1 ran no probe of whether a process started with `ELECTRON_RUN_AS_NODE=1` can load Electron's `powerSaveBlocker`. `frame/design.md` *Grounding* records that fact as nobody's finding, and the Electron binary is installed now. `frame/plan.md` *Alternatives considered* rejects that approach on a second ground, that the daemon's bundle names no Electron module, so the probe would change no decision.

Phase 2 gave the control no mark of its own for a hold that stands, such as the stronger ink the sidebar's filter takes while it narrows. `frame/design.md` *Scope* item 8 gives that fact to the status line, and `frame/plan.md` *Alternatives considered* rejects a mark for the hold.
