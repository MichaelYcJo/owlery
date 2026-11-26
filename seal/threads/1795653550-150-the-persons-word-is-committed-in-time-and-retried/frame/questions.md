# Questions for the planner: the person's word is committed in time and retried

The issue left these judgments to the frame, and the tree and one probe answered each. No row below reopens one.

- How a commit is ended without a locked index: `frame/design.md` *Grounding*, the table of the probe.
- When the daemon retries, and from what it knows that a word is owed: `frame/plan.md` *Alternatives considered*, the rows on the daemon's memory, the tree, the places a session stops working, `Daemon#readCommits` and the timer.
- What the line and the view say of a word not yet committed: `frame/plan.md` *Alternatives considered*, the row on the line alone or the view alone.
- Whether the refusal the issue's comments describe, of a stage's block during a git operation, falls inside this work: `frame/design.md` *Grounding*, the paragraph on the issue's comments.
- Whether the setup of the records place takes the limit: `frame/plan.md` *Alternatives considered*, the row on the setup.
- How the pull request's screenshots show the new words: `frame/plan.md` *Alternatives considered*, the row on a new screenshot view.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | How long may a commit that Owlery's code makes run before it is ended? The tree cannot answer it: the value weighs a hook that hangs against a hook that is slow, in repositories Owlery has not met, and somebody has to stand behind it. No probe measures other people's hooks. | a person | **5 minutes.** A hook that hangs holds its worktree's later commits for five minutes at each try, and a hook slower than that on a records-only commit has every commit of Owlery's ended. **2 minutes.** A hung hook is named sooner, and a slow hook is cut sooner. **60 minutes**, as a headless session and the broad gate have. No real hook is cut, and a hung one holds the worktree's commits for an hour. Each is one constant, `COMMIT_LIMIT_MS`, and changes nothing else that is built. | 5 minutes | open |
| Q2 | Does a real signing setup end cleanly at the limit: a `gpg` or an `ssh` signer that waits for a passphrase in a prompt of its own, outside git's process group? The probe ran a stand-in signer inside the group. A real prompt belongs to an agent process the person's system runs, which no temporary repository of a case reaches. | a person | **It ends, or the prompt stays until the person answers it.** Either way git is ended and the word stays written, by the probe. Where the prompt stays on the screen after the limit, the retry's waits may need to be longer for a repository that signs. | Build as framed. The builder carries the row to `gaps.md` *Not verified* with the owner as its answerer, in the running app, in a repository that signs. | open |
