# Routing: 1795732582-300-202-258-241-timed-cases-hold-under-load

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | test/300-202-258-241-timed-cases-fail-under-load |

Answered 2026-11-27 by the orchestrator, before the first edit.

## Why this way

Timed cases of the desktop suite keep failing under the machine's load, and each failure blocks a sealed pull request until its broad gate runs again: #300 (eight account-change cases of `daemon.test.ts` at about 5 seconds), #202 (a fetch case of `worktrees.test.ts` that waits on git starting the stand-in remote), #258 (a Claude adapter case that reads the stopped CLI's error output before it is written) and #241 (four rows on timed cases under load, carried from release 0.0.2). On 2026-11-27 the owner put them into release 0.1.0, to land before #132, #257 and #127, since the reruns cost more time than the fix ("0.1.0작업 사이에 넣는게좋겠어 계속 발생하니까 오히려 이걸로 수정및 검토 재검증하느라 시간이 더걸리고있어").

- **Planning, framer:** #241's rows are to be answered against the tree as it stands, which needs a wide read; the other three state a cause each. A fix that makes a case pass by asserting less is the defect to rule out in the frame.
- **Implementation, crafter:** test cases, and for #258 possibly the adapter's `exit` event, if the frame judges that the code should wait for the stream's end.
- **Review, through the review chain.**
- **Automation, yes:** ask nobody mid-run; a question goes to `frame/questions.md` with a default.
- **Branch:** cut from `release/v0.0.5` at `57449b14` on 2026-11-27. The release 0.1.0 ships from `release/v0.1.0`, cut from `main` once 0.0.5 merges there; this branch merges that branch in before its broad gate and opens its pull request against it, first among the 0.1.0 items.
