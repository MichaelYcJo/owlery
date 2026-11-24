# Phase 5: 1795400734-accounts-per-repository

## What this phase found

**The frame holds against the tree, but for one fact of the stream.** Before the build, each coordinate the phase row and *Data & interfaces* name was opened at `d6e2bed`, and each stood as the frame says. Read.

- `adapter.ts#RoleEvent` held no limit event, and `RoleFeature` held three features.
- `daemon.ts#startHeadless` was the one caller of `RoleAdapter.start`, and `accounts.ts#AccountStore` kept no limit value.
- Issue #73 had landed no event of this purpose, so the phase builds it.

**The tree holds a recorded run whose stream carries a `rate_limit_event` line.** This contradicts the frame. `test/fixtures/claude-stream.jsonl` line 3 and `test/fixtures/claude-role-stream.jsonl` line 6 are lines of real runs, one turn each, with no limit near. Each carries `rate_limit_info` with `status: "allowed"`, `rateLimitType: "seven_day"`, and `unifiedWindows` holding `seven_day` with its own `utilization`, `resetsAt` and `status`. Its other values are placeholders: `resetsAt` is 0, `utilization` is 0, and `overageDisabledReason` is `"placeholder"`. So the recording settles the line's shape and leaves its values unread. Read.

The frame says otherwise in three places:

- `frame/design.md` *Grounding* reads the reference's `SDKRateLimitEvent` as naming no window.
- `frame/questions.md` Q5 asks whether such a turn's stream carries the event at all.
- The rule change on *Reading usage limits* says that whether a turn far from a limit hands over a value, and for which window, has not been run.

**Decisions made while building, each with its grounds.**

- **The Claude adapter reads the line as the recorded run printed it.** *Data & interfaces* says the fields follow Q5's run where they differ from the reference's type, and the recording is such a run's shape. The adapter gives one event for each window of `unifiedWindows`, named by its key. Where a line holds no `unifiedWindows`, it gives one event of the line's own values, named by `rateLimitType`.
- **Each value is taken only in the reference's form.**
  - The statuses `allowed`, `allowed_warning` and `rejected` read as `ok`, `near` and `reached`, and any other status reads as null.
  - A utilization outside 0 to 1 is null. The frame says `used` is a fraction, and nothing says what another range means.
  - A reset at or before the epoch is null, as the recording's 0 is.
  - A reset is read as seconds, as Claude Code's status line gives one. A value too large for seconds before the year 5000 is read as milliseconds.

  This holds Q5's default, "show no number the CLI did not hand over". Q5's run answers whether these readings are the CLI's.
- **A refresh launch holds no tool, takes one turn and writes no transcript.** In place of the `--disallowedTools` a session with no role gets, `claudeArgs` gives it `--tools ""`, `--max-turns 1` and `--no-session-persistence`. The last is the flag *Grounding* reads from *Explore the .claude directory*.
- **A refresh is no headless session of a work item.** `HeadlessInfo` names a work item, and a refresh has none. So the daemon keeps it beside the account (`Account.refresh`: running since a time, or how it ended), and a later `accounts` message carries how it ended. That is also why it gets no entry in the ledger, as *Alternatives considered* decides.
- **System default is refreshed too.** It is a row of the dialog, as *Scope* item 13 has every account's row. Its session gets no folder and runs under the one the adapter finds, as any session under System default does. Its values are kept in `accounts.json` as `systemLimits`, since System default is no entry of the accounts.
- **Every headless session's limit values are kept for the account it started under.** *Scope* item 13 says "The same reading keeps the values every other headless session of the account hands over".
- **The refusals and their words.** The frame names a live pane and a working headless session. The daemon also refuses a refresh that runs already, an unknown id, and an adapter that declares no `limit-refresh`. A running refresh counts as running under the account, so the account is not removed while it runs.
  - "The usage of "X" is not refreshed while something runs under it, which hands over its values itself: …"
  - "The usage of "X" is being refreshed already."
  - "The fake adapter does not refresh an account's usage."
