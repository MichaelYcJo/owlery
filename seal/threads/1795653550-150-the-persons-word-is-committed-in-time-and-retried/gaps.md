# Closing memo: 1795653550-150-the-persons-word-is-committed-in-time-and-retried

## Not verified

| Item | Who must answer |
|---|---|
| A real signer ends cleanly at the limit: a `gpg` or an `ssh` signer that waits for a passphrase in a prompt outside git's process group (`frame/questions.md` Q2). The cases run with `commit.gpgsign` off, and the probe of `frame/design.md` *Grounding* ran a stand-in signer inside the group. | the owner, in the running app, in a repository that signs its commits |
| That git under `worktrees.ts#commitRunner` gets no input. Git gives a hook none of its own, so the case of scenario D passed with input and without it, and no case pins the runner's `stdin`. | the proofer, by reading `commitRunner` |
| That the `git add` and the `git commit` of one commit share one limit, counted from the call that makes the runner. No case times one command against the other. | the proofer, by reading `commitRunner` and `commitPaths` |
| That an ended git which has not exited by the end of the grace is over at its exit after the SIGKILL: the `exit` handler's arm in `commitRunner`. Git exits at the SIGTERM in every case, so no case reaches that arm. | the proofer, by reading `commitRunner` |

## Not done

The case of `frame/design.md` scenario D, a `pre-commit` hook that reads its input to the end, was written and then removed: it passed against the tree before the phase and with the runner's `stdin` turned back into a pipe, so it pinned nothing (contract rule 15). `trail/phases/phase-1.md` gives the runs.
