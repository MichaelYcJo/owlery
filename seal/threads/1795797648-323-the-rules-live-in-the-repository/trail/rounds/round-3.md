# Review round 3: 1795797648-323-the-rules-live-in-the-repository

```seal
target: 69c9d5ee, fixes 6da47d9e..69c9d5ee
```

This is a verifying round. Its code is the range `6da47d9e..69c9d5ee`: the crafter's `8c52f670`, which changes the case in `apps/desktop/test/records-place.test.ts` and adds one sentence to `docs/architecture.md` *Compatibility with AgenticSeal* and its Korean twin, the crafter's `b4246b3d`, which adds `trail/phases/phase-2.md`, and the orchestrator's `69c9d5ee`, which carries the repair into `routing.md` and `pr.md`. Round 2's two findings were closed `fixed 54df4bc8`, a records-only commit, so this round also answers them from that commit. The base is `release/v0.2.0`. `git ls-remote` shows it at `aec3e8ac` on `origin`, HEAD descends from it, and the range holds no merge. The work item has no frame. Read whole at the target: `routing.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md`, `trail/rounds/round-1.md` and `trail/rounds/round-2.md`. `seal/config.json` sets `Commit and pull request language` to English, so no `pr.<lang>.md` is owed. No `seal/parity.json` is declared.

Carried from rounds 1 and 2 and not re-established: the merged table as the plan, the open-issue search of `gaps.md:12`, the workflow triggers behind `CLAUDE.md:16`, and the call chain from `apps/desktop/build.mjs:27` to the sidebar's offer that round 2's finding 2 traced. The range changes none of those files.

## Findings

### 1. While the hold stands, the case holds Owlery's own workflow to today's template at 0.1.0, not to the workflow 0.1.0 wrote, so any change to the template fails it against an untouched file

```seal
severity: should
location: `apps/desktop/test/records-place.test.ts:1120`, `apps/desktop/test/records-place.test.ts:1116`, `docs/architecture.md:307`, `docs/architecture.ko.md:307`
evidence: read `apps/desktop/test/records-place.test.ts:1116-1121`, `apps/desktop/src/daemon/records-place.ts:72-122`, `apps/desktop/src/daemon/records-place.ts:132-139`, `docs/architecture.md:307`, `docs/architecture.ko.md:307`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:21`, `.github/workflows/check.yml:26`; executed `git log --oneline v0.1.0..HEAD -- apps/desktop/src/daemon/records-place.ts .github/workflows/owlery-seal.yml`, `git grep -n -e "written for 0.1.0" -e "the one for 0.1.0" -e "0.1.0에 맞춰" -- .`
```

Why it matters: the claim in `phase-2.md:7` is that, where `seal/README.md` opens with the plugin's marker, "the workflow must be exactly the text written for 0.1.0". `docs/architecture.md:307` says the workflow "stays the one written for 0.1.0", and `docs/architecture.ko.md:307` says "0.1.0에 맞춰 쓴 그대로 둡니다", which reads as the file left as it was written. `#322` *When it lands* step 4 holds "that pin" (read, `gh issue view 322`). The case at `records-place.test.ts:1120` asserts neither. It asserts `toBe(workflowText(PIN_HELD_FOR_THE_PLUGIN))`, and `workflowText` at `records-place.ts:72-122` is the current code's template with only the version put in. The two readings agree at the target because neither the template nor the file has changed since the tag: the `git log` above prints nothing. They part at the first change to the template while this repository's records stay in `seal/`. One such change is already in view. `routing.md:21` gives the pull request check's name to #322, and the template writes that name at `records-place.ts:81` (`name: seal`) and in its opening comment. Once the template changes, the case fails against Owlery's own `owlery-seal.yml`, which nobody touched. The only edit that turns it green rewrites that file to the new template with the clone of `v0.1.0`. No Owlery release wrote that text, and it calls the check of 0.1.0 through whatever the new template's last step names, such as a script path under `pr-check/` that the rename moves. This is what the docs sentence forbids, and the case is the sentence's `check:` target. The exact hold, the file as it stood at the tag, cannot be read in CI, since `check.yml:26` checks out at depth 1 with no tags. So the fix holds what step 4 holds, the pin, through `pinnedVersion` (`records-place.ts:132-139`), which the test file already imports. For a repository whose root is not the plugin's, the assertion stays `toBe(workflowText(version))` and keeps its whole force. The search printed the case's name at `records-place.test.ts:1116`, `docs/architecture.md:307`, `docs/architecture.ko.md:307` and `phase-2.md:7`. The last is the phase's account of its own commit and stays. The search is a sample.

