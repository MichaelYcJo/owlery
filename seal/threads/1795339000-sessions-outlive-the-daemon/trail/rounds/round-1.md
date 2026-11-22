# Review round 1: 1795339000-sessions-outlive-the-daemon

```seal
target: e7a6ca3 against origin/release/v0.0.2
```

The round reviewed the branch against its merge base, `a3e4e7a`. It read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `changelog.md`, `pr.md` and `trail/phases/phase-3.md` whole at `e7a6ca3`, and the diff of `docs/architecture.md` and `docs/architecture.ko.md`. No earlier round exists, so no fact was carried. The work item holds no `gaps.md` and no `pr.<lang>.md`. The second is right, because `Commit and pull request language` and `Record language` are both English in `seal/config.json`. The first is finding 6. Issues #36 and #133 and the study's comments on #61, #55 and #78 were read with `gh issue view`. No `seal/parity.json` is declared.

Stage 1 holds. The four edits stand word for word and in place in both editions. The editions agree in heading lines and table lines, and every anchor the new text uses resolves (*Confirmations*). Stage 2 finds five places where the policy text states more than the study ran or established. In each, the frame states the narrower fact and the text placed in `docs/` dropped it. The frame's code blocks in `frame/plan.md` *The text placed in the policy documents* hold the same sentences. A fix pass that changes `docs/` therefore changes those blocks with it, so that the phase record's "placed word for word" stays true, or the fix pass records the departure in a phase record.

One more point is no finding, since it only reads badly. In `docs/architecture.ko.md:53`, "이슈 #133가" takes the wrong particle, because 133 is read 백삼십삼 and ends in a consonant, so it should be "이슈 #133이". The particle came from the plan's "#DAEMON-ISSUE가" when the token was swapped mechanically. A fix pass that edits line 53 for finding 2 can correct it in the same line.

## Findings

### 1. The section says the end of the daemon ends every process it started, which the study did not run for Claude Code and which its own probe contradicts two paragraphs later

```seal
severity: should
location: `docs/architecture.md:44`, `docs/architecture.ko.md:44`, `seal/threads/1795339000-sessions-outlive-the-daemon/changelog.md:5`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:148`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:197`
evidence: read `docs/architecture.md:44`, `docs/architecture.md:55`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:56`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:77`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/questions.md:21`, `apps/desktop/src/daemon/daemon.ts:255`
```

Why it matters: `docs/architecture.md:44` states as policy fact that "the end of the daemon ends every process it started". The study did not establish this. `frame/questions.md:21` keeps Q1 open, because no probe could start a real `claude`, and `frame/design.md:77` says "Whether Claude Code takes the hangup is still not run". The probe at `frame/design.md:56` found the opposite for one stand-in: a process that ignored the hangup lived on after its holder was killed. Line 55 of the same section then says so: "a process that ignores the hangup of its terminal outlives the daemon". The section therefore states the rule and its exception as two facts that cannot both be true. A reader cannot tell which one holds for a Claude Code pane, and the reader of this section is the crafter of #61, who builds the check before a resume. The daemon ends a pane with node-pty's `kill` (`apps/desktop/src/daemon/daemon.ts:255`), which sends the hangup, so the honest sentence names that condition. `changelog.md:5` repeats the claim ("ends the process") for the release notes. The table rows at line 50 and line 51 that read "Ends" stand under the opening paragraph, so this fix covers them without a change of their own.

```markdown
docs/architecture.md:44, the second sentence's clause:
So closing the window or quitting the app ends nothing, and the end of the daemon ends every process it started that takes the hangup of its terminal. Whether a Claude Code pane takes it has not been run, and the first real session of issue #61's work answers it.

docs/architecture.ko.md:44, the same clause:
그래서 창을 닫거나 앱을 끝내도 아무것도 끝나지 않고, 데몬이 끝나면 데몬이 띄운 프로세스 가운데 터미널이 끊기는 신호에 끝나는 것은 모두 끝납니다. Claude Code 칸이 그 신호에 끝나는지는 아직 돌려 보지 않았고, 이슈 #61 작업의 첫 실제 세션이 답합니다.

changelog.md:5, the third sentence:
A restart of the daemon, a crash or a restart of the Mac ends each process that takes the hangup of its terminal, which nobody has yet run for a Claude Code pane, and once #61 is built the conversation comes back by its session id when you ask.

