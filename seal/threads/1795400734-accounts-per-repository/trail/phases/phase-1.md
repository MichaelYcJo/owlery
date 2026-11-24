# Phase 1: 1795400734-accounts-per-repository

## What this phase found

**The frame holds against the tree, with one gap in the phase's file set.** The coordinates of `frame/plan.md` *Technical context* and `frame/design.md` *Grounding* that phase 1 builds on were opened at `0c23013` before the build. `daemon.ts#startHeadless` is the one caller of `RoleAdapter.start`. `claude.ts#claudeEnv` gave five names. `claude.ts#lookupCommand` and `#LOOKUP_SCRIPT` read two marked lines. `repositories.ts` reads a field a later build added as absent. Each says what the frame says of it. Read.

The gap: the *Verified by* cell of phase 1 names five test files. Two more pin fields this phase adds, so the change breaks them and phase 1 edits them:

- `daemon.test.ts`: the key lists of a work item, a repository, a headless session and `ready`, the literals of a created work item, a repository and `HeadlessInfo`, the last look's pins, and the ledger's field list and entries.
- `chain.test.ts`: the gate's ledger entry.

Each edit adds the new field to a pin and changes no assertion besides. Both files ran in the phase's run, below.

**Decisions made while building, each with its grounds.**

- **Where `CLAUDE_CONFIG_DIR` is named.** It is `CONFIG_DIR_VARIABLE` in `claude.ts`. `frame/design.md` *Data & interfaces* puts it in "a new module beside the Claude adapter", with the list of linked names, the making of links and the three `auth` commands. Those belong to phase 3, and phase 1 needs the name alone. A module that holds one constant would be a file made for a later phase. Phase 3 moves the name when it makes the module. Judged against the same section: "A name no case of *User scenarios & acceptance* pins may change in the build."
- **The protocol's new fields are optional.** `Repository.accountId`, `WorkItem.accountId`, `HeadlessInfo.accountId`, `LedgerEntry.account`, and `accounts` and `defaultAccountId` of `ready` are each declared with `?`. The frame writes them as plain fields, and also says each is "absent from a daemon of an earlier build and read by a client as the feature being off". The optional type states that second sentence. It also keeps the window's files and their cases compiling without an edit, since phase 1 touches no window file (`frame/plan.md` *Overlap with the release*). The daemon always sends each field.
- **What `Account` and the stored account hold in phase 1.** `signedIn`, `loginEndsAt`, `limits` and `refresh` are left out. Phase 3 owns sign-in and phase 5 owns the limits (`frame/plan.md` *Phases*). The stored `adapter` is the name of the daemon's role adapter: `"claude"` in the app, `"fake"` in the cases. The frame's `"claude"` is the app's value.
- **`addAccount` takes a required folder.** The frame's request takes "a folder where one is handed over". Adding with no folder is phase 3's (scope item 3).
- **Two folders are one account's where their real paths are one.** The store compares by `realpathSync`, so a link to an account's folder, or a spelling with a trailing slash, is refused as "already an account's". Judged against scenario 7: "is already an account's is refused with a sentence".
- **A setting that names an account the daemon does not keep is cleared at the daemon's start.** The frame says nothing of it. Ids restart where `accounts.json` is lost or edited, so an account added later could take a setting it was never given. The daemon clears such a repository's or work item's setting before it serves anyone, and the nearest setting above then applies. This is in line with scope item 11, where a removal clears every setting that named the account.
- **A broad gate's ledger entry names no account.** It is `account: null`, because the gate runs a command and no agent. The frame gives null only to "a line written before this work". The protocol's comment on `LedgerEntry.account` says both.
- **`ask` refuses an account it does not keep before anything starts.** `setRepository` and `setWorkItem` refuse the same, and set nothing of the message. The sentences are `No account <id> is kept.` and `An account is named by its id, or null for none.` Judged against the protocol's own rule for `setWorkItem`'s `groupId`: a refused field leaves the whole message unset.
- **The session's account is resolved once, at its start.** The ledger takes the id and the name from that moment. Judged against scope item 8: "as they stood when the stage started".
- **The adapter's comment on its features names the two that a role needs.** It said "declares both". There are three features now, and `accounts` decides only whether a folder is passed (`e517efc`).

**The new behaviour, by scenario.**

- Scenario 1: `accounts.test.ts`, "launches each work item's session with the folder of its repository's account".
- Scenario 2: the three cases of `accountFor`, and the daemon case "takes the session's own account, then the work item's, then the repository's, then the default". That case notes the folder given at each start.
- The adding half of scenario 7: the `AccountStore` refusal and no-change cases, and the daemon's refusal case.
- Scenario 10: `ledger.test.ts`, "gives each entry the account its stage ran under".
- Scenario 12: the search printed nothing after the build. Executed.
- The role session's half of scenario 3: `claude-adapter.test.ts`, the System default `claudeEnv` case, and the launch case that runs a stand-in CLI through a stand-in login shell. The launch case checks three things: the account's folder wins over the shell's; the shell's folder is used where no account's is given; and the variable is absent where neither holds one.
- Scope item 12: the case that an adapter without `accounts` gets no folder.

