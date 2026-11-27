# Review round 1: 1795759846-318-the-bundle-identifier-is-the-owners

```seal
target: 44590d33 against origin/release/v0.1.0
```

The round read `routing.md`, `changelog.md`, `gaps.md`, `pr.md` and `trail/phases/phase-1.md` whole at `44590d33`, and the whole diff of `06222134..44590d33`. No `frame/` directory stands: no `frame/design.md`, `frame/plan.md` or `frame/questions.md` exists at the target, and finding 2 weighs what `routing.md` says of that. No `pr.<lang>.md` is owed, since `seal/config.json` names English for both language keys. No `seal/parity.json` is declared. No earlier round exists, so no fact is carried. `routing.md` answers Planning and Implementation with `the session`, so `trail/phases/phase-1.md` was read as the builder's account and every claim in it was checked against the tree.

The issue's *Done when* was read from `gh issue view 318`. It has three items. The first two hold at the target, as the confirmations below state. The third, that the `.dmg` built at the tag names `com.akmaios.owlery` as `CFBundleIdentifier`, cannot be judged before the tag; `gaps.md` *Not verified* hands it to the `package` job at the tag, and this round carries it under `## Not judged`.

The axes this change adds to the table are two. The first is every place that names the identifier or depends on it. The second is every behaviour that macOS or Electron keys on the identifier instead of on the product name. The first was enumerated by its producer: the value reaches the tree only through the constant, so `git grep -n -w BUNDLE_ID` lists every reader of it. That list is whole for readers of the constant. A literal of the old value spelt elsewhere is a separate class, listed with `git grep -n -F app.owlery.desktop`, which prints nothing at the target. Other spellings (`owlery-desktop`, `owlery_desktop`, `app.owlery`, `CFBundleIdentifier`, `appId`, `bundle id`, and `번들` and `식별자` in the Korean documents) were searched by word, and that search is a sample over an unbounded set of spellings. The second axis is a sample too. It covered the user data folder, the Keychain and notifications, which are the three that the code or the documents name.

## Findings

### 1. Two records state the output of a search that the search as written does not print

```seal
severity: should
location: `seal/threads/1795759846-318-the-bundle-identifier-is-the-owners/gaps.md:5`, `seal/threads/1795759846-318-the-bundle-identifier-is-the-owners/trail/phases/phase-1.md:18`
evidence: executed `git grep -n "owlery.desktop" a6492dde -- ':!seal/threads/'`, `git grep -n -F "owlery.desktop" a6492dde -- ':!seal/threads/'`, `git grep -n -i "bundle id" a6492dde`, `git grep -n -F -e 'printed nothing' -e 'printed only' -- seal/threads/1795759846-318-the-bundle-identifier-is-the-owners/`
```

Why it matters: the claim is that "`git grep -n "owlery.desktop"` outside `seal/threads/` printed nothing" (`gaps.md:5` and `trail/phases/phase-1.md:18`). Run as written at `a6492dde`, that command prints 18 lines. The pattern is a regular expression, and its `.` matches the `/` of the package name `@owlery/desktop`. Examples are `.github/workflows/package.yml:81`, `README.md:38` and `apps/desktop/package.json:2`. The fixed-string form `git grep -n -F "owlery.desktop"` prints nothing. So the conclusion holds and the stated command does not give it.

The second claim is that "`git grep -n -i "bundle id"` printed only `package.ts`'s comment" (`trail/phases/phase-1.md:18`). At `a6492dde` that command prints two lines: `apps/desktop/src/package/package.ts:16`, the comment, and `apps/desktop/test/package.test.ts:129`, the renamed case.

The sealer and the next round re-run a command that a record names as executed. A reader who re-runs either one gets output that contradicts the record, and must then work out which of the two is wrong. The search for `printed nothing` and `printed only` over the work item's records lists these two lines and no other. A statement of the same fact in other words would escape that search, so it is a sample. The snippet covers both lines that the search printed. `pr.md` quotes only the part of `gaps.md:5` before the semicolon, which the snippet leaves as it stands, so `pr.md` needs no change.

