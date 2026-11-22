# Review round 2: 1795338000-role-tools-and-permissions

```seal
target: 1ee8c95, fixes 9450a88..2b3de5b
```

This is a verifying round. Its code target is the fix pass of round 1: `63c9355`, `8cdb20f`, `1f23e85` and `2b3de5b`, which the range `9450a88..2b3de5b` holds. `83e89dc` records the closes and `1ee8c95` folds them into the frame, and both touch the work item's records alone. The base is the merge base with `origin/release/v0.0.2`, `a3e4e7a`. The base branch has since moved to `cbb2e69` with a merge that changes documents alone. Phase 3 (the window) waits for #119, and a later round reads it.

The records read whole at `1ee8c95` are `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. The work item holds no `changelog.md`, no `pr.md` and no `pr.<lang>.md` yet. The round ran in a clone at `1ee8c95` under its scratch directory, `1795338000-role-tools-and-permissions/round-2/`.

Carried from round 1, and not searched for again: where the path function of the Claude Code 2.1.330 executable stands (the function that throws `Path must be a string, received`), the versions folder under `/Users/x/.local/share/claude/versions/`, and its `## Not judged` rows on what the CLI puts in `input.file_path`, on a change between the read of a path's links and the write, and on a `permissionMode` key in a taken agent. Re-derived here: round 1's probe rows, written again from its `## Probes` row, and every verdict.

## Findings

### 1. The crafter's path rule reads every error of the system as a name that is not there, so a link it cannot reach is not followed and a write through it is allowed

```seal
severity: should
location: `apps/desktop/src/daemon/role-grants.ts:59-67`, `apps/desktop/src/daemon/role-grants.ts:45-50`, `apps/desktop/test/daemon.test.ts:3694`, `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:89`, `seal/threads/1795338000-role-tools-and-permissions/frame/design.md:271`
evidence: executed `node --experimental-strip-types --no-warnings test_tmp_paths_2.mts` and `node --experimental-strip-types --no-warnings test_tmp_fix_check.mts` in the clone's `apps/desktop`, and `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/daemon.test.ts -t "permission"` with the fix below applied (see `## Probes`); read `apps/desktop/src/daemon/role-grants.ts:51-107`
```

Why it matters: *Scope* item 9 says the rule "follows symbolic links on the part of the path that exists". The rule added to `docs/architecture.md` *Agent adapters* says the daemon "refuses its writes anywhere else". The code follows a link only where the system answers for the path up to it. `realLocation` walks up from the path's end and asks `realpathSync.native`, then `lstatSync`, at each step. Where `lstatSync` throws, the inner `catch {}` at `role-grants.ts:64-66` reads the error as "not there", whatever its code. The walk then goes up a folder, and the names it passed are appended as text with no link on them read.

The probe built a worktree holding five folders of 200-character names, one inside the other, with `link` at the bottom pointing to a folder outside. The relative text to `link/a.txt` is 1,015 characters, and the absolute path is 1,181. macOS reads no path over 1,024 bytes, so every prefix that reaches `link` fails with `ENAMETOOLONG`. Both readings of *Scope* item 9 then land on the worktree. Executed:

- As a crafter, the relative text and the absolute path were each answered `allow`.
- A write of the relative text from the worktree, by the same user, landed in the outside folder.
- A write of the absolute path failed with `ENAMETOOLONG`.
- A folder of the worktree that cannot be searched (mode 600), holding a link out, gave `noexec/link/b.txt` the answer `allow`. Its write failed with `EACCES`.

Through the Claude adapter the write fails today. The CLI's path function makes every path absolute before it writes (the `resolve` against its base, the function round 1 located). The CLI then meets the system's limit. That is a guarantee of the CLI and of the system, not of the rule, and contract rule 13 says such a defence is not verified. `verdictOn` is the neutral rule that every adapter's requests reach (`docs/architecture.md` *Rules that keep it portable*). The fake adapter hands it paths as they are written. An agent that writes by the relative text, as the probe did, writes outside. The link has to stand deeper than the system reads. This round did not check whether git checks out a committed link at that depth. A crafter's command can make one, and a crafter's commands are allowed and can write outside anyway (*Scope* item 20). So the finding is about what the file-tool rule states and does, and it is a `should`.

The class, built from what produces the defect: `lstatSync` throws on a name that is there for every error code but `ENOENT`. lstat(2) lists `EACCES`, `EFAULT`, `EIO`, `ELOOP`, `ENAMETOOLONG`, `ENOTDIR` and `EOVERFLOW` beside it. The probe reached two. `ENOTDIR`, a file named as a folder, is allowed today, and its write fails (`.git/hooks/pre-commit` in a linked worktree, whose `.git` is a file). The fix reads `ENOENT` alone as absence, so it does not rest on that list being whole. Each path it newly refuses is one whose write fails for the CLI as well.

```ts
// apps/desktop/src/daemon/role-grants.ts, in realLocation, in place of the inner catch at lines 64-66.
// Precondition: none beyond the function's own. Any error code but ENOENT now ends the walk with null, so the path is outside.
      } catch (error) {
        // Only a name that is not there is asked of its folder. Any other error, such as a path longer than the system
        // reads or a folder that cannot be searched, leaves the links past it unread, so where a write lands is not known.
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") return null;
        // It is not there: its folder is asked.
      }
