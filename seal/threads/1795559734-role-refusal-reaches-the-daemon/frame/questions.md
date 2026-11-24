# Questions for the planner: 1795559734-role-refusal-reaches-the-daemon

The issue left these open, and the tree or the probe answered them. None is a question now.

- **Whether the role is made to issue the call, or the request is driven by another means:** by another means, `frame/plan.md` *Alternatives considered*, first row.
- **Why the role made no call:** its definition forbids it, `frame/design.md` *Grounding*, the row marked as the cause.
- **Whether the real CLI works against a stand-in for the model with no login:** it does on 2.1.331, `frame/design.md` *The probe*.
- **Which Claude Code version the three runs name:** the one each run prints from its `init` line, `frame/design.md` *Scope* items 6 and 9.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | May the build run `pnpm run role:run` once, to show that the change to the shared helper `launched` left the real session's case working? The tree cannot answer it: the case runs a real model on the person's login, spends the person's usage, and reads four files of the person's Claude Code folder to compare their bytes. The owner's answer of 2026-11-25 allowed real sessions for this issue and also said the session's config folder is the app's own or a temporary one, which this case's is not. | a person | `yes`: the phase runs it once and records the result. `no`: the phase changes `launched` so that the script and the launch without the stand-in model are those of `92f94607`, the diff is read for that, and `gaps.md` names the case as not run with the owner as its answerer. | `no` | open |
| Q2 | Which other runs of the CLI does the daemon make through the wrapper script in the hand check, such as its read of the version, a read of the logins or a refresh of an account's limits, and does each end under the temporary folders and the stand-in model? No probe of the framer's could answer it: the probe started the CLI itself, and the daemon loads `node-pty` as built for Electron, which a fresh clone under the scratch directory does not hold. | the work | Each such run takes the variables of *Scope* item 2, and the stand-in model answers a request that names no `Bash` with a line of text. Where a run fails under them, the phase decides whether that run keeps the person's environment and records why. | The wrapper script sets the variables for every run, and the phase record lists the requests the stand-in model received. | open |