`gaps.md:5`, the clause after the semicolon:

```markdown
`BUNDLE_ID` in `apps/desktop/src/package/package.ts` and its pin in `apps/desktop/test/package.test.ts` change from `app.owlery.desktop` to `com.akmaios.owlery` at `a6492dde`, and nothing else; `git grep -n -F "app.owlery.desktop"` outside `seal/threads/` printed nothing after the change.
```

`trail/phases/phase-1.md:18`:

```markdown
`git diff 06222134 a6492dde` holds two hunks, each a constant or its pin, read with the unit around it. `git grep -n -F "app.owlery.desktop"` outside `seal/threads/` printed nothing, and `git grep -n -i "bundle id"` printed `package.ts`'s comment and the name of the case that pins the value. A search on words is a sample.
```

```seal
verdict: fixed ff61a6a2
answer: The orchestrator wrote the round's two texts into `gaps.md` *Scope confirmation* and `trail/phases/phase-1.md` *The read of the range*, so each names `git grep -n -F "app.owlery.desktop"` and what `git grep -n -i "bundle id"` printed. The fix touched the records alone.
```

### 2. `routing.md` records a Planning answer for a frame nobody drew, and cites the ladder's last rung for a scope line that belongs to the second rung

```seal
severity: should
location: `seal/threads/1795759846-318-the-bundle-identifier-is-the-owners/routing.md:7`, `seal/threads/1795759846-318-the-bundle-identifier-is-the-owners/routing.md:18`
evidence: read `seal/threads/1795759846-318-the-bundle-identifier-is-the-owners/routing.md:7`, `seal/threads/1795759846-318-the-bundle-identifier-is-the-owners/routing.md:18`, `skills/implement/orchestration.md` *What the answer writes* (the Planning row), `skills/implement/orchestration.md` *Orchestrator: when a work item is required*; executed `ls seal/threads/1795759846-318-the-bundle-identifier-is-the-owners/`
```

Why it matters: `routing.md:7` answers `Planning | the session`. The plugin's `skills/implement/orchestration.md` *What the answer writes* fills that row "`the session` where the orchestrator drew it, and no row where no frame was called for or chosen". No frame stands at the target, since the work item holds no `frame/` directory. So the row tells the sealer and the settle that the orchestrator drew a frame that does not exist.

The grounds at `routing.md:18` read that the ladder "places [the change] on its last rung; the closing memo's scope line stands for the plan". In *Orchestrator: when a work item is required*, the last rung ("A typo, a config value, a one-line fix") writes "nothing". The scope line that replaces the plan belongs to the second rung ("the closing memo. A one-line scope confirmation replaces the plan"). So the sentence cites one rung and describes what another rung asks for. A change of one constant and its pin fits the last rung, as the sentence first says. On that rung no plan is owed for a scope line to stand for. The closing memo is still worth keeping, because its `Not verified` row hands the built bundle's check to the tag. The routing check reads only a `framer` answer on this row (`lib/routing.py`), so no script reads this row and the sealer's reading is the only one it gets.

`routing.md`: delete line 7, `| Planning | the session |`, and replace line 18 with:

```markdown
- **Planning, no row:** the change is one value of the packager's configuration and the test that pins it, which the ladder of `skills/implement/orchestration.md` *Orchestrator: when a work item is required* places on its last rung, a config value, which asks for no frame. The closing memo is kept for its `Not verified` row, the check of the bundle the tag's build makes.
```

```seal
verdict: fixed ff61a6a2
answer: The orchestrator removed the `Planning` row from `routing.md`'s table and replaced its bullet with the round's text. The fix touched the records alone.
```

## Confirmations

What matched: *Done when* item 1. Claimed: "`BUNDLE_ID` became `com.akmaios.owlery`, its comment names the owner's choice of 2026-11-27 and issue #318" (`trail/phases/phase-1.md:7`). `apps/desktop/src/package/package.ts:16-17` holds that value, and its comment names the owner's choice and its date and names no default. Read.