```

With this in the clone, the probe's deep link in both forms, the folder that cannot be searched and a path of 600 `./` before `link/a.txt` are refused. `src/new.ts`, `new/deep/new.ts` and `./~/a.txt` stay allowed. `.git/hooks/pre-commit` becomes refused. The 16 cases of `test/daemon.test.ts` that match "permission" pass. The change was then undone.

```ts
// apps/desktop/test/daemon.test.ts, the case at line 3694. `renameSync` and `tmpdir` join the imports.
// Precondition: the chain is built where every path it makes is under 1,024 bytes, so tmpdir() is under 88 characters.
// The case's worktree is over 89 characters, so the chain moved into it is over the limit as an absolute path and
// under it as relative text. The case's cleanup then removes a path over the limit, which this round did not run.
      const short = mkdtempSync(join(tmpdir(), "d"));
      const names = ["a", "b", "c", "d"].map((letter) => letter.repeat(230));
      mkdirSync(join(short, ...names), { recursive: true });
      symlinkSync(outside, join(short, ...names, "link"));
      renameSync(join(short, names[0]!), join(worktree, names[0]!));
      const deep = `${names.join("/")}/link/a.txt`;
// Among the requests that are outside:
        write(deep),
// with its answer in the same place:
        `refused: Write: ${OUTSIDE("crafter", deep)}`,
```

Where the cleanup cannot remove the chain, a row `write("README.md/a.txt")` refused with `OUTSIDE` pins the same guard with no long path. It turns red with the guard removed, though its write cannot land anywhere. The snippets leave four statements of the fact, and the fix pass owes them:

- The docstring of `realLocation` (`role-grants.ts:45-50`) ends its list of what cannot be read with "or a part the system cannot read, such as a path longer than it reads or a folder that cannot be searched".
- *Scope* item 9 (`frame/design.md:89`) gains "A part of the path the system cannot read, a path longer than the system reads or a folder that cannot be searched among them, is outside, because the links past it are not known".
- The fold at `frame/design.md:271` says the same.
- The comment of the case's outside group names the new row.

```seal
verdict: fixed 1aa4344
answer: The finding holds. `realLocation` now climbs to the folder above only where `lstatSync` fails with `ENOENT`, and returns null for any other error, as the round's snippet does, with the comment in the pass's own words. Its docstring names the part the system cannot read, a file named as a folder among it, and says a path inside the worktree that is written longer than the system reads is null as well. The crafter case of `apps/desktop/test/daemon.test.ts` gains five outside rows under one new comment. The rows are the link under five folders of 200-character names as text and as a whole path, `closed/link/a.txt` in a folder of mode 600, `README.md/a.txt`, and 600 `./` before `src/new.ts`. The case's test snippet was not applied. The chain is built from five folders of 200 characters, as the round's probe ran it: the lower three are made beside the worktree and renamed under the upper two, so no precondition on the length of `tmpdir()` or of the worktree stands. A cleanup of the case renames the lower three back and opens the closed folder, so no path over the limit is removed. Executed: against the rule of `3d0e696` all five rows were answered `allowed: Write`, and at `1aa4344` the case passes. The round's row of 600 `./` before `link/a.txt` was not added, because the reading that settles the text refuses it on the old rule as well and it pins nothing of the guard. The row before `src/new.ts` is its replacement, and it pins a new over-refusal: a path inside the worktree written longer than the system reads is refused. `seal mutate` over the guard, executed twice at `1aa4344`: with the `ENOENT` line deleted the five new rows turn to `allowed: Write`, and with `!==` turned to `===` six inside rows are refused and four of the new rows allowed. Both read `red`. The class was listed by taking `role-grants.ts` apart into its three `catch` blocks: the outer one of `realLocation` hands every error to the `lstatSync` below it, the inner one is this fix, and the one in `insideWorktree` returns false. The statements at `frame/design.md:89` and `frame/design.md:271` are the orchestrator's to fold, and scenario 8 at `frame/design.md:135` lists what a reading puts outside without the part the system cannot read.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `insideWorktree` (`apps/desktop/src/daemon/role-grants.ts:89-107`) counts a path as inside only where its four readings are inside. It refuses a NUL, and a leading `~` after the white space is taken off. `realLocation` returns null for a `..` in the part that is not there (`role-grants.ts:58`). Executed, round 1's probe written again at `1ee8c95`: `link/f.txt`, `missing/../link/f.txt`, `~/probe-never-written.txt` and `<outside>/L/../c.txt` are each refused. Executed, the crafter case at `apps/desktop/test/daemon.test.ts:3694` passes, and against the rule of `9450a88` it fails with ten of its eleven new outside rows allowed. Only ` out/a.txt` was refused by the old rule as well, through the link named with a space. The fix pass claimed eight seen allowed against `9450a88`, `~other/a.txt` against `63c9355` and two by removing their guard. The claim describes its own order of work, and nothing in it is contradicted. Executed, each of the two guards removed on its own: without the `..` guard only `hop/missing/../../out/a.txt` turns red, so the round's own row `missing/../link/a.txt` stays refused, as the close says. Without the NUL guard only `link\u0000/a.txt` turns red.

