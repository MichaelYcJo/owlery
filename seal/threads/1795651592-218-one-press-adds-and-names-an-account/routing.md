# Routing: 1795651592-218-one-press-adds-and-names-an-account

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/218-adding-an-account-takes-a-typed-name-and-a-second-press |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

On 2026-11-26 the owner was told that the other machine's work items of release 0.0.5 cannot be reached until that night, and asked what can be done without them. The orchestrator proposed #218 and #231 under `agentic`, and the owner answered "진행하자" ("let's go"). Every row below is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves three choices to the frame: the file and field the account's name is read from, the name where that field is missing, and whether a second login to the same Claude account is refused or kept with a suffix.
- **Implementation, crafter:** the accounts dialog, the daemon's account folder handling and their cases.
- **Review, through the review chain:** a cancelled or failed login must leave no account and must never remove a folder the person handed over, a loss a person meets only after it happened.
- **Automation, yes:** no person's decision is open. A real Claude login needs the person's browser, so it cannot run unattended; the build covers the login with cases and a stand-in CLI, and a real login stays a check for the owner in `gaps.md`. That changes how the work is proved, not what is built.
- **Branch:** cut from `release/v0.0.5` at `9f9ba1da`; the pull request merges into `release/v0.0.5` by squash. The version already moved to 0.0.5, so this work item does not move it.