For `apps/desktop/test/records-place.test.ts:1116-1121`:

```ts
  it("holds Owlery's own workflow to the one a setup writes for the app's version, so the pull request that moves the version rewrites it, and its pin to 0.1.0 while this repository's records stand in the AgenticSeal plugin's root", () => {
    const { version } = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version: string };
    const root = join(PR_CHECK, "..", "seal", "README.md");
    const onThePlugin = existsSync(root) && readFileSync(root, "utf8").startsWith(`${PLUGIN_ROOT_MARKER}\n`);
    const workflow = readFileSync(join(PR_CHECK, "..", WORKFLOW), "utf8");
    if (onThePlugin) expect(pinnedVersion(workflow)).toBe(PIN_HELD_FOR_THE_PLUGIN);
    else expect(workflow).toBe(workflowText(version));
  });
```

For the sentence at `docs/architecture.md:307`, the clause "the workflow stays the one written for 0.1.0" becomes:

```markdown
While this repository's records stand in the AgenticSeal plugin's root `seal/`, the workflow keeps its pin at 0.1.0, since the check of a later release reads IADD's forms once #322 renames them, and #322's *When it lands*, step 4, moves the root and the pin in one commit.
```

For `docs/architecture.ko.md:307`, the same clause:

```markdown
이 저장소의 기록이 AgenticSeal 플러그인의 뿌리 `seal/`에 있는 동안에는 워크플로의 고정 버전을 0.1.0에 그대로 둡니다.
```

The fix pass shows the new case red with each guard alone removed, as `phase-2.md` did: the held version changed, and the marker taken as moved.

## Confirmations

```seal
confirms: round-2#1
```
What holds: `routing.md:29` no longer calls 0.2.0 the orchestrator's decision. It says the orchestrator proposed it with its grounds, and it quotes the exchange in which the owner answered: the orchestrator's question whether it may set the release's number too ("이것도 제가 정해도 되면 말씀해 주세요. ..."), and the owner's "머지도 너가정해". The particle 도 ("too") answers the question about the number and adds the merge, so a sealer reading the bullet against `docs/roadmap.md:84` now reads the owner's words, not the orchestrator's account of them, as `CLAUDE.md:17` asks. Read: `git show 54df4bc8`, `routing.md:29`. `apps/desktop/package.json:3` and `changelog.md:9` keep 0.2.0, which the close states. Whether the quote is the owner's words verbatim stands in a conversation this round did not see, so it is a row of `## Not judged`.

```seal
confirms: round-2#2
```
What holds: `routing.md:30` carries round 2's paste-ready sentence on the sidebar's offer, word for word, and `changelog.md:9` carries the clause "and the app's offer to move that pin is not taken here before then" (read, `git show 54df4bc8`). The note in #322's body stands: *When it lands* step 4 now reads "Until then, the app at 0.2.0 offers this repository the move of `owlery-seal.yml` to its version ... and that offer is not taken here" (executed, `gh issue view 322`). The range adds a guard as well. A commit that took the offer would pin `v0.2.0` while `seal/README.md` opens with the plugin's marker, and the case at `records-place.test.ts:1120` then fails. That holds under the fix of this round's finding 1 too.

What matched: for a repository whose root is not the plugin's, the case keeps its full force. Read: the branch `onThePlugin` false gives `toBe(workflowText(version))`, the assertion as it stood before `8c52f670`, with no skip and no other condition. The marker the case keys on is the plugin's: `PLUGIN_ROOT_MARKER` at `records-place.test.ts:23` equals `MARKER` in the plugin's `lib/optin.py:81` and the first line of `seal/README.md`. It also equals Owlery's `records-place.ts:19` today, and #322's name table changes that one to `# What IADD keeps in iadd/` (read, `gh issue view 322`), so the case writes the line out, as `phase-2.md:7` says. The condition is bound to the act step 4 names. The migration commit takes `seal/` out and raises the pin together, so the case passes before it and after it. It fails where the pin moves with the root still in `seal/`, and where the root moves with the pin left at 0.1.0. A `seal/README.md` with CRLF line ends would fail the `startsWith` and fall to the full assertion, which fails closed. The test file still reads `existsSync` from its own import at `records-place.test.ts:6`.