frame/plan.md:148 and :197 take the same two sentences as the docs.
```

```seal
verdict: fixed a49e3b3
answer: Both editions now name the hangup condition and the open Q1, and changelog.md:5 says it for the release notes. The plan's blocks stay the framer's, and trail/phases/fix-1.md lists the departure.
```

### 2. The daemon is said to write its counts into its log at each end, a crash included, which a crashed daemon cannot do, and the open decision is weighed on that count

```seal
severity: should
location: `docs/architecture.md:53`, `docs/architecture.md:393`, `docs/architecture.ko.md:53`, `docs/architecture.ko.md:393`, `seal/threads/1795339000-sessions-outlive-the-daemon/changelog.md:7`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:157`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:181`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:206`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:230`
evidence: executed `gh issue view 133 --json title,body,milestone,state`; read `docs/architecture.md:53`, `docs/architecture.md:393`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:130`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:134`
```

Why it matters: `docs/architecture.md:53` says "The daemon writes one line into its log at each end, with why it ended, how many panes were alive and how many agents were working". The study's own part 1 (`frame/design.md:130`) and the *Done when* of #133, which builds these lines, both say something narrower. The daemon writes the counts when it stops. A start that finds the `daemon.json` of a daemon that no longer answers writes only that the daemon before it "ended without stopping". A daemon killed by a crash runs no code and writes no counts. The *Open decisions* row at line 393 then weighs the decision on "How often the daemon's log shows a restart or a crash that ended a working agent". For a crash, the log #133 builds holds no such fact: it records that a crash happened and not whether an agent was working. `frame/design.md:134` names the crash as the one case parts 1 and 2 do not cover. The decision row would thus send its next reader to a number no log holds. `changelog.md:7` says "the log line at each end".

```markdown
docs/architecture.md:53, the sentence on the log:
The daemon writes one line into its log when it stops, with why it stopped, how many panes were alive and how many agents were working. A daemon that crashed writes nothing, so the daemon that starts after it writes that the one before it ended without stopping.

docs/architecture.md:393, the third cell opens:
How often the daemon's log shows a restart that ended a working agent, and how often it shows a crash, what a resume costs ...

docs/architecture.ko.md:53, the same sentences:
데몬은 멈출 때마다 로그에 한 줄을 씁니다. 왜 멈췄는지, 살아 있던 칸이 몇이고 일하던 에이전트가 몇인지를 적습니다. 죽은 데몬은 아무것도 쓰지 못하므로, 그다음에 뜨는 데몬이 앞의 데몬이 멈추지 않고 끝났다고 씁니다.

docs/architecture.ko.md:393, the third cell opens:
데몬의 로그에 재시작이 일하던 에이전트를 끊은 일과 데몬이 죽은 일이 얼마나 자주 나오는가, ...

changelog.md:7: "the log line at each end" becomes "the log lines at each stop and after a crash".

frame/plan.md:157, :181, :206 and :230 take the same text as the docs.
```

```seal
verdict: fixed a49e3b3
answer: Both editions say the log line is written at a stop and that a crash writes nothing, the open-decision cell separates restart from crash, the Korean particle is now 이슈 #133이, and changelog.md:7 is changed as given. The plan's blocks stay the framer's, and trail/phases/fix-1.md lists the departure.
```

### 3. The handover row says a stand-in pane "lived through such a handover", but the probe passed the descriptor to a child the holder started, not to a next daemon

```seal
severity: should
location: `docs/architecture.md:62`, `docs/architecture.ko.md:62`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:166`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:215`
evidence: read `docs/architecture.md:62`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:57`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:123`, `apps/desktop/src/main/daemon-client.ts:50`
```

Why it matters: the row is "Handing each terminal's descriptor to the next daemon", and its cost cell ends "A stand-in pane lived through such a handover and took a resize (probed 2026-11-22)". The probe as `frame/design.md:57` records it was narrower. A holder started a second process that inherited the descriptor, then exited. The pane lived, and the second process read the pane and resized it. That shows a pane outliving its holder and a process that inherits a descriptor driving it. It does not show the handover the row names. Today the next daemon is started by the app, detached (`apps/desktop/src/main/daemon-client.ts:50`), not by the daemon that stops, so it would not inherit the descriptor. The decision cell calls this way "The first to weigh", and the next reader weighs it on this sentence. The study's own cost row (`frame/design.md:123`) leaves the handover's mechanism open, and the policy text should do the same.

```markdown
docs/architecture.md:62, the last sentence of the cost cell:
A stand-in pane outlived its holder, and a process that inherited its descriptor from the holder read it and took a resize (probed 2026-11-22). A handover to a daemon the stopping one did not start was not run