**Seen red.** The cases of phase 1 ran first against the source of `0c23013` with the new cases in place. The command was `node scripts/test-in-electron.mjs` over the five files of the phase. Five files failed; 33 cases failed and 125 passed. Executed.

- `accounts.test.ts` failed at its import, because `accounts.ts` did not exist. Its cases went red one by one in the mutation runs below.
- The new case of scenario 3 failed on `expected undefined to be '/Users/person/accounts/work'`. That is the missing variable.

`accountFor` was written before its cases. Its three mutants below went red: `||` in place of `??`, the work item's setting before the session's own, and the repository's setting skipped.

**Mutation runs, at `5984460`, one `seal mutate` call per file.** Every mutant went red, and none survived. Executed.

| File | Mutants | Cases | What the mutants broke |
|---|---|---|---|
| `protocol.ts` | 3 | `accounts.test.ts -t "the account a new session takes"` | `accountFor`'s order and its `??` |
| `accounts.ts` | 13 | `accounts.test.ts -t "AccountStore"` | each refusal, the realpath comparison, the trim, the `resolve`, the next id read past the highest, the dangling default, the id above 0, `holds` in `setDefault`, the unchanged default, and the write |
| `repositories.ts` | 8 | `repositories.test.ts -t "keeps the account set"` | the read of each field, its check in each validator, its part in each change test, and its assignment in each setter |
| `ledger.ts` | 6 | `ledger.test.ts` | the read of a line with no account, the whole id, the name's check, the entry's refusal, the field in the entry, and a copy of the record |
| `claude.ts` | 9 | `claude-adapter.test.ts -t "five names\|config folder\|scenario 3\|three features\|finding the user"` | the variable's write and its guard; the daemon's own variable passed through; each of the three ways `accountDir` and the shell's folder could combine; the empty line read as a folder; the script's `:-`; and the feature |
| `fake.ts` | 2 | `fake-adapter.test.ts` | the folder in the answer and the feature |
| `daemon.ts` | 19 | `accounts.test.ts -t "the daemon's accounts"` | the two clearings at start; `ready`'s accounts; each check of `accountSetting`; the setting in `setRepository`, `setWorkItem` and `ask`; the feature's gate on the folder; the default in the resolution; the ledger's account; each broadcast; the type check of `addAccount`; `HeadlessInfo.accountId`; `Repository.accountId`; the account's name; the key left out where no folder is given; and the validation in `setRepository` |

**The phase's run.** It ran as one command through the repository's runner, over the five files of the phase and the two whose pins it changed, at `e517efc`. The command was `node scripts/test-in-electron.mjs test/accounts.test.ts test/claude-adapter.test.ts test/fake-adapter.test.ts test/repositories.test.ts test/ledger.test.ts test/daemon.test.ts test/chain.test.ts`. Six files passed. `daemon.test.ts` failed 6 of its cases, and 662 of 668 cases passed. Executed.

Each of the six failed on a pin of the fields, which lacked the new account field. Their pins were fixed in `f812f82`, which changes `daemon.test.ts` alone. `daemon.test.ts` then ran whole and failed one case, a seventh pin of the last look. That pin was fixed in the same commit. The cases the fixes touch then ran, `-t "the last look|creates a work item and opens a pane|carries only the fields|lists an archived work item|repositories"`, and 33 passed. Executed. None of the seven files starts the built app.

**The last look keeps no account.** `last-look.ts` builds the work items of a look from a list of named fields, and `accountId` is not among them. Phase 1 leaves that list as it is, and the look's cases now say the look holds no account. Nothing in the frame reads an account from the look: the look answers what changed since the person last looked, and scope item 10 shows the account from the lists. Phase 2 adds the field to the look where its window needs it.

**The typecheck.** It ran last at `f812f82`. A scratch `tsconfig.json` extends `apps/desktop/tsconfig.json` and lists the eight changed source files and the seven test files. `tsc --noEmit` over it read 52 files of the app and exited 0. Executed. The window's files that import the protocol were not in it. Each new field they could meet is optional, so they should compile, but that was not run.

**A request the frame names and no phase delivers.** `frame/design.md` *Data & interfaces*, the protocol's requests, lists "rename one". Scope item 10 names no rename, and no row of `frame/plan.md` *Phases* delivers one. Phase 1 builds none. The orchestrator folds the frame one way or the other.

**What phase 1 leaves for a later phase, by the frame's plan.** The window, panes, the accounts Owlery makes, sign-in, removal, a running pane's change of account, and the refresh. Phase 1 adds no `SessionInfo.accountId` and no `start` field, since panes are phase 2's.
