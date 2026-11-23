# Review round 1: 1795388701-agent-choices-and-behind

```seal
target: ce11750 against release/v0.0.2
```

A finding round over the whole branch, `41e8aa4..ce11750`, where `41e8aa4` is the merge base with `release/v0.0.2`. No earlier round exists, so no fact is carried: every coordinate below was opened in this round. The work item's records were read whole at `ce11750`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md` and the three phase records. `Commit and pull request language` is English, so no `pr.<lang>.md` is owed, and none stands. The repository declares no `seal/parity.json`, so no parity comparison is owed.

## Findings

### 1. No case holds that the card draws "More than one may be chosen." under a question that takes more than one choice

```seal
severity: should
location: `apps/desktop/src/renderer/shared.ts:290`, `apps/desktop/test/notification-click.test.ts:159-202`
evidence: executed `git grep -n -e 'More than one may be chosen' -e '"hint"' -e '\.hint' -- apps/desktop/test`, which printed `apps/desktop/test/view.test.ts:3018` alone; read `apps/desktop/test/notification-click.test.ts:173`, `apps/desktop/test/notification-click.test.ts:188-202`, `apps/desktop/src/renderer/shared.ts:278-292`
```

Why it matters: `frame/design.md` *Scope* item 8 states that the words "More than one may be chosen." stand under a question that takes more than one choice. The diff draws them at `apps/desktop/src/renderer/shared.ts:290`, `if (note) element.append(part("hint", note));`, and no case holds that line. `trail/phases/phase-1.md:9` claims that the words are pinned by a case in the `stateSays` block of `apps/desktop/test/view.test.ts`, "because a sentence the window shows is pinned by a case (contract rule 14), and `detail` is drawn only in the built app". That case, `apps/desktop/test/view.test.ts:3017-3020`, pins what `view.ts#choiceNote` returns. It does not pin that the card draws it. The one case that draws the card, `apps/desktop/test/notification-click.test.ts:159`, feeds a single question with `multiSelect: false` (line 173). Its `card` reader (lines 189-201) reads the head, the `.asks`, the choices, the lists and the controls, and no `.hint`. The search above found no other test that reads the words or the class. So a change that deletes line 290, or draws the note under every question, passes every case. Phase 1's `seal mutate` over `shared.ts` ran two mutants, and neither touched this line (`trail/phases/phase-1.md:25`). This is the *Regression test* row of `skills/code-review/SKILL.md`: a behaviour the diff adds, stated by a *Scope* item, that no case holds.

The fix gives the built-app case a second question that takes more than one choice, and reads the words under each question. This reaches the case's title (line 159), the `card` docstring (line 188), the `until` on the line's text, and `drawn`. Scenario 11 of `frame/design.md` (line 83) says the case feeds "the question tool's `PreToolUse` with two choices" and reads "a list of two items". The fix pass owes that sentence too, and the snippet does not cover it. By contract rule 15, show the case red with line 290 of `shared.ts` removed before it is committed.