The attacks the caller named, each executed through `verdictOn` as a crafter on the default volume (case-insensitive APFS) and on a case-sensitive APFS image mounted under the scratch directory:

- `..` in either part: `../wt/link/a.txt`, `src/../link/a.txt`, `link/../src/a.txt`, `src/new/..` and `.git/../../x` are refused. `src/.. /x` is allowed, and its `.. ` is a name to the system and to the CLI alike.
- Links: a link to a file outside (`flink`) and `link/.` are refused.
- `~` forms: `~+/x`, a no-break space before `~/a.txt` and a tab before it are refused. A zero-width space before `~` is allowed. JavaScript's `trim`, which both the rule and the CLI's path function use, keeps it, so the CLI reads the path as relative too. `$HOME/a.txt` is allowed, and the CLI's path function expands no variable.
- White space and NUL: `link /a.txt` is allowed, a folder named `link ` that both read alike. A path that ends in a NUL is refused. The empty path and a path of spaces are allowed as the worktree's own folder (`trail/phases/phase-2.md`), where no file can be written.
- Look-alikes: U+2215, U+FF0F and U+2044 in place of `/`, and U+FF0E, U+2024 and U+2025 in place of `.`, are allowed as names inside the worktree. Read in the executable: the CLI's path function wraps each result in `normalize("NFC")`. Executed: NFC leaves all six as they are, and only NFKC would turn them into `/` and `..`.
- Case: on the default volume `LINK/a.txt` and `Link/a.txt` are refused, because the system finds the link whatever the case. The worktree's path in another case is read back by `realpathSync.native` in the worktree's own case and is inside. On the case-sensitive image `LINK/a.txt` is allowed and names a new folder inside.
- Unicode normalization: the link named `é` in its composed form is found by its decomposed spelling on both volumes, so `é/a.txt` is refused on both.
- Very long paths: 600 `./` before `link/a.txt` (1,210 characters) is refused by the reading that settles the text. `link/` followed by five missing names of 200 characters is refused. A link deeper than the system reads is finding 1.
- The worktree's `.git`: a linked worktree's `.git` is a file (`createWorktree`, `apps/desktop/src/daemon/worktrees.ts:533`). A write of `.git` itself is inside and allowed, and so is `.git/hooks/pre-commit`, whose write fails on that file.

Rewritten, `.git` points the worktree at another git folder. That folder's config can run a command when the daemon next runs git in the worktree. This opens nothing a crafter's grant does not already give, because the grant allows its commands, and a command can write anywhere (*Scope* item 20). The bound is the sandbox work's, and this round raises no finding on it.

The two over-refusals *Scope* item 9 names are acceptable. Both fail closed. Claude Code's file tools ask the model for an absolute path: the executable's description of `file_path` reads "The absolute path to the file to write (must be absolute, not relative)". So a leading `~` and a `..` in a folder not made yet are rare in what a crafter sends. The cost of either is one refused call and one step named in the report. The reason the agent reads then says the path "is outside" where the rule only could not place it. The frame states the over-refusal deliberately, so this round raises no finding on the sentence.

