Part of #44. The issue closes when `release/v0.0.2` reaches `main`.

Before this work a sealed branch kept saying sealed after a later commit. The chain stored the state `sealed` whatever landed on the branch, the app lit no seal, and the pull request check passed a merge commit made after the seal, even one that changed a source file.

| Done when | What holds now |
|---|---|
| A work item whose head commit is the sealed commit shows `sealed` on its inbox line, in the place #18 left for the seal | The daemon reads the seal from the branch's head commit: where the newest verdict of `guarantee.md` is a seal, the head contains the sealed commit, and the order owes nothing, `WorkItem.seal` reads `sealed` and the seal's place on the line, the preview and the view's foot is lit with "Sealed at" and the commit |
| A commit that lands on the branch after the seal, from the app's terminal or from outside it, turns the line to `broken` without a restart, and a notification arrives | The seal is read again each time the branch's head moves and when a chain ends. A commit after the seal that is no closing record breaks it, wherever it was made: the place is drawn parted, the line waits with "Seal broken", the view's foot says why, and a notification is raised once, where the window held the seal sealed |
| The same commit, once pushed, fails the seal check on the pull request, read by a person without the app | The guarantee arm compares the tree of the sealed commit with the head's and reads the base's commits a merge after the seal brought in, and a ready pull request whose seal a later commit broke gets a failed `Owlery seal` titled "Seal broken: a commit landed after" and the sealed commit. No such push has reached GitHub yet (`frame/questions.md` Q2) |
| The daemon decides sealed or broken from git and the committed record, and never from what a terminal prints | `seal-state.ts#sealAt` reads the head commit's records with git and the order's function; the worktree's uncommitted files are read by no part of it |
| A sealed or broken state survives a restart of the daemon, because it is read again from the repository | The daemon reads every work item's seal at its start and keeps it in memory alone; the run folder names neither state, and a chain's resting state is now `rested` |
| The states `sealed` and `broken` travel in the protocol as neutral values, and the summary of #22 can read them | `WorkItem.seal` is `null` or `{ state, commit, why }` with `state` `sealed` or `broken` |

A new seal after a broken one hands the sealer the part that changed since the sealed commit, and its verdict is still on the whole branch against its base.

How a broken seal is drawn is the owner's to decide (`frame/questions.md` Q1, open): the build drew the default, the seal's drawing split along one slanted break with the wax's red taken out (`--seal-broken-light`).

### Screenshots

The broken work item's view, its foot saying why, and the inbox:

![Night watch dark, the broken work item's view](../blob/9c304c160f7aa2e342c047e38ffa2300a9cd063d/seal/threads/1795396351-seal-breaks-after-a-commit/screenshots/night-watch-dark-broken.png?raw=true)
![Night watch light, the broken work item's view](../blob/9c304c160f7aa2e342c047e38ffa2300a9cd063d/seal/threads/1795396351-seal-breaks-after-a-commit/screenshots/night-watch-light-broken.png?raw=true)
![Register dark, the broken work item's view](../blob/9c304c160f7aa2e342c047e38ffa2300a9cd063d/seal/threads/1795396351-seal-breaks-after-a-commit/screenshots/register-dark-broken.png?raw=true)
![Register light, the broken work item's view](../blob/9c304c160f7aa2e342c047e38ffa2300a9cd063d/seal/threads/1795396351-seal-breaks-after-a-commit/screenshots/register-light-broken.png?raw=true)
![Desk dark, the broken work item's view](../blob/9c304c160f7aa2e342c047e38ffa2300a9cd063d/seal/threads/1795396351-seal-breaks-after-a-commit/screenshots/desk-dark-broken.png?raw=true)
![Desk light, the broken work item's view](../blob/9c304c160f7aa2e342c047e38ffa2300a9cd063d/seal/threads/1795396351-seal-breaks-after-a-commit/screenshots/desk-light-broken.png?raw=true)
![Night watch dark, the inbox](../blob/9c304c160f7aa2e342c047e38ffa2300a9cd063d/seal/threads/1795396351-seal-breaks-after-a-commit/screenshots/night-watch-dark-inbox.png?raw=true)
![Night watch light, the inbox](../blob/9c304c160f7aa2e342c047e38ffa2300a9cd063d/seal/threads/1795396351-seal-breaks-after-a-commit/screenshots/night-watch-light-inbox.png?raw=true)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