- **A call the refresh's session asks for is refused.** The session holds no tool, so a request it raises could only wait out the minute.
- **The daemon's close stops a running refresh.**
- **The prompt is "Reply with the single word OK."** It asks for nothing the account's files hold.
- **The window's words.** The frame names the control "Refresh usage" and leaves its sentence and the row's lines to the build.
  - Each row offers the control where it can succeed. Beside it the dialog says "A refresh starts one short Claude Code session under the account, and uses a little of its limit."
  - Each limit value reads, for example, "5-hour limit: near the limit, 42% used, resets in 1 h 30 min, as of 5 min ago". A value the CLI did not give is left out, and a limit with none says "Claude Code gave no value".
  - A refresh that handed over none says "Claude Code handed over no usage value". Its cost is said in the words the seal's back uses for a converted cost.
  - The dialog is drawn again at each `accounts` message, as before, and not at each inbox. Whether a session runs under an account is read when the dialog is drawn, and a refresh of an account that started a session since is refused by the daemon, in words.
- **The daemon's cases stand in `accounts.test.ts`.** The phase row names both `accounts.test.ts` and `daemon.test.ts`. The cases start a daemon through the accounts file's helpers, beside its other cases of the daemon's accounts. `daemon.test.ts` gained no case, and two of its pins name the new key of `ready`.

**Cases and their reds.** The new and amended cases ran against the source of `d6e2bed`, with phase 5's source stashed: 22 failed and 1 passed. Executed.

- The one that passed is the amended "drops every line that is neither the answer's text, nor the limit, nor the result". It now leaves the limit line out, so it pins nothing new.
- `gives a refresh the folder accounts/refresh` ran alone against the same source, and failed on `store.refreshFolder is not a function`.
- The pins that gained `limits`, `refresh` and `refreshesUsage` failed on the missing fields.
- The new cases failed on what they name: the missing feature, the missing arguments, no `limit` event, the missing request's answer, and the missing exports `REFRESH_PROMPT` and `REFRESH_SAYS`.

`22b1683` added the pins of a refresh's failures, of a made folder's names, of an adapter that declares no accounts, and of the daemon's close. Their red is the mutation runs below that break each of those units.

**Each unit that adds behaviour was broken with `seal mutate`.** At `22b1683`, 63 runs broke 63 units across five files: the Claude adapter, the fake adapter, the store, the daemon and `view.ts`. Every run ended `red`, and none survived. Executed.

**What no case watches.**

- The press of "Refresh usage" in the built app, and what the row then shows. The built app starts the real adapter, so a press would start a real `claude`, which no agent starts. The cases pin `accountRows` and `REFRESH_SAYS`, which the dialog draws from, and the built app's case below reads the drawn row. This joins `frame/questions.md` Q8. Unverified.
- What a real turn hands over: whether a turn far from a limit carries `unifiedWindows` with both windows, the range of `utilization`, the unit of `resetsAt`, and the cost. This is Q5's. Unverified.

**The phase boundary.** All runs below were executed.

- **The unit files.** At `025baa9`, one command ran seven files: the phase row's `accounts`, `daemon`, `claude-adapter`, `fake-adapter` and `view`, with `chain` and `ledger`, which import the changed modules. All 7 files passed, with 1204 cases.
- **A failure before that run.** The first run, at `22b1683`, failed two cases of `daemon.test.ts` that pin the keys of `ready`. A daemon of this build sends `refreshesUsage` in `ready`. `025baa9` names it among the keys, and both cases then passed.
- **The typecheck.** A typecheck of the app passed at `b8342ea`.
- **The built-app files, after a build and one at a time.**
  - `role-bundle.test.ts` passed 18 cases. It pins `claudeArgs` on a launch.
  - `role-session.test.ts` skipped its 2 cases. They run only on the person's own login.
  - `theme-controls.test.ts` failed once on its pin of a made account's row, which now holds "Refresh usage" and the sentence beside it. `9291859` pins both. The file then passed 7 cases at `9291859`, so the built app draws the control and its sentence. Nothing presses it.
- **The screenshot run.** The run passed and wrote 22 files.
  - Its stored account was given two limit values, so the Accounts dialog draws them.
  - The first run cut each value at the dialog's width, as a folder's path is cut. `9291859` gives the values, the refresh and the sentence a style that wraps, and the second run shows both values whole.
  - The stored account runs a pane in the run, so its row offers no refresh, as the rule asks.