docs/architecture.ko.md:62, the same sentence:
대신 세운 칸은 그것을 쥐던 프로세스가 끝난 뒤에도 살았고, 그 프로세스에게서 디스크립터를 물려받은 프로세스가 칸을 읽고 크기 바꾸기를 보냈습니다(2026-11-22 실험). 멈추는 데몬이 띄우지 않은 데몬에 넘기는 것은 돌려 보지 않았습니다

frame/plan.md:166 and :215 take the same text.
```

```seal
verdict: fixed a49e3b3
answer: Both editions now state what the probe showed and that a handover to a daemon the stopping one did not start was not run. trail/phases/fix-1.md lists the departure from the plan's blocks.
```

### 4. The background-sessions row gives `claude --bg` a session "through any end of the daemon, as `claude --help` reads", which takes in a reboot and quotes the help for more than it says

```seal
severity: should
location: `docs/architecture.md:65`, `docs/architecture.ko.md:65`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:169`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:218`
evidence: read `docs/architecture.md:65`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:53`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:113`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/questions.md:22`
```

Why it matters: the cell reads "A Claude Code session through any end of the daemon, as `claude --help` of 2.1.330 reads. Not run". A restart of the Mac is an end of the daemon, and the study's own table (`frame/design.md:113`, row F, column *Reboot*) says that there "the process ends". The cell's column is "What it keeps that the two rules do not", so the claim reaches a case the way does not cover. Second, the help text the study read says of `--bg` only "Start the session in the background and return immediately" (`frame/design.md:53`). Survival past the process that attached is the study's expectation ("expected to live, from the help text", `frame/design.md:113`), and Q2 (`frame/questions.md:22`) keeps it open. "Not run" is honest, but "as `claude --help` reads" credits the help with the claim.

```markdown
docs/architecture.md:65, the second cell:
A Claude Code session through a restart or a crash of the daemon, which the study expects from `claude --help` of 2.1.330 and did not run

docs/architecture.ko.md:65, the second cell:
데몬이 다시 시작하거나 죽어도 Claude Code 세션. 2.1.330의 `claude --help`를 읽고 그렇게 될 것으로 보았을 뿐 돌려 보지 않았습니다

frame/plan.md:169 and :218 take the same cells.
```

```seal
verdict: fixed a49e3b3
answer: Both editions now say the study expects survival from the help text and did not run it, and limit it to a restart or a crash of the daemon. trail/phases/fix-1.md lists the departure from the plan's blocks.
```

### 5. The update row says a role session's run goes on in the kept daemon unconditionally, dropping the study's condition that the kept daemon reads files of its own build, and leaving the role-bundle rows of the same document unreconciled

```seal
severity: should
location: `docs/architecture.md:49`, `docs/architecture.md:53`, `docs/architecture.ko.md:49`, `docs/architecture.ko.md:53`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:157`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:206`
evidence: read `docs/architecture.md:49`, `docs/architecture.md:86`, `docs/architecture.md:244`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:24`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:141`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/plan.md:20`, `seal/threads/1795339000-sessions-outlive-the-daemon/frame/questions.md:24`, `apps/desktop/src/daemon/main.ts:53`
```

Why it matters: the table row "The app is updated" says of a role session "Lives, and its run goes on", and line 53 says nothing on what the kept daemon reads. The study states a condition for this (`frame/design.md:141`): the run goes on "in the packaged app" only where "the daemon's script and the role bundle" are "read from files the update does not replace, which is issue #78's to build and to check". Q4 (`frame/questions.md:24`) keeps that open. The daemon reads the bundle beside its own script at each launch (`apps/desktop/src/daemon/main.ts:53`). So a kept daemon whose folder the updater replaced launches the next stage on the newer bundle. The plan names the same thing for a development build (`frame/plan.md:20`). The study's grounding reads `docs/architecture.md:86` ("the app's version and the bundle's version are always the same") as binding a kept daemon to its own build's bundle (`frame/design.md:24`), and line 244 says the order and the bundle "do not drift apart". With the condition dropped, the new section states a run that goes on through an update, while lines 86 and 244 state a pairing that the update breaks unless #78 holds it. The comment the study posted on #78 carries the condition, but the policy is the source #78's crafter opens.

```markdown
docs/architecture.md:53, after "the window reads a field the daemon does not send as a feature that is off.":
A kept daemon goes on reading its own build's script, node-pty's native files and the role bundle, so the packaged app runs it from files the update does not replace, and issue #78 builds and checks that.

