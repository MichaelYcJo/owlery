# Review round 1: 1795797648-323-the-rules-live-in-the-repository

```seal
target: 8d4d65ea against origin/main
```

This is the first round, so no earlier round's coordinates were carried. The work item has no frame. The plan read for stage 1 is the orchestrator's merged table of 44 rules, which `routing.md` *Why this way* names as the plan. It stands outside the repository, in the orchestrator's scratch. Read with it at the target: `routing.md`, `gaps.md`, `changelog.md`, `pr.md` and `trail/phases/phase-1.md`, each whole; issue #323 with its comments; the diff `aec3e8ac..8d4d65ea`. `seal/config.json` sets `Commit and pull request language` to English, so no `pr.<lang>.md` is owed. No `seal/parity.json` is declared.

## Findings

### 1. The work item names no base branch and no version move, though the release's branch stands with no pull request into it and the diff leaves the version at 0.1.0

```seal
severity: must
location: `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:13-29`, `apps/desktop/package.json:3`
evidence: executed `git ls-remote --heads origin`, `gh pr list --state all --base release/v0.2.0 --json number,title,state`, `git show HEAD:apps/desktop/package.json | grep '"version"'`; read `docs/roadmap.md:86`, `docs/roadmap.md:92`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:29`
```

Why it matters: `docs/roadmap.md:86` says every pull request of a release merges into the release's own branch, and that the first of those pull requests moves the version. `docs/roadmap.md:92` says a release's pull requests merge into that branch by squash, and only the release branch merges into `main`. The rulesets enforce both, and `gh api` shows that `main` takes merge commits only. `git ls-remote --heads origin` shows `release/v0.2.0` at `aec3e8ac`, the same commit as `origin/main`. `gh pr list --base release/v0.2.0` returns no pull request. So this work item's pull request is the release's first, unless the orchestrator orders another one first. The diff does not move the version: `apps/desktop/package.json:3` reads `"version": "0.1.0"` at HEAD, as it does at the base. `routing.md` *Why this way* names neither the branch the pull request merges into nor which pull request moves the version. Its last bullet, `routing.md:29`, says only where the branch was cut. The plugin's routing template asks these grounds to name the base, the version move and the merge order by what was decided. The spawn prompt names the base as `origin/main`. Read against the roadmap, that base takes no work item's pull request. A sealer that reads this routing cannot tell which base the pull request should have, or whether a version move is missing. A version move added after this round is a change outside the records, and a round has to read it.

The orchestrator decides which of the two holds. For `routing.md`, a bullet after `routing.md:28`, either:

```markdown
- **Base and version move:** the pull request merges by squash into the release branch of the release this work item ships in, as `docs/roadmap.md` *Releases and the tracker* states. It is that release's first pull request, so it moves the version in `apps/desktop/package.json`, and `changelog.md` states the version it moves to.
```

or:

```markdown
- **Base and version move:** the pull request merges by squash into the release branch of the release this work item ships in, as `docs/roadmap.md` *Releases and the tracker* states. It is not that release's first pull request. The work item the orchestrator orders first carries the version move.
```

Under the first form, the same fix pass changes `"version"` at `apps/desktop/package.json:3`, and a verifying round reads that commit.

### 2. The roadmap's new counting rule says a release's content is counted from its GitHub milestone, which the same paragraph and the milestone table's rule contradict

```seal
severity: should
location: `docs/roadmap.md:47`, `docs/roadmap.ko.md:47`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/changelog.md:6`
evidence: executed `gh api 'repos/MichaelYcJo/owlery/milestones?state=all&per_page=100'`, `git grep -n -F "GitHub milestone" -- docs CLAUDE.md seal/threads/1795797648-323-the-rules-live-in-the-repository`, `git grep -n -F "GitHub 마일스톤" -- docs`; read `docs/roadmap.md:47`, `docs/roadmap.md:58`
```