The method of the close was to take the CLI's path function apart: the trim, the empty text, `~`, the NUL and the resolve against a base. That list misses one part of the function, the `normalize("NFC")` that wraps each result. On both kinds of APFS volume the composed and the decomposed name are one file, as executed above, so no write the rule allows lands elsewhere on macOS. `## Not judged` names the file system where it would.

```seal
confirms: round-1#2
```
What holds: `permissionEvent` reports a request for a tool outside `held` as `other` with no path and its input as JSON (`apps/desktop/src/daemon/adapters/claude.ts:223-224`), and `start` passes `launch?.tools` (`claude.ts:442`). Executed: the case at `apps/desktop/test/claude-adapter.test.ts:674`, which runs a crafter's launch, and the case at `:792`, which calls `eventsForLine` alone, pass at `1ee8c95`. Against the adapter of `63c9355` each fails on its `toEqual`, at lines 680 and 795. The two are not one case twice. The first holds that `start` hands the launch's tools over, which the second cannot see. *Scope* item 5 (`frame/design.md:85`) and *Data & interfaces* (`frame/design.md:227`) say what the code does.

```seal
confirms: round-1#3
```
What holds: `firstOf` (`apps/desktop/src/daemon/adapters/claude.ts:54-59`) cuts a text over `PERMISSION_TEXT_CHARS` so that it ends with `PERMISSION_CUT_MARK` within the bound, and drops a half character before the mark. Executed: the case at `apps/desktop/test/claude-adapter.test.ts:804` passes, and against the adapter of `63c9355` it fails at line 806 on the mark's text. The comments at `adapters/adapter.ts:18` and `shared/protocol.ts:188`, scenario 5 (`frame/design.md:132`) and *Data & interfaces* (`frame/design.md:198`, `:227` and `:247`) say that a cut text ends with the mark. The fix pass noted a whole text that ends with the mark's own words reads as cut. That is a false "cut" and never a false "whole", so a person is not led to allow more than they read.

```seal
confirms: round-1#4
```
What holds: the fix pass's probe outputs, `probe-q5.txt` and `probe-q5-2.txt` in the scratch directory `1795338000-role-tools-and-permissions/fix-1/`, were read. Executed with `python3`: on 2.1.326, 2.1.327, 2.1.328, 2.1.329 and 2.1.330 the launch with `--disallowedTools AskUserQuestion,EnterPlanMode,ExitPlanMode` lists the same 23 tools and none of the three. Read: each version lists exactly `Bash`, `Glob`, `Grep` and `Read` for the four-tool launch, and those six with `Edit` and `Write` added. Each answers the handshake with `success` and an unknown subtype with `error` that echoes its id. Every result is `Not logged in` with a cost of 0. `frame/questions.md` Q5, `frame/design.md:69` and `frame/plan.md:80` now say this. The new `gaps.md` row names the owner for a request and a refusal on those versions, which needs a model's turn.

What matched: every statement the fold rewrote at `1ee8c95` says what the code does, apart from the one sentence of *Scope* item 9 in finding 1. Read: `frame/design.md:69`, `:85`, `:89`, `:132`, `:135`, `:198`, `:227`, `:247`, `:270` and `:271`; `frame/plan.md:80` and the third row of *Judgments of the run*; `frame/questions.md` Q5. `gaps.md` closes its Q5 row in place with the word `closed`, and no row left it (read: `git diff 9450a88 1ee8c95 -- seal/threads/1795338000-role-tools-and-permissions/gaps.md`).

What matched: the label of the suite is honest. `gaps.md` *Not verified*, its first row, says the whole suite and the typecheck at the branch's last commit were not run, and names the orchestrator. The code's last commit is `1f23e85`, the commit the row names for the fix pass's runs. This round ran four unit files and two files that start the built app at `1ee8c95` (`## Probes`). It ran no typecheck and no broad gate, which remain the orchestrator's.

## Not judged