docs/architecture.ko.md:53, after "창은 데몬이 보내지 않는 필드를 꺼진 기능으로 읽습니다.":
그대로 둔 데몬은 자기 빌드의 스크립트와 node-pty의 네이티브 파일, 역할 묶음을 계속 읽으므로, 패키지된 앱은 업데이트가 바꾸지 않는 파일에서 데몬을 돌리고, 이것은 이슈 #78이 만들고 확인합니다.

frame/plan.md:157 and :206 take the same sentence. Lines 86 and 244 of each edition need no change once this sentence names the condition.
```

```seal
verdict: fixed a49e3b3
answer: Both editions carry the sentence after the sentence on the window reading a field the daemon does not send. Lines 86 and 244 were read and stand. trail/phases/fix-1.md lists the departure from the plan's blocks.
```

### 6. The work item has no `gaps.md`, so what went out unproved stands only in `pr.md`'s prose, where `seal pr-body` and the settle do not read it as rows

```seal
severity: must
location: `seal/threads/1795339000-sessions-outlive-the-daemon/gaps.md`, `seal/threads/1795339000-sessions-outlive-the-daemon/pr.md:13`
evidence: executed `ls -R seal/threads/1795339000-sessions-outlive-the-daemon/`; read `seal/threads/1795339000-sessions-outlive-the-daemon/pr.md:13`, `seal/threads/1795339000-sessions-outlive-the-daemon/trail/phases/phase-3.md:1`, the plugin's `skills/implement/SKILL.md:290`, the plugin's `skills/code-review/scripts/pr_body.py:14`
```

Why it matters: the plugin's document layout (`skills/implement/SKILL.md:290`) has the builder write `gaps.md` from `templates/records/sdd-gaps.md` "when the first phase closes". Phase 3 closed in `650c67b` and no `gaps.md` exists at `e7a6ca3`. The items that went out unproved instead stand as a "Not verified:" list in `pr.md:13`. `seal pr-body` copies `gaps.md`'s `## Not verified` into the records' part of the body (`skills/code-review/scripts/pr_body.py:14`), so the body it composes will say the memo is not there, while the orchestrator's part above lists unproved items. The settle decides the open rows of `gaps.md`. One item, whether a subagent's hook events carry the pane's `session_id`, is a row of no record in this work item: it stands only in `pr.md` and in the comment on #61. The phase record says nothing of the memo. So this is a step the method left out, not an item it judged.

```markdown
seal/threads/1795339000-sessions-outlive-the-daemon/gaps.md (new):

# Closing memo: 1795339000-sessions-outlive-the-daemon

## Not verified

| Item | Who must answer |
|---|---|
| Whether the process of a real Claude Code pane ends when its daemon stops (`frame/questions.md` Q1, the row the settle of release 0.0.1 carried to #36) | The first real session of issue #61's work, or the owner by hand: after "Restart Daemon…" with a Claude Code pane open, `claude agents --json` lists no session whose `cwd` is that pane's worktree |
| Whether the hook events of a subagent carry the pane's own `session_id` | The first real session of issue #61's work |
| Whether Owlery's hook settings and a pane's environment reach a `claude --bg` session, and whether it outlives the process that attached to it (`frame/questions.md` Q2) | The first real session of issue #61's work |
| Whether a daemon started from inside the packaged app's folder keeps opening panes and launching role sessions after the updater replaced that folder (`frame/questions.md` Q4) | Issue #78's work |

## Not done

nothing

pr.md: delete lines 13 to 16 (the "Not verified:" heading and its two bullets), since `seal pr-body` copies the memo's section below the orchestrator's part.
```

```seal
verdict: fixed a49e3b3
answer: gaps.md is written as given, and the Not verified heading and its two bullets are removed from pr.md. The remaining lines of pr.md were read against the records and still hold.
```

## Confirmations

What matched: the four edits of `frame/plan.md` *The text placed in the policy documents* stand word for word in each edition, with `#133` in place of `#DAEMON-ISSUE`, and in place. The base `a3e4e7a` with edit 1 replacing the bullet, edit 2 inserted before `## Agent adapters` or `## 에이전트 어댑터`, edit 3 replacing the daemon's row and edit 4 appended reproduces each file at `e7a6ca3` byte for byte. This was executed by the probe in *Probes*, so the phase record's claim at `trail/phases/phase-3.md:5` and `:7` holds.