Why it matters: the sentence the diff appends to `docs/roadmap.md:47` reads "What a release holds is counted from its GitHub milestone, not from these tables". Earlier in the same paragraph, the roadmap says that a release holds what has merged when it is cut. It also says a milestone is named by its goal and never by a version, so an issue keeps its milestone whichever release ships it. `docs/roadmap.md:58` adds: "A milestone named by its goal takes no number, and its issues ship in the release they merge into". The milestones listed on GitHub at the target confirm it. Every `release: <version>` milestone is closed, and the open ones (#3, #4, #5, #8, #10, #11, #13) are named by goal. So the release now being built has no milestone to count. An orchestrator that follows the new sentence would count a goal milestone, such as `direction: composable workflows and shared rules`, as the release's content. The memory the rule came from (2026-11-26) dates from before #278 split milestones from releases. In that memory, "the GitHub milestone" meant the release's own `release: <version>` milestone. The search printed three statements: the English sentence, its Korean twin, and `changelog.md:6`. A search on these words is a sample, so another wording of the same fact could escape it.

```markdown
What a release holds is read from what has merged into its branch, and what a milestone holds is counted on GitHub, not from these tables. A milestone's description is read before the milestone is renamed or counted.
```

For `docs/roadmap.ko.md:47`, the same place:

```markdown
릴리스에 무엇이 담겼는지는 그 브랜치에 머지된 것에서 읽고, 마일스톤에 무엇이 담겼는지는 이 표가 아니라 GitHub에서 셉니다. 마일스톤의 이름을 바꾸거나 그 안을 세기 전에 마일스톤의 설명을 읽습니다.
```

For `changelog.md:6`, the clause "What a release holds is counted from its GitHub milestone" becomes "What a release holds is read from what merged into its branch, and what a milestone holds from GitHub".

### 3. The `handoff.md` bullet restates a rule the AgenticSeal plugin already holds, against the file's own opening, and the part it adds breaks a sealed work item's seal

```seal
severity: should
location: `CLAUDE.md:17`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/gaps.md:5`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/gaps.md:24`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/changelog.md:5`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/changelog.md:14`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/pr.md:3`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:25`
evidence: executed `git grep -n -F "handoff" -- CLAUDE.md seal/threads/1795797648-323-the-rules-live-in-the-repository`, and a search of the AgenticSeal plugin 0.39.3 for `handoff.md`; read `CLAUDE.md:3`, `CLAUDE.md:17`, `pr-check/README.md:5`, the plugin's `skills/implement/orchestration.md:187-191`
```

Why it matters: `CLAUDE.md:3` says "How the AgenticSeal plugin runs a work item is the plugin's own, and this file does not restate it either". `routing.md:24` decided that rules about using the plugin itself stay out of this repository. The plugin's `skills/implement/orchestration.md:187-191` (0.39.3) already says: "The orchestrator that hands the work over writes a `handoff.md` in the work item's directory only to move the work to another session or another machine. The orchestrator that takes the work over deletes it once it has read it." The plugin's `tests/text/test_the_rules_have_one_owner.py` pins that sentence (`test_a_handoff_file_is_written_only_to_move_the_work`). So `CLAUDE.md:17` restates a plugin rule. Phase 1 claims rule 10 was written as "one sentence, as `routing.md` decided". The merged table marked it "not in the tree", which holds for this tree but not for the plugin the tree is worked with.

Most of the bullet restates the plugin. What it adds is "in each open work item, a committed and pushed" file, and that addition does harm. An open work item can hold a sealed branch that waits in the release's tail. `pr-check/README.md:5` says the guarantee's arm compares the sealed commit's tree with the head's, so a later commit breaks the seal. The plugin's guarantee arm accepts only `trail/gate.md` and `guarantee.md` after the sealed commit. A `handoff.md` committed and pushed there breaks the seal, and the push triggers both pull-request workflows on that branch (finding 4). The search printed the statements this fix reaches. It is a sample.

Delete `CLAUDE.md:17`. Then the records:

- `gaps.md:5`: in "rules 8, 9, 10, 26, 29, 30 and the part of 17", drop "10, ".
- `gaps.md:24`: after "rule 7 (`seal pr-wait` in the pull request's worktree),", add "rule 10 (a `handoff.md` for a run held for another session, which the plugin's `skills/implement/orchestration.md` states),".
- `changelog.md:5`: delete the sentence "A run held for another session leaves a `handoff.md` in each open work item."
- `changelog.md:14`: delete ", a `handoff.md` for a held run".
- `pr.md:3`: copy the new `gaps.md` *Scope confirmation* sentence again, word for word.
- `routing.md:25`: the orchestrator's fold, such as "`handoff.md` is the plugin's practice (`skills/implement/orchestration.md` of AgenticSeal), so nothing is written here."

Where the orchestrator keeps a repository sentence for the push alone, this is the bullet in place of `CLAUDE.md:17`:

```markdown
- **A `handoff.md` the AgenticSeal plugin's orchestration writes is committed and pushed with the step it follows, except in a work item whose branch carries a seal, whose state its `guarantee.md` and its pull request hold.**
```

### 4. The push bullet pushes under every routing and says a push starts no workflow, which the plugin's `stop before the pull request` and the workflows' `pull_request` triggers contradict

```seal
severity: should
location: `CLAUDE.md:16`
evidence: executed `awk '/^on:/{p=1} p&&/^jobs:/{exit} p'` over each file of `.github/workflows/`; read `CLAUDE.md:16`, `.github/workflows/check.yml`, `.github/workflows/owlery-seal.yml`, the plugin's `skills/code-review/orchestration.md:293-298`
```

Why it matters: `CLAUDE.md:16` has the orchestrator push "after every step", with no condition. The plugin's `skills/code-review/orchestration.md:295-298` (0.39.3) says that under `Destination` `stop before the pull request` nothing is pushed, and the branch is handed back committed and unpushed. A work item routed that way here would be pushed against its own routing. The rule's source in memory dates from runs routed `open the pull request`. The bullet then says "A branch push starts none of `check.yml`, `owlery-seal.yml`, `package.yml` and `rerun-unstarted.yml`: the first two start from a pull request". That holds only while the branch has no pull request. `check.yml` runs on `pull_request` for `main` and `release/**`, and `owlery-seal.yml` runs on `pull_request` with `synchronize` among its types. So a push to a branch whose pull request is open starts both. The steps the bullet lists include a fix pass and the gate record, which can come after the pull request opens. A reader who takes the sentence as written pushes believing no check runs, and a push after a seal fails `owlery-seal.yml` on the open pull request.

```markdown
- **Where `Destination` reads `open the pull request`, the orchestrator pushes a work item's branch to `origin` after every step**: a frame, a phase, a round, a fold, a fix pass, the gate record and the seal. It does not wait for the pull request, so another session or machine can take the work item over from the step it reached. A push to a branch that has no pull request starts none of `check.yml`, `owlery-seal.yml`, `package.yml` and `rerun-unstarted.yml`. The first two start from a pull request's events, and a push to an open pull request's branch is one of them. `package.yml` starts from a tag or a person's dispatch, and `rerun-unstarted.yml` from the run of another workflow.
```

### 5. "The orchestrator" in `CLAUDE.md` also names Owlery's orchestrator agent, a role session that reads this file and whose definition runs no command

```seal
severity: should
location: `CLAUDE.md:3`
evidence: executed `git grep -n -i -E "orchestrator" -- CLAUDE.md`; read `CLAUDE.md:15-16`, `docs/architecture.md:189`, `apps/desktop/src/daemon/adapters/claude.ts:96-105`, `apps/desktop/role-bundle/agents/orchestrator.md:15-24`, `apps/desktop/role-bundle/skills/agent-contract/SKILL.md:77`
```

Why it matters: phase 1 says every role session and plugin agent in this repository now reads the new file. It goes on to claim that the file's rules "name the orchestrator as the party that acts, and the agents push nothing by their own contract". `docs/architecture.md:189` confirms that the daemon passes the repository with `--add-dir`, so the repository's `CLAUDE.md` is read. `claude.ts:105` passes `--setting-sources`. The role bundle, though, has an agent named orchestrator. `apps/desktop/role-bundle/agents/orchestrator.md:21-24` says that agent "write[s] no file and run[s] no command that asks for permission", and the bundle's contract (`SKILL.md:77`) says it pushes nothing. `CLAUDE.md:15-16` tells "the orchestrator" to run `git fetch --all --prune` and `gh pr list` before each step, and to push after each step. So an orchestrator role session in this repository reads two instructions that conflict, and `CLAUDE.md` does not say which party it means. In the plugin's runs, the orchestrator is the session. `CLAUDE.md:8` uses the same word, but points to `docs/architecture.md`, whose section describes Owlery's own orchestrator. One sentence in the opening paragraph settles which party the rules mean.

Append to `CLAUDE.md:3`:

```markdown
The orchestrator these rules name is the session that runs a work item, through the AgenticSeal plugin or in a pane that carries the owl chain. A role session that Owlery's daemon starts reads this file too ([docs/architecture.md *Role sessions run detached from the user's environment*](docs/architecture.md#role-sessions-run-detached-from-the-users-environment)), and none of them takes these steps, the orchestrator agent of `apps/desktop/role-bundle/agents/orchestrator.md` among them.
```

### 6. The brand criteria rule a name out on a near trademark in class 42 alone, though the bullet they cite searches classes 9 and 42 and the app is downloadable software

```seal
severity: should
location: `docs/name.md:30`, `docs/name.ko.md:30`
evidence: executed `git grep -n -F "class 42" -- docs`, `git grep -n -F "42류" -- docs`; read `docs/name.md:23`, `docs/name.md:30`, `docs/name.ko.md:23`, `docs/name.ko.md:30`
```

Why it matters: `docs/name.md:23` searches "the software classes (9 and 42)" before release. The new criterion at `docs/name.md:30` rules a name out on "a software trademark (class 42) with a near spelling" and names no other class. Owlery ships as a downloadable desktop app, the goods that class 9 covers. Under these criteria, a near class 9 mark found while a name is searched does not rule the name out. The study the criteria come from met a class 42 mark, LUMAPIX, while it searched for a services brand, and that explains where the narrowing came from. The search printed the English line and its Korean twin. It is a sample.

```markdown
  - The same and similar names are searched on GitHub, npm and the web. A product of the same field with the same or a near spelling rules the name out, and so does a software trademark (class 9 or 42) with a near spelling.
```

For `docs/name.ko.md:30`:

```markdown
  - 같은 이름과 비슷한 이름을 GitHub, npm, 웹에서 찾습니다. 같은 분야의 제품이 같거나 비슷한 철자를 쓰면 그 이름은 쓰지 않고, 소프트웨어 분야(9류, 42류)에 철자가 비슷한 상표가 있을 때도 쓰지 않습니다.
```

### 7. `routing.md` names #333 among the open issues that own a rule, and phase 1 says #333 owns none of the 44

```seal
severity: should
location: `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:26`
evidence: executed `git grep -n -F "#333" -- seal/threads/1795797648-323-the-rules-live-in-the-repository`; read `seal/threads/1795797648-323-the-rules-live-in-the-repository/routing.md:26`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/trail/phases/phase-1.md:15`
```

Why it matters: `routing.md:26` says "no rule is written that an open issue already owns (#129, #279, #322, #333 among them)". `phase-1.md:15` says "#333 (skill descriptions) bears on none of the 44 rules". This round read #333's body and agrees with phase 1: #333 is about the role bundle's skill descriptions, and it owns no rule of the merged table. The sealer reads the routing against the phase records. A record that names an owner for a rule nobody owns is a disagreement the sealer has to resolve. The search printed these two lines.

```markdown
- **Narrowed by the owner during phase 1, 2026-11-28:** no model rule is written, since #129 owns the product's model defaults and how this repository picks models stays in memory; and no rule is written that an open issue already owns (#129, #279 and #322 among them), since that issue writes it when it lands.
```

Where the owner's words named #333, the orchestrator keeps it and adds that it owns none of the 44 rules.

## Confirmations

What matched: the Korean twins match their English sections in heading, table-row and bullet counts. Executed: `grep -c` over `docs/roadmap`, `docs/architecture` and `docs/name`, giving headings 11/11, 27/27 and 5/5, table rows 40/40, 125/125 and 0/0, and bullets 25/25, 73/73 and 14/14. This round also read each changed paragraph against its twin, and the meanings match. The roadmap's `owner runs` bullet, its decision-into-the-issue bullet, its sentence on the release note, the architecture paragraph's study sentence, the icon sentence and the six brand criteria each say what their English says. Two of the Korean renderings are worded more closely than the English, with the same meaning: "만들다가 찾은 결함이 그런 일입니다" and "비어 있는지 확인". The defects of findings 2 and 6 stand in both languages alike.

What matched: nothing personal reached the diff's added lines. Executed: a `grep -i -E` of the added lines for an absolute user path, an email, the owner's name and handle, a host, an IP address, and the names of the brand study's candidates. The only hit is the repository's own issue URL in `changelog.md:14`. The only emoji is the attribution line in `pr.md:6`. Brand criteria: read the study's opening lines 1-9, its `조회 방법` section, and its rounds 13 and 15 (lines 464-466 and 519-521). What `docs/name.md:25-31` copied is the method alone: a dictionary entry with memory marked, one reading with the same sound in the source language and in English, about three syllables with a non-name ending, the seven domain endings with dates, the overlap search, and the trademark and account checks. The personal purpose, every candidate, the name chosen, the first letter the later rounds required, and the path of the look-up script were left out, as phase 1 claims.

What matched: no open issue owns a written rule under other words, in this round's own search. Executed: `gh issue list --state open --limit 400 --json number,title,body,milestone` returned 109 open issues, searched for 34 terms. The terms included `CLAUDE.md`, handoff, `git fetch`, push, `owner runs`, description, new issue, dated section, study, Dock, icon, brand, domain, inventory, surface, workaround, verbatim, delegate, "beyond the issue", release note, fragment, settle, green, required, status check, memory and another machine. Each hit was then read in context. #322 applies rule 29's method to Orca's teammate feature in its research list and does not own the rule. #206 asks for a comparison by surfaces for one product, Claude Ship. #239 changes who starts the settle and not when the note reads the fragments. #187 and #69 are release-closing items and own none of the rules. #250 collects the framers' parts and does not own the rule that asks for them. #333 owns none (finding 7). This is a sample like phase 1's search, and it found no owner phase 1 missed. `gaps.md:12` stays open for the fix pass to close on this search.

What matched: the crafter's judgment that "merge only on green" is #279's holds. Executed: `gh api repos/MichaelYcJo/owlery/rulesets/<id>` for each ruleset. `main: merge commit only` (`~DEFAULT_BRANCH`) and `release branches: squash only` (`refs/heads/release/*`) each hold only the rule type `pull_request`, so the premise holds. Read: #279 *Done when* states that the release branch is protected and that sealed pull requests merge through a queue that merges on green. That is the mechanism that ends the rule for the branch the issue's own wording names ("the release branch has no protection"). It fits the owner's narrowing that rules bound to the long release branch wait for #279. What #279 leaves uncovered is the release's one pull request into `main`, whose ruleset requires no check either. That pull request merges once per release, at the release's close. `docs/roadmap.md` already lets a pull request whose case failed under load merge only after "a run again alone, or a rerun of the job", so the rule is not left wholly unwritten. This round opens no finding on it. The orchestrator can still reverse the placement, as phase 1 says.

What matched: the links and coordinates `CLAUDE.md` names stand at the target. Executed: `grep -n -E` for the headings *Releases and the tracker* (`docs/roadmap.md:45`), *Code runs the order, the orchestrator judges* (`docs/architecture.md:310`), *Memory design* (`:460`) and *Measure before building* (`:527`). The heavy commands paragraph (`docs/architecture.md:349`) sits inside the section that `CLAUDE.md:8` names. `CLAUDE.md` restates none of those sections' rules. The other new bullets, `CLAUDE.md:15`, `:18`, `:22`, `:23` and `:24`, have no other home in `docs/`. Executed: `git grep` for "beyond the issue", workaround, "every surface", inventory and `etcs/research` over `docs` and `README.md`. The plugin's routing template and `skills/implement/orchestration.md` ask for an answer's source, but not for the owner's words verbatim with their date, so `CLAUDE.md:18` adds to the plugin rather than restating it.

What matched: the roadmap's `owner runs` bullet (`docs/roadmap.md:69`) is true of GitHub. Executed: `gh label list --search "owner runs"` printed the label with "The owner does this by hand or runs it through Owlery itself; agents do not take it". `gh issue list --label "owner runs"` shows #271, #261, #260 and #176 in `after launch: first findings and conveniences`, and #184 and #110 in `owner: by hand`. The decision-into-the-issue bullet (`docs/roadmap.md:97`) matches its source and #323's own practice: the issue's second comment points at the body's section. The release-note sentence (`docs/roadmap.md:89`) is true of the settle and of how 0.1.0's note was built. Read: `gh release view v0.1.0` shows a note that carries the fragments, and `package.yml:99` creates the release with an empty note. The study sentence (`docs/architecture.md:334`) refines the batch paragraph, and the batch's later sentences hold with it. The paragraph's `check:` names `apps/desktop/test/daemon.test.ts`, which pins the daemon's park. It does not pin this sentence or the paragraph's other sentences on what the orchestrator checks before the batch. The sentence states no behaviour the diff's code changed, so the round opens no finding for that gap.

What matched: the phase's account of the tree holds where this round opened it. Read: `apps/desktop/src/daemon/adapters/claude.ts:96-105` (`claudeArgs` passes `--setting-sources`). Rule 3 is at `apps/desktop/role-bundle/skills/implement/SKILL.md:338`. Rule 19 is under `Heavy commands` in `seal/config.json`. Rule 22 is at `docs/roadmap.md:67` and placement test 3 at `:75`, and only `apps/desktop/role-bundle/agents/sealer.md:9` holds a `model:` line. The four workflows' `on:` blocks are as phase 1 reads them for a branch with no pull request (finding 4 covers a branch with one). Carried from phase 1 and not re-established: the "already in tree" reads of rules 1, 11, 14, 15, 18, 24, 37 and 38, and phase 1's run of the documents leg at `d01aceb0`.

What matched: `pr.md:3` and `pr.md:4` copy `gaps.md:5` and `routing.md:27` word for word (read). `pr.md:1` says "Part of #323", which `routing.md:28` grounds.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The suite and the rest of `seal/config.json` `Broad gate`. This round ran neither, and the label stays `unverified` | the whole tree at the target | the orchestrator, at the broad gate |
| Whether the six memory rules that stay in memory (rules 40 to 44 of the merged table) are worded rightly there. They live outside the repository, and no round reads them | each machine's agent memory | the orchestrator, when it prunes memory after the merge |
| Whether the plugin's practices that `gaps.md:24` keeps out of the repository hold for the AgenticSeal version on the owner's other machine. This round read version 0.39.3 alone | the plugin's `skills/implement/orchestration.md`, `skills/code-review/orchestration.md` | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `gh issue list --state open --limit 400 --json number,title,body,milestone`, searched by term | 109 open issues; hits read in context; no further owner of a written rule |
| `gh api 'repos/MichaelYcJo/owlery/milestones?state=all&per_page=100'` | every `release:` milestone closed; the open ones named by goal |
| `git ls-remote --heads origin`; `gh pr list --state all --base release/v0.2.0` | `release/v0.2.0` at `aec3e8ac`; no pull request into it |
| `gh api repos/MichaelYcJo/owlery/rulesets/<id>` for each ruleset | two rulesets, each with only the rule type `pull_request` |
| `awk` over the `on:` block of each `.github/workflows/*.yml` | `check.yml` and `owlery-seal.yml` on `pull_request`, `package.yml` on tags and dispatch, `rerun-unstarted.yml` on `workflow_run` |
| `grep -c '^#'`, `grep -c '^\|'`, `grep -c '^ *- '` over each changed English and Korean pair | equal counts in each pair |
| `gh label list --search "owner runs"`; `gh issue list --label "owner runs" --state all` | the label's description as quoted; six issues, four outside `owner: by hand` |
