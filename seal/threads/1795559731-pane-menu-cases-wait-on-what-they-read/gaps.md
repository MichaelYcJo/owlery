# Closing memo: the pane menu cases wait on what they read

## Not verified

| Item | Who must answer |
|---|---|
| closed Whether both cases pass on the first attempt of the `check` job in three runs in a row on the hosted runner, `frame/questions.md` row Q1 | answered: issue #168's comments of 2026-11-25 count the first attempts of `check` from #209 on, runs 45533527515, 45535524288, 45539076257 and 45550707082, each passed both cases; runs 45554688673, 45567349841 and 45606346323 passed on their first attempts after them |
| closed The full suite, and the built-app files other than `test/terminal-basics.test.ts` and `test/records-dialog.test.ts` that load the window's bundle, which holds `src/renderer/view.ts` and `src/renderer/work-item-view.ts` | answered: the broad gate passed at `16ecbd0f`, the one run of this work item's `trail/gate.md`, after which only the work item's records changed; the `check` workflow passed on pull request #209 at the head it merged from |
| closed Whether `.github/workflows/owlery-seal.yml` at 0.0.4 runs on GitHub: its clone of `release/v0.0.4` needs that branch on the remote, and of `v0.0.4` the tag | answered: on pull request #209 the workflow's job `records` cloned `release/v0.0.4`, since no `v0.0.4` tag stands, and passed, and the check `seal` passed; every later pull request into `release/v0.0.4` passed both. The clone of the tag is the line the workflow tries first, and the first pull request after the tag runs it |
| closed Whether "shows a card under a link the pointer rests on…" (line 669 of `f521b5c2`, with every replay 150 ms late) and "makes a path a pane printed a link…" (line 749 of `f521b5c2`, at 100 ms) fail by the late replay or by the machine's load. Each failed once and passed at every other delay of `trail/phases/phase-4.md`. Neither sends to a pane that came back | a measurement no record asks for: the answer would say whether those two cases need a wait of their own under a late replay; neither sends to a pane that came back, both passed on every first attempt of `check` from #209 on, and no failure, report or decision on record waits on it. Nothing is opened |

## Not done

nothing