What matched: each edition has 27 heading lines and 122 table lines at `e7a6ca3`, and 26 and 108 at the base and at `d948406`, as `trail/phases/phase-3.md:9` claims. This was executed with `grep -c` through `git show`. The broad gate itself was not run here.

What matched: the twelve links the new text uses resolve to headings at `e7a6ca3`: `#what-a-session-survives`, `#overall-layout`, `#rules-that-keep-it-portable`, `#options-for-launching-claude-code`, `#open-decisions`, `roadmap.md#milestones` and their six Korean counterparts. This was executed by the probe with GitHub's slug rule, as `trail/phases/phase-3.md:10` claims.

What matched: `git grep -n DAEMON-ISSUE HEAD -- docs README.md README.ko.md`, `git grep -n -i -e orca -e paseo -e cmux HEAD -- docs` and `git grep -n -e '도장' HEAD -- docs README.md README.ko.md` each print nothing and exit 1 (executed), as `trail/phases/phase-3.md:11` and `:12` claim.

What matched: issue #133 is open in `release: 0.0.3`, and its title and body match `frame/plan.md` item 1. The comments on #61, #55 and #78, posted 2026-11-22, match items 2 to 4 word for word, and each of the three issues keeps the milestone the plan names (executed, `gh issue view`). `pr.md:9` and the plan's *Judgments of the run* row hold.

What matched: the restart dialog the new table cites ("Ends, after the dialog named it") names both live panes and working headless sessions (`apps/desktop/src/renderer/view.ts:320` to `:328`, `apps/desktop/src/renderer/renderer.ts:961`, read). node-pty is pinned at 1.1.0 (`apps/desktop/package.json:24`, read), as the handover row says. The milestone numbers the text gives #133, #61, #55 and #78 match `docs/roadmap.md` *Milestones* and the issues' milestones (read and executed).

What matched: `pr.md` says only what the records say. Each *Done when* row points at a record that holds it, Q5 stands at the default `frame/questions.md:25` and the plan's judgment row give it, and its unproved items are the plan's comment on #61 and Q4. Its defect is where it carries those items, which is finding 6.

What matched: no other section of either edition contradicts the new text beyond finding 5. The `--resume`, `--session-id` and `--continue` rows of *Options for launching Claude Code* (`docs/architecture.md:237`, `:238`), *Measure before building* (`:368`), the fourth row of *Memory design*'s table (`:338`) and the role-session "Original screen" row (`:85`) agree with it (read). One tension stays for #133's own frame and is no finding here. The *Overall layout* bullet at `docs/architecture.md:39` says the app ends the daemon "on the person's confirmation", while the new rule at `:53` has the app replace an idle daemon "without a question". The new section scopes that rule to when #133 builds it, and #133's *Done when* names only *What a session survives* for its documents. So #133's frame owes the bullet its change.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at HEAD, the document arm of `seal/config.json`'s `Broad gate` included; the round ran only the counts and searches above, and the suite is `unverified` | `seal/config.json` | the orchestrator's broad run |
| Whether a pseudo-terminal's descriptor can be handed to a daemon that the stopping daemon did not start, as the handover way would need | `docs/architecture.md:62` | whoever weighs the *Open decisions* row at `docs/architecture.md:393` |
| Q1 to Q4 of `frame/questions.md`, measurements that need a real `claude` or a package | `seal/threads/1795339000-sessions-outlive-the-daemon/frame/questions.md:21` | as each row's `Who can answer` cell names: issue #61's first real session, issue #78's work |
| The research rows of `frame/design.md` *What the research says*, which cite files in the main clone that are not in this tree | `seal/threads/1795339000-sessions-outlive-the-daemon/frame/design.md:65` | the sealer, reading against issue #36 |

## Probes

| Command | Result |
|---|---|
| `python3 -I <scratchpad>/1795339000-sessions-outlive-the-daemon/round-1/test_tmp_edits.py <the branch worktree>` | Each of the 8 edit blocks occurs once at HEAD and never at the base. Base plus the four edits at their anchors equals HEAD for both editions. Heading lines are 27 and 27, table lines 122 and 122. All 12 links resolve. Exit 0 |
| `git grep -n DAEMON-ISSUE HEAD -- docs README.md README.ko.md`; the same for `orca`, `paseo`, `cmux` over `docs`, and for `도장` | Nothing printed, exit 1 for each |
| `gh issue view 36`, `133`, `61`, `55`, `78` with `--json` | #36 open in `release: 0.0.2`; #133 open in `release: 0.0.3`; the study's comments on #61, #55 and #78 present and equal to the plan's blocks |
