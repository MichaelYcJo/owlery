# Questions for the planner: the delete dialog names the queue and keeps its scroll (#249, #251)

`routing.md` answers `Automation` `yes`. No row below holds the build. Each row's default is what the build makes, and the owner may overturn it after the release.

The issues left these judgments open, and the tree answered them:

- Which dialogs list the sessions a removal ends: `frame/design.md` *Grounding*, "The session dialogs".
- Whether the daemon or the protocol changes: `frame/design.md` *Grounding*, "The daemon already treats the two kinds apart, and takes both by id".
- Whether a waiting session keeps a section of its own, a word on its line, or leaves the dialog: `frame/plan.md` *Alternatives considered*, the rows "One list with a word on each waiting line" and "Leave the waiting sessions out of the dialogs".
- How the removal dialog keeps its lists, which #214's round 1 left as a direction: `frame/plan.md` *Alternatives considered*, the rows on a variable beside each drawn part and on each work item's loss apart.
- Whether the lists are kept or their scroll is written back: `frame/plan.md` *Alternatives considered*, the first row.
- Whether the session lists are kept too: `frame/design.md` *Grounding*, "The cause of #251", and *Scope* item 8.
- Where the built-app case of #249 finds a session that waits: `frame/design.md` *Grounding*, "A queue for a built-app case already stands".
- Whether the dialog's row is written in place or through *Rule changes*: `frame/design.md` *Grounding*, the row for `docs/design.md` *Principles* 8.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | What does the head of the section say, over the sessions that wait for the machine? The tree gives the state's words, "Waiting for the machine", and the form of the head beside it, "Running sessions that end". It does not give the product's choice among heads that fit both. | a person | (a) "Sessions waiting for the machine that leave the queue". It uses the words the line and the Machine dialog use, and says what happens, as #249 asks. It is the longest. (b) "Waiting sessions that leave the queue". It mirrors "Running sessions that end", but "waiting" is also the state of a session that needs the person, and such a pane is alive and stands among the running ones. (c) "Queued sessions that leave the queue". "Queued" is the word of the view's "Ask" list, which #224 takes out. | (a) | open |
| Q2 | Should the opening sentence of a session dialog also speak of the sessions that wait? "An archive ends the work item's running sessions." opens the archive dialog, and it opens it too where the work item's only session waits. The sentences are the product's words, and neither issue names them. | a person | (a) Keep each sentence. It says nothing false, and the section under it names the session that waits and what happens to it. (b) Add the queue to each: for example "An archive ends the work item's running sessions and takes its waiting sessions out of the queue." That changes the archive dialog's sentence and the sentences of the restart and of the complete quit, and their cases. | (a) | open |
| Q3 | Does the screenshot's delete dialog still fit the 900px window once the section of the waiting session stands in it, or does the dialog scroll as a whole? No probe answers it here: the answer is the built app's layout, and the one launch that shows it is the screenshot run phase 3 makes. | the work | The answer changes no line of the build. Where the dialog scrolls as a whole, it does so as every modal dialog of the window does, which Q2 of `seal/threads/1795610689-214-delete-dialog-lists-read-cleanly/frame/questions.md` accepted by its default. Where a section is then cut out of the shot, phase 3 says so in its record and the orchestrator decides whether the shot serves. | Phase 3 reads its shots and records what it saw. | open |