What matched: `phase-2.md`'s seen-red account agrees with the code. Read: each of the three mutations it lists sends the assertion at `records-place.test.ts:1120` to `workflowText("0.2.0")` against a file that pins `v0.1.0`. The first is the gate's own failure at `6da47d9e`. `1120` is the line of the `toBe`. Executed: the file's run, 43 of 43 passed, as `phase-2.md` reports. `git ls-remote` shows no tag `v0.2.0`, so a pin of `v0.2.0` clones from `release/v0.2.0` by the fallback at `owlery-seal.yml:36-38`, as `phase-2.md:5` says.

What matched: the sentence at `docs/architecture.md:307` is the exception's one home among the policy documents. Executed: `git grep -n -i -e "owlery-seal.yml" -e "moves the version" -e "app's version" -e "0\.1\.0" -- docs README.md README.ko.md CLAUDE.md` prints no other sentence that holds this repository's workflow to the app's version. `docs/roadmap.md:86` says that the release's first pull request moves the version, and says nothing of the workflow. `README.md:45` and `docs/architecture.md:273` describe a connected repository's workflow in general. Its reason agrees with #322's body, which gives that reason in step 4. The rule it qualifies, "This repository's workflow is the one Owlery writes for the app's version", stands just before it, and the clause "While ..." scopes it, so a reader does not have to choose between the two. Apart from finding 1's clause, the Korean twin says what the English says. The English "since X, and step 4 moves" is rendered as a reason followed by a statement ("때문이고, ... 옮깁니다"). "뿌리" is the twin's word for the root at `docs/architecture.ko.md:273` and `:276`. The twin's heading and table-row counts are unchanged, since each file changes one line in place.

What matched: the carry in `69c9d5ee` holds. Executed: a string comparison of `pr.md:4` with the text of `routing.md:27`, and of `pr.md:3` with `gaps.md:5`, gives equal both times. `git diff --stat aec3e8ac..HEAD -- apps .github pr-check` prints `apps/desktop/package.json` and `apps/desktop/test/records-place.test.ts` alone, which is what `routing.md:27` now names.

The sentence at `docs/architecture.md:307` gives its reason by #322's plan, an issue body outside the branch. Contract rule 19 holds such a statement of another work item's plan. It is true at the target, by `gh issue view 322`. #322's step 1 rewrites the `docs/` sections that name AgenticSeal's vocabulary, and this one does. So the act that could make it false rewrites it, and this round opens no finding on it. The header comment at `records-place.test.ts:3-4` says that one case reads Owlery's own repository "for its workflow". That case now reads `seal/README.md` too. The comment claims less than the case reads, and no party acts on it at a step.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite, the typecheck of the changed case and the rest of `seal/config.json` `Broad gate`. This round ran only `records-place.test.ts`, and the label stays `unverified` | the whole tree at the target | the orchestrator, at the broad gate |
| Whether the exchange quoted at `routing.md:29` is the owner's words verbatim | the conversation the quote comes from | the orchestrator |
| Whether the broad gate at `6da47d9e` failed one case and passed 2636, as `phase-2.md:5` reports. No `trail/gate.md` stands to read | the orchestrator's run | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `pnpm --filter @owlery/desktop run test test/records-place.test.ts` in the branch worktree | exit 0, 1 file, 43 of 43 cases passed |
| `git log --oneline v0.1.0..HEAD -- apps/desktop/src/daemon/records-place.ts .github/workflows/owlery-seal.yml` | no commit: the template and the file are as they stood at the tag |
| `git ls-remote origin 'refs/tags/v0.2.0' 'refs/heads/release/v0.2.0'` | `release/v0.2.0` at `aec3e8ac`, no tag `v0.2.0` |
| `gh issue view 322` | step 4 holds the pin and carries the note on the sidebar's offer; the name table changes the README marker to `# What IADD keeps in iadd/` |
| a string comparison of `pr.md:4` with `routing.md:27`, and of `pr.md:3` with `gaps.md:5` | both equal |
