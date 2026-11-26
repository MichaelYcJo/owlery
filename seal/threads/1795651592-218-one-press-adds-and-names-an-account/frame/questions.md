# Questions for the planner: 1795651592-218-one-press-adds-and-names-an-account

`routing.md` answers `Automation` `yes`. No row below holds the build, and no row is a person's. Each row's default is what the build makes.

The issue left these judgments open, and the tree answered them:

- The file and the field the account's name is read from: `frame/design.md` *Grounding*, the facts "Claude Code prints the login's email in `claude auth status`" and "The state file is `.claude.json` inside the folder `CLAUDE_CONFIG_DIR` names".
- Whether Owlery opens that file or asks the CLI's command: `frame/plan.md` *Alternatives considered*, the rows on `email` of `claude auth status` and on `.claude.json`.
- What the row is named where the field is missing: `frame/design.md` *Scope* item 4.
- Whether a second login to the same Claude account is refused or kept: `frame/plan.md` *Alternatives considered*, the rows "Refuse the second login" and "Keep the second login and give its name a number".
- How "Use an existing folder…" names its account: `frame/design.md` *Scope* item 6.
- What becomes of a folder where the CLI could not say whether a login stands, which the issue does not name: `frame/plan.md` *Alternatives considered*, the row "Remove the folder where the agent could not say whether a login stands".
- Whether the dialog's row is written in place or through *Rule changes*: `frame/design.md` *Grounding*, the row for `docs/design.md` *Principles* 8.
- Whether the shots of the dialog during and after a login come from the screenshot run: `frame/plan.md` *Alternatives considered*, the last row.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | After a real login, does `claude auth status` print the account's email as `email`, as the executable of Claude Code 2.1.332 reads? No probe can run it: a real login completes in the person's browser, and `routing.md` has no party run one. | a measurement | (a) It does: the row is named by the email, and `gaps.md`'s row closes. (b) It prints none, or under another key: every account is named `Account <id>`, the build still adds and signs in, and the adapter's reading of the output is a follow-up issue. | (a). The build reads `email`, and *Scope* item 4's fallback covers (b). The owner's one real login in the built app measures it, as `gaps.md` holds. | open |
| Q2 | How does the screenshot run take out the account it added, so each appearance draws the same rows: by the row's own "Remove…" in the dialog, or by a request the run sends the daemon? The answer depends on what the run's helpers can press once the views exist. | the work | (a) Through the dialog: the run presses what a person presses, and the removal's question is drawn and answered. (b) By a request: fewer waits, and one more thing the run does that no person does. | (a). Phase 3 records which it took. | open |
| Q3 | Does `AccountLogins.status` gain `name` as a required field, or as one an adapter may leave out? Each stand-in `logins` of the cases is an object literal, and a required field touches each. | the work | (a) Required: no adapter forgets to say that it names no login. (b) Optional, read as null: fewer lines of the cases change. Neither changes what a person sees. | (a). Phase 1 records which it took. | answered 2026-11-26 by the crafter of phase 1: (a), required, in `trail/phases/phase-1.md` |
