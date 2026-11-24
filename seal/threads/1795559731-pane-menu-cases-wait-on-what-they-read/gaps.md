# Closing memo: the pane menu cases wait on what they read

## Not verified

| Item | Who must answer |
|---|---|
| Whether both cases pass on the first attempt of the `check` job in three runs in a row on the hosted runner, `frame/questions.md` row Q1 | the orchestrator, from the runs of the pull request into `release/v0.0.4` |
| The full suite, and the built-app files other than `test/terminal-basics.test.ts` that load the window's bundle, which holds `src/renderer/view.ts` and `src/renderer/work-item-view.ts` | the orchestrator's broad gate |

## Not done

Three other cases of `apps/desktop/test/terminal-basics.test.ts` read or type into the first pane right after it came back onto the stage, and wait on nothing its replay draws: "types the path of a file dropped on a pane…", "types two dropped files' paths into the pane that took the drop…" and "sends Control+A, Control+E and Control+U for the left arrow…". "sends a line feed for Shift+Enter…" does the same. With every replay 1,500 ms late, the first three failed at `757f1e36` (`trail/phases/phase-2.md`). The Command-key case fails there only because of the rule phase 1 built: before it, a key typed before the replay was sent, and now it is dropped. On the hosted runner it is held off by the 200 ms that `Received.next(0)` waits before the key. No measurement shows whether that is enough. The two drop cases had the same race before this work, where the drop arrived without brackets. Nothing was built for them, because `frame/design.md` *Scope* Out keeps the other cases of the file as they are, and a wait in four more cases is a scope the framer did not give. The first pane draws the link on its first row, so the wait of `frame/design.md` *Scope* item 5 serves each of them. Whether to add it is the orchestrator's judgment, by a reframe or a follow-up.
