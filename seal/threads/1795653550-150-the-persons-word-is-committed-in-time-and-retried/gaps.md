# Closing memo: 1795653550-150-the-persons-word-is-committed-in-time-and-retried

## Not verified

| Item | Who must answer |
|---|---|
| A real signer ends cleanly at the limit: a `gpg` or an `ssh` signer that waits for a passphrase in a prompt outside git's process group (`frame/questions.md` Q2). The cases run with `commit.gpgsign` off, and the probe of `frame/design.md` *Grounding* ran a stand-in signer inside the group. | the owner, in the running app, in a repository that signs its commits |
| That git under `worktrees.ts#commitRunner` gets no input. Git gives a hook none of its own, so the case of scenario D passed with input and without it, and no case pins the runner's `stdin`. | the proofer, by reading `commitRunner` |
| That the `git add` and the `git commit` of one commit share one limit, counted from the call that makes the runner. No case times one command against the other. | the proofer, by reading `commitRunner` and `commitPaths` |
| That an ended git which has not exited by the end of the grace is over at its exit after the SIGKILL: the `exit` handler's arm in `commitRunner`. Git exits at the SIGTERM in every case, so no case reaches that arm. | the proofer, by reading `commitRunner` |
| That a stage's commit and the commit of a renamed branch's `routing.md` take the daemon's limit and its close's signal, and that the setup of the records place takes `commitLimitMs`. The cases end only the commit of a person's word. | the proofer, by reading `Daemon#placeOf`, `#chainDirectory`, `#commitWord`, the setup's request, and `stage-records.ts#commitRecords` |
| That the wait between two tries stops doubling at `WORD_RETRY_MAX_MS`, one hour. The case of the doubling stops at the third wait. | the proofer, by reading `Daemon#commitOwed` |
| That `wordOwed`'s reason is the first line that is not empty where a failed commit printed several. Each case's hook prints one line. | the proofer, by reading `failedWhy` in `daemon.ts` |
| That the read of the records asks git again only where the record's text or the branch's head changed since the last ask. No case counts the `git show` of a record that holds an answered block and stays the same. | the proofer, by reading `Daemon#readOwed` |
| That a word whose try failed and which then waited for a session is tried at the first turn of the pass after the session ends (`wordHeld`). No case makes a try fail and then starts a session. | the proofer, by reading `Daemon#passWords` |
| That the pass tries no work item `whyNoRun` names, an archived one or one being deleted among them. No case owes a word in such a work item. | the proofer, by reading `Daemon#passWords` and `#commitOwed` |
| That a try whose turn comes after the close's wait starts nothing: the check of `ending` at the head of `tryWord`'s attempt. `commitPaths` also starts nothing under a fired signal, so a case cannot tell the two apart. | the proofer, by reading `Daemon#tryWord` |
| That a work item that owes a word is no change since the look (`frame/design.md` scenario P, its second half). `view.ts#changeOf` reads no `wordOwed`, so a case would pass with the field and without it. | the proofer, by reading `view.ts#changeOf` |
| That the page draws what `view.ts#wordOwedSays` and `#wordOwedMark` give: the sentence above the decisions in the preview and in the work item's view, and the line's words after the count of the decisions, joined to it by a comma (`list.ts`). The cases of phase 3 call the two functions and load no page. | the crafter of phase 4, by the cases of `frame/design.md` scenario Q in `apps/desktop/test/screenshots.test.ts`, which wait for the line's words and the sentence |
| That the sentence stands in `--ink-muted` while the word waits for a session and in `--state-failed` where its commit failed (`index.html`, `.detail .word-owed`). No case reads a drawn colour. | the proofer, by reading `index.html` against `docs/design.md` *Components and their states*, and the owner, in phase 4's screenshots |
| That the sentence stands where the record holds no decision, as for an answer alone: `shared.ts#detail` draws it before the decisions' section, which is drawn only where a decision or an unread line stands. No case or screenshot holds such a work item. | the proofer, by reading `shared.ts#detail` |

## Not done

The case of `frame/design.md` scenario D, a `pre-commit` hook that reads its input to the end, was written and then removed: it passed against the tree before the phase and with the runner's `stdin` turned back into a pipe, so it pinned nothing (contract rule 15). `trail/phases/phase-1.md` gives the runs.