```ts
  it("says the question an agent asks and its choices on the inbox's line, and lists the choices in the preview's card and in the view's, with the words under a question that takes more than one, and no button and no field", async () => {
    // ... unchanged down to the feed ...
    feed("PreToolUse", {
      tool_name: "AskUserQuestion",
      tool_input: {
        questions: [
          {
            question: "Which library formats the dates?",
            header: "Dates",
            multiSelect: false,
            options: [
              { label: "date-fns", description: "Small functions, one import each." },
              { label: "dayjs", description: "One object, with plugins." },
            ],
          },
          { question: "Which checks run before a commit?", header: "Checks", multiSelect: true, options: [{ label: "Lint", description: "" }, { label: "Types", description: "tsc --noEmit" }] },
        ],
      },
    });
    await app.click("#nav-inbox");
    const line = `#inbox-screen button.line[data-work-item="${alpha}"]`;
    await app.until(`document.querySelector(${JSON.stringify(`${line} .second .says`)})?.textContent === "Which library formats the dates? date-fns · dayjs (and 1 more question)"`, "Alpha's line saying the question and its choices");
    // ... unchanged ...

    /** The card of what the agent says, under `selector`: its head, its questions, the words under each question or null where it has none, the label and what each choice leads to, how many numbered lists it holds, and how many buttons and fields. */
    const card = (selector: string) =>
      app.evaluate<{ head: string; waiting: boolean; asks: string[]; notes: (string | null)[]; choices: [string, string][]; lists: number; controls: number } | null>(`(() => {
        const card = document.querySelector(${JSON.stringify(selector)});
        if (!card) return null;
        return {
          head: card.querySelector("h3").textContent,
          waiting: card.classList.contains("waiting"),
          asks: [...card.querySelectorAll(".asks")].map((asks) => asks.textContent),
          notes: [...card.querySelectorAll(".asked")].map((asked) => asked.querySelector(".hint")?.textContent ?? null),
          choices: [...card.querySelectorAll("ol > li")].map((choice) => [choice.querySelector(".label").textContent, choice.querySelector(".implies").textContent]),
          lists: card.querySelectorAll("ol").length,
          controls: card.querySelectorAll("button, input, textarea, select").length,
        };
      })()`);
    const drawn = {
      head: "Claude Code asks",
      waiting: true,
      asks: ["Which library formats the dates?", "Which checks run before a commit?"],
      notes: [null, "More than one may be chosen."],
      choices: [["date-fns", "Small functions, one import each."], ["dayjs", "One object, with plugins."], ["Lint", ""], ["Types", "tsc --noEmit"]],
      lists: 2,
      controls: 0,
    };
    // ... unchanged ...
  });
```

### 2. The rule change for the card's form leaves out the words under a question that takes more than one choice

```seal
severity: should
location: `seal/threads/1795388701-agent-choices-and-behind/frame/design.md:164`, `seal/threads/1795388701-agent-choices-and-behind/frame/design.md:169`
evidence: read `seal/threads/1795388701-agent-choices-and-behind/frame/design.md:16`, `seal/threads/1795388701-agent-choices-and-behind/frame/design.md:164`, `seal/threads/1795388701-agent-choices-and-behind/frame/design.md:169`, `docs/design.md:18`, `apps/desktop/src/renderer/shared.ts:290`, `apps/desktop/src/renderer/index.html:88`
```

Why it matters: `docs/design.md:18`, *Principles* 8, says every form is stated in *Components and their states*, and a change that needs a form the document does not state adds it there first. `frame/design.md:16` holds this work to that clause: "The form of the choices is stated in *Components and their states*, through *Rule changes*". The two `change` operations at `frame/design.md:164` and `frame/design.md:169` state the numbered list, the label in `--ink-strong`, what a choice leads to in `--ink-muted`, and the absence of a button and a field. They say nothing of the words "More than one may be chosen.". The window draws those words with the class `hint` (`apps/desktop/src/renderer/shared.ts:290`), which is `--size-caption` and `--ink-faint` (`apps/desktop/src/renderer/index.html:88`). The settle writes `docs/design.md` from these two `to` texts, so after the settle the policy states no form for a part the window draws. The next work item that changes the card cannot find it there. The contrast of `--ink-faint` on `--said-ground` is already held by `apps/desktop/test/themes.test.ts:207` and `apps/desktop/test/themes.test.ts:221`, so the form below adds no pair to that case.

The fix adds the form to both `to` texts. Where the fix pass judges `--ink-muted` the better ink for these words, it changes `shared.ts:290` and the two texts together.

```text
  to: A question's grounds and what an option implies are in `--ink-muted`. The choices an agent offers with its question stand under the question as a numbered list, each choice's label in `--ink-strong` and what it leads to in `--ink-muted`. Under a question that takes more than one choice stand the words "More than one may be chosen.", in `--size-caption` and `--ink-faint`. No choice is a button and the card holds no field, since the person answers in the agent's pane.