| What | Location | Who answers |
|---|---|---|
| On a file system that tells a composed name from a decomposed one, as Linux's usually do, the CLI writes the composed form of a path (`normalize("NFC")` in its path function) and the rule reads the form it was sent. A link named in one form is then not found by the other, and a write the rule allows can land through it. macOS is the one platform the release ships, and both kinds of APFS volume read the two forms as one name (executed) | `apps/desktop/src/daemon/role-grants.ts:89-107` | the orchestrator, where the Linux build of `docs/architecture.md` *Open decisions* is decided |
| Whether Claude Code's file tools write a file in place or replace it. A file of the worktree that is a hard link to a file outside changes outside where the write is in place, and the rule reads the path alone. pnpm imports by clone on this machine (link count 1 in the clone's `node_modules`), so no such link stood in the tree read | `apps/desktop/src/daemon/role-grants.ts:89-107` | the sandbox work of *Scope* item 20, which the orchestrator opens |
| Carried from round 1, not re-established: what 2.1.330 puts in `input.file_path`, a change between the read of a path's links and the write, and a `permissionMode` key in a taken agent | `apps/desktop/src/daemon/adapters/claude.ts:205-224`, `apps/desktop/src/daemon/role-grants.ts:51-107`, `apps/desktop/role-bundle/agents/` | as round 1 names: the orchestrator, from #41's first real crafter session; the sandbox work; the orchestrator |
| The whole suite, the typecheck and the broad gate at the branch's last commit | the repository | the orchestrator, by the broad gate |
| The window: *Scope* item 16, scenarios 17 to 19 and 22 | phase 3 | a later round |

## Probes

| Command | Result |
|---|---|
| `git clone --no-local` of the worktree, checked out at `1ee8c95`, then `pnpm install --frozen-lockfile` in the clone | Exit 0 and exit 0 |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/claude-adapter.test.ts test/fake-adapter.test.ts test/daemon.test.ts test/last-look.test.ts` in the clone's `apps/desktop` | Exit 0: 4 files, 349 cases passed |
| `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/role-bundle.test.ts`, then the same with `test/ask-section.test.ts`, one at a time | Exit 0 and exit 0: 11 cases and 2 cases passed |
| `hdiutil create -fs "Case-sensitive APFS"` of a 20 MB image in the scratch directory, attached at a mount point under it, and detached after the probe | The volume's personality read `Case-sensitive APFS`. After the detach, `mount` listed nothing under the scratch directory |
| `node --experimental-strip-types --no-warnings test_tmp_paths_2.mts` in the clone's `apps/desktop`, once, over fixtures in the scratch directory and on the image | Exit 0. The rows listed under the confirmation of round-1#1 and in finding 1. The relative text to the deep link is 1,015 characters and its absolute path 1,181. Both were answered `allow`. A write of the relative text from the worktree created the file in the outside folder, and a write of the absolute path failed with `ENAMETOOLONG` |
| `node scripts/test-in-electron.mjs test/daemon.test.ts -t "answers a crafter's request by its grant"` with `role-grants.ts` of `9450a88` in the clone, `OWLERY_BACKGROUND=1` | Exit 1: the ten outside rows from `missing/../link/a.txt` to `link\u0000/a.txt` received `allowed: Write`, all but ` out/a.txt`. Restored with `git checkout`, and `git status` showed only the probe files |
| The same case with `rest.includes("..") ? null :` removed from `role-grants.ts:58`, then with the NUL guard at `role-grants.ts:90` removed, one at a time | Exit 1 each: only `hop/missing/../../out/a.txt`, then only `link\u0000/a.txt`, received `allowed: Write`. Each change was undone |
| `node scripts/test-in-electron.mjs test/claude-adapter.test.ts -t "launch did not give it\|takes the tools of a launch\|gives a person at most"` with `claude.ts` of `63c9355` in the clone, `OWLERY_BACKGROUND=1` | Exit 1: 3 failed, at lines 680, 795 and 806. Restored with `git checkout` |
| The fix of finding 1 applied to the clone's `role-grants.ts`, then `node --experimental-strip-types --no-warnings test_tmp_fix_check.mts` and `OWLERY_BACKGROUND=1 node scripts/test-in-electron.mjs test/daemon.test.ts -t "permission"` | Exit 0 and exit 0. The deep link in both forms, the folder that cannot be searched, the 600 `./` path and `.git/hooks/pre-commit` are refused. `src/new.ts`, `new/deep/new.ts` and `./~/a.txt` are allowed. 16 cases passed. The fix was undone with `git checkout` |
| `python3 -I` reads of the 2.1.330 executable: the module that holds the path function, its imports, the definition of `pn`, and the descriptions of the file tools' `file_path` | `pn` is `t.normalize("NFC")`. The path function imports `normalize`, `resolve` and `homedir`, and reads `~` and `~/` alone as the home folder. The `file_path` of the write tool is described as "must be absolute, not relative" |
| `stat -f "links=%l"` on a `package.json` under the clone's `node_modules/.pnpm` | `links=1` |
