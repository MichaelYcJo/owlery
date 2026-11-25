# Closing memo: the pane menu cases wait on what they read

## Not verified

| Item | Who must answer |
|---|---|
| Whether both cases pass on the first attempt of the `check` job in three runs in a row on the hosted runner, `frame/questions.md` row Q1 | the orchestrator, from the runs of the pull request into `release/v0.0.4` |
| The full suite, and the built-app files other than `test/terminal-basics.test.ts` and `test/records-dialog.test.ts` that load the window's bundle, which holds `src/renderer/view.ts` and `src/renderer/work-item-view.ts` | the orchestrator's broad gate |
| Whether `.github/workflows/owlery-seal.yml` at 0.0.4 runs on GitHub: its clone of `release/v0.0.4` needs that branch on the remote, and of `v0.0.4` the tag | the orchestrator, from the pull request's checks |
| Whether "shows a card under a link the pointer rests on…" (line 669, with every replay 150 ms late) and "makes a path a pane printed a link…" (line 749, at 100 ms) fail by the late replay or by the machine's load. Each failed once and passed at every other delay of `trail/phases/phase-4.md`. Neither sends to a pane that came back | the orchestrator, from the first attempts of `check` that row Q1 of `frame/questions.md` counts |

## Not done

nothing