What matched: *Done when* item 2. `apps/desktop/test/package.test.ts:129-131` pins `BUNDLE_ID` to the literal `"com.akmaios.owlery"`. The narrow run of that file, through the session's lock script, exited 0 with 27 passed, which matches the count `trail/phases/phase-1.md:12` claims. Executed.

What matched: the claim that "the packager's configuration and the check of the built bundle's `Info.plist` read it from there" (`changelog.md:6`). `git grep -n -w BUNDLE_ID` lists the readers of the constant: `package.ts:78` (`appId`), `package.ts:290` and `:293` (the `Info.plist` check and its log line), and `package.test.ts:12`, `:112` and `:130`. `apps/desktop/scripts/package.mjs` and `apps/desktop/scripts/verify-package.mjs` run `packageApp` and `verifyPackage` from that module, and `.github/workflows/package.yml:81` and `:84` run those two scripts. No `electron-builder` configuration file and no `build` key of `apps/desktop/package.json` names another `appId`. So the tag's build and its check both read the one constant. Executed and read.

What matched: no other file of the tree names the old value. `git grep -n -F app.owlery.desktop` at the target prints only this work item's records, which name it as the old value. `apps/desktop/role-bundle/`, `docs/` and the workflows hold no spelling of the identifier that the word search reached. That search is a sample. Executed.

What matched: the change moves no person's data. Electron names the user data folder by the product name, not the identifier (`package.ts:70-73`, `:80`), and `verifyPackage` checks that name at `package.ts:300-302`. `docs/architecture.md:113` states that Owlery reads no Keychain entry, and no file under `apps/desktop/src` calls `safeStorage`. Read.

What matched: claimed, the case was seen red with `BUNDLE_ID` set back to `app.owlery.desktop` (`trail/phases/phase-1.md:11`). The case at `package.test.ts:130` compares the constant with a literal through `toBe`, so with the constant set back it fails on that line and on no other guard. Read, not re-run.

Other observations, none of them a finding. The case was renamed, and no case was added, so no new case is read against its group. The case beside it, at `package.test.ts:109-121`, pins that `appId` is the constant, and this case pins the constant's value, so neither covers the other. The web `Notification` at `apps/desktop/src/renderer/renderer.ts:124` gets its macOS permission keyed on the identifier. So a Mac that ran a 0.0.5 build, which carried `app.owlery.desktop`, likely asks again at the first notice of 0.1.0; this was not run. That is the purpose of setting the value before the first public download, and `docs/roadmap.md:87` states that 0.0.5 was the owner's own release.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The `.dmg` built at the release's tag names `com.akmaios.owlery` as `CFBundleIdentifier` (*Done when* item 3) | `apps/desktop/src/package/package.ts:290`, `.github/workflows/package.yml:84` | the `package` job at the release's tag, as `gaps.md` *Not verified* names it |
| The typecheck the phase claims exited 0 (`trail/phases/phase-1.md:13`), and the suite, which stays `unverified`: under contract rule 2 the round runs neither | `apps/desktop` | the orchestrator's broad gate |
| Whether `docs/architecture.md` *Platforms and their order* should state that the macOS bundle identifier stays fixed from the first public release, as its Android item states for the package name. The issue and `changelog.md:5` state it, and the work item has no `## Rule changes` that would carry it into the policy root at the settle | `docs/architecture.md` *Platforms and their order*, the paragraph that opens **The macOS app ships as a `.dmg` for Apple silicon** | the orchestrator, with the owner where the owner wants the rule written |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/package.test.ts` in `apps/desktop`, through the session's lock script | exit 0; 1 file, 27 cases passed |
| `git grep -n "owlery.desktop" a6492dde -- ':!seal/threads/'` | 18 lines, each `@owlery/desktop` |
| `git grep -n -F "owlery.desktop" a6492dde -- ':!seal/threads/'` | no line, exit 1 |
| `git grep -n -i "bundle id" a6492dde` | 2 lines: `package.ts:16` and `package.test.ts:129` |
| `git grep -n -w BUNDLE_ID HEAD -- ':!seal/threads/'` | 7 lines, in `package.ts` and `package.test.ts` alone |