```

```text
  to: 질문의 근거와 선택지가 뜻하는 바는 `--ink-muted`입니다. 에이전트가 질문과 함께 내놓은 선택지는 질문 아래에 번호를 붙인 목록으로 놓이고, 선택지의 이름은 `--ink-strong`, 그것을 고르면 어떻게 되는지는 `--ink-muted`입니다. 여러 개를 고를 수 있는 질문 아래에는 "More than one may be chosen."이라는 말이 `--size-caption`과 `--ink-faint`로 놓입니다. 사람은 에이전트의 칸에서 답하므로, 어느 선택지도 단추가 아니고 카드에는 입력 칸이 없습니다.
```

### 3. The pull request body and two frame sentences say the tool's name and the payload's field names stand in the reader alone, and the tree names them elsewhere

```seal
severity: should
location: `seal/threads/1795388701-agent-choices-and-behind/pr.md:9`, `seal/threads/1795388701-agent-choices-and-behind/frame/design.md:12`, `seal/threads/1795388701-agent-choices-and-behind/frame/design.md:84`
evidence: executed `git grep -n -e 'AskUserQuestion' -e 'tool_name' -e 'tool_input' -e 'multiSelect' -- apps/desktop/src`, which printed `apps/desktop/src/daemon/adapters/claude.ts:94`, `apps/desktop/src/daemon/adapters/claude.ts:221` and `apps/desktop/src/daemon/daemon.ts:290` beside the lines of `apps/desktop/src/daemon/agent-events.ts`; read `seal/threads/1795388701-agent-choices-and-behind/frame/design.md:108`, `seal/threads/1795388701-agent-choices-and-behind/trail/phases/phase-1.md:5`, `seal/threads/1795388701-agent-choices-and-behind/gaps.md:18`
```

Why it matters: `pr.md:9` tells the reader of the pull request that "the tool's name and the payload's field names stand in the daemon's reader alone". `frame/design.md:84`, scenario 12, states the same Then, and `frame/design.md:12` says "The tool's name and the payload's field names stay in `apps/desktop/src/daemon/agent-events.ts`". The tree contradicts all three. `apps/desktop/src/daemon/adapters/claude.ts:94` names `AskUserQuestion` in `--disallowedTools`. `apps/desktop/src/daemon/adapters/claude.ts:221` and `apps/desktop/src/daemon/daemon.ts:290` read `tool_name`. Phase 1 found this (`trail/phases/phase-1.md:5`), and `gaps.md:18` names the reading in `daemon.ts`. The fold at `020acbd` rewrote `frame/design.md:108` to name both readings, and left lines 12 and 84 stating the old fact. `ce11750` then copied line 84's sentence into `pr.md`. A reader of the body who opens the tree finds the tool's name in two files outside the reader and asks which statement holds. What the work owes does hold: no file of `src/shared`, `src/renderer` or `src/main` names either (scenario 12's search, under *Confirmations*). The three sentences should say that, and only that.

The fold's census was a sample: it corrected the sentence the hand-back named and did not search the frame and the body for the other statements of the same fact (contract rule 19). The fix pass runs `git grep -n -e "reader alone" -e "stay in \`apps/desktop/src/daemon/agent-events.ts\`" -- seal/threads/1795388701-agent-choices-and-behind` for other statements before it closes this. `pr.md` is the orchestrator's to rewrite, and the body `seal pr-body` composes follows it.

```text
pr.md:9, the cell after "No new protocol field names a vendor":
| No new protocol field names a vendor | The two new fields are `stateQuestions` and `behindBase`. The question tool's name and its input's field names stand in the daemon alone, and neither the protocol nor the window names them |

