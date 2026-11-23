Part of #45. The issue closes when `release/v0.0.2` reaches `main`.

The daemon kept the cost of a headless session only while the session stayed in its memory, at most the last 50 that ended, as one number with no tokens and nothing to say whether it was a charge. So nothing could be set beside what a review round caught.

| Done when | What holds now |
|---|---|
| The daemon writes one ledger entry per stage of a work item, with the cost, the tokens per model and the stage's duration | Each headless session that ends, by its result, an error, an exit, a stop at its limit or at a request, or the daemon's own stop, appends one entry to `ledger.jsonl` in the daemon's run folder. The entry names the work item, its repository and branch, the role and stage, the start and end, how it ended, and the cost with each model's input, output and cache tokens. The gate and the sealer have no stage yet: #42 builds them, and the entry's shape already holds the gate |
| The ledger is kept in the daemon's state, outlives a restart of the daemon, and is not committed | A daemon started on the same run folder reads the entries the one before it wrote. No file of the ledger is written in a repository or a worktree, and deleting a work item takes no entry out |
| Every cost recorded under a subscription login is labelled as converted at API prices | Every cost carries `converted`. It is false only where the session's login names an API key; any other login, and one that cannot be read, reads as converted. Nothing in the window shows a cost yet: #47 draws it |
| The comparison of *Measure before building* is run once, and its result written into `docs/architecture.md` | Not run here: it needs the owner's API key login and a real turn, and goes on as #140 |
| The adapter reports cost and tokens in its neutral shape, and the fake adapter reports them in tests | Both report `usage`, and no field of Claude Code's crosses the protocol |
| A client can ask the daemon for a work item's ledger over the protocol | `readLedger` is answered with `ledger`: the work item's entries in the order their stages ended, and the count of the file's lines that are no entry |

**A stage the daemon stopped** has an entry with no usage. Whether Claude Code reports what it used after such a stop is a measurement that goes on as #141.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