frame/design.md:12, the second cell:
The protocol carries the shapes the daemon's reader produces. The question tool's name and its input's field names stand in the daemon alone: `apps/desktop/src/daemon/agent-events.ts` reads them, beside the map of that agent's events. The two readings of a tool's name that stood before this work stay, as *Data & interfaces* names them

frame/design.md:84, the Then of scenario 12:
Given the built tree, then the question tool's name and its input's field names stand in the daemon alone, and no file of `src/shared`, `src/renderer` or `src/main` names either
```

## Confirmations

What matched: scenario 12 holds. `executed`: `git grep -n 'AskUserQuestion\|tool_input\|tool_name' -- apps/desktop/src/shared apps/desktop/src/renderer apps/desktop/src/main` printed nothing and exited 1. The names the diff adds to the protocol, `stateQuestions`, `behindBase` and `AskedQuestion` (`apps/desktop/src/shared/protocol.ts:263-335`), name no vendor (`read`).

What matched: `frame/design.md` *Removes* holds. `executed`: `git grep -n -w 'aheadOf' -- apps/desktop` printed nothing and exited 1, as `trail/phases/phase-2.md:15` claims. The `Notification` of "Fix the login redirect" is replaced by the question tool's `PreToolUse` at `apps/desktop/test/screenshots.test.ts:67-91` (`read`).

What matched: the reader, `apps/desktop/src/daemon/agent-events.ts:34-69`, does what *Scope* item 2 states. It reads `PreToolUse` and `PermissionRequest` of `AskUserQuestion` alone, keeps a question whose text has something to read and an option whose label does, reads a description that is no text as empty, reads `multiple` true only for `true`, keeps 8 of each after the ones without text are left out, and gives the first question as the text (`read`). Phase 1 claimed that the 8 are counted after an entry without text is left out (`trail/phases/phase-1.md:11`), and `agent-events.ts:46` does that with `flatMap` before `slice`.

What matched: *Scope* item 3. `apps/desktop/src/daemon/daemon.ts:293-301` computes the state with whether the event asks, returns before any write where the state stays, and cuts each question, label and implies with `cutText` (`read`). The case at `apps/desktop/test/daemon.test.ts:2888-2915` holds the wait from the `PreToolUse`, the `PermissionRequest` and `Notification` that change nothing, and the `PostToolUse` that clears the questions (`read`). A question asked while the session already waits does not show, which is what *Scope* item 3 states and `trail/phases/phase-1.md:15` names.

What matched: *Scope* items 4 and 5. `apps/desktop/src/daemon/worktrees.ts:622-632` runs `git rev-list --left-right --count <base>...<head> --` and reads the base's side first, as `frame/design.md:31` measured. `apps/desktop/src/daemon/daemon.ts:1797-1802` reads the counts after the `await` and compares both, so a base that moved sends an `inbox`, and `daemon.ts:1589-1590` sends `behindBase` as `null` exactly where `aheadOfBase` is (`read`).

What matched: the window. `apps/desktop/src/renderer/view.ts:1018-1026` keeps the order of *Scope* item 7: a parked question, then a headless call, then the agent's question, then the state's text. `apps/desktop/src/renderer/view.ts:1060-1066` says behind only beside a base branch and reads an absent field as `null`. `apps/desktop/src/renderer/shared.ts:278-292` draws each text with `textContent` through `part`, so no agent's text reaches the page as markup (`read`).

What matched: the four committed screenshots were each opened. Each shows the card "Claude Code asks" with the question and a numbered list of two choices, each label above what it leads to in the muted ink, with no button and no field, in the inbox's preview and the view's right column, in Night watch dark and light. The facts say "2 commits ahead of main, 0 behind" and "main · 2 ahead · 0 behind". The inbox line of "Fix the login redirect" says "Asks to use Bash: pnpm test -- redirect.test.ts", as `trail/phases/phase-3.md:12` states and *Scope* item 7's order gives. `pr.md:17-20` links them at `19f32f8`, and `git diff --stat 19f32f8 HEAD` over `screenshots/` printed nothing (`executed`).

What matched: `pr.md:7-9` quotes the three *Done when* lines of issue #27 word for word (`executed`: `gh issue view 27 --json title,body,state`). `changelog.md:8` says the status line names a daemon of another build, and `apps/desktop/src/renderer/shared.ts:22` holds that notice (`read`).

What matched: the suite's label is honest. `gaps.md:9`, `gaps.md:12` and `gaps.md:13` label the full suite and the repository-wide typecheck at each phase `unverified` and name the orchestrator's broad gate. `gaps.md` is new in this diff, so no row left it.

What matched: the new cases each cover something their group did not. The cases at `apps/desktop/test/last-look.test.ts:287-309` read an earlier look's absent field, which the case at `apps/desktop/test/last-look.test.ts:128-136`, a file that holds every field, does not. No new case holds no fact the frame states. No test file declares `TARGET` (`executed`: `git grep -l TARGET -- apps/desktop/test` printed nothing).

## Not judged

| What | Location | Who answers |
|---|---|---|
| Which events a real interactive Claude Code sends around a call of `AskUserQuestion`, in which order, and whether its dialog numbers the choices in the payload's order (`frame/questions.md` Q1). Every case feeds the shape the frame read | `apps/desktop/src/daemon/agent-events.ts:34` | the owner's hand run at the built app with `OWLERY_DEBUG_HOOKS=1`, as Q1 states it |
| Whether the card of questions wants a bound on its height. The text it replaces is held to `--said-height` by `.said` (`apps/desktop/src/renderer/index.html:157`), and `.asked` has no bound, so up to 8 questions of 8 choices, each text up to 2000 characters, push the rest of the preview down. The CLI's own limits of `frame/design.md:24` keep a real call smaller. This is a question, not a pass | `apps/desktop/src/renderer/index.html:159` | the sealer, reading the screenshots against `docs/design.md` *Components and their states*; the owner at the Q1 run, which sees a real call |
| `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/notification-click.test.ts` were not run by this round. The first is long on this loaded machine, and the second starts the built app, which no finding here needs | `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/notification-click.test.ts` | the orchestrator's broad gate |
| The full suite and the repository-wide typecheck at `ce11750` | the whole tree | the orchestrator's broad gate, then the sealer's spawn |
| The phases' `seen red` and `seal mutate` claims were read and not re-run | `trail/phases/phase-1.md:17-25`, `trail/phases/phase-2.md:17-24` | the sealer, where it weighs them |

## Probes

| Command | Result |
|---|---|
| `node scripts/test-in-electron.mjs test/agent-events.test.ts test/agent-state.test.ts test/last-look.test.ts test/view.test.ts test/worktrees.test.ts`, in `apps/desktop` through the orchestrator's lock, on a clean tree at `ce11750` | 5 files and 539 cases passed, exit 0. No app was started |
| `git grep -n 'AskUserQuestion\|tool_input\|tool_name' -- apps/desktop/src/shared apps/desktop/src/renderer apps/desktop/src/main` | nothing printed, exit 1 |
| `git grep -n -w 'aheadOf' -- apps/desktop` | nothing printed, exit 1 |
| `git grep -n -e 'AskUserQuestion' -e 'tool_name' -e 'tool_input' -e 'multiSelect' -- apps/desktop/src` | lines of `agent-events.ts`, and `adapters/claude.ts:94`, `adapters/claude.ts:221`, `daemon.ts:290` |
| `git grep -n -e 'More than one may be chosen' -e '"hint"' -e '\.hint' -- apps/desktop/test` | `apps/desktop/test/view.test.ts:3018` alone |
| `git grep -l TARGET -- apps/desktop/test` | nothing printed |
| `gh issue view 27 --json title,body,state` | the issue, open, whose *Done when* holds the three lines `pr.md:7-9` quotes |
