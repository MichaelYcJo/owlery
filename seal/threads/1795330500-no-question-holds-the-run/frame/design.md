# Design: under `agentic`, no question holds the run

The ticket is issue #119. A person who hands several work items over and leaves found the run stopped by a question asked in the middle, and found nowhere the decisions the orchestrator made in place of asking. The issue asks that under the routing answer `agentic` the questions are asked once, that a later question parks the one work item it belongs to while the others go on, and that each decision made in place of asking shows in the inbox with its grounds.

This work builds the part of that which stands on today's tree: the rule in the policy documents, the daemon's record of the decisions and of the questions a work item is parked with, and their place on the inbox line, in the work item's view and in the summary. The daemon runs no stage and no orchestrator session today, so the callers that park a work item and record a decision are named for the issues that build them (*Scope* item 16).

## Grounding

The tree as read at `bc80b89`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/product.md` *What we promise* | A person answers the questions once and walks away, and the stages then run without the person. The section does not say what happens to a question that arises later, or to a request of several work items. This work states it |
| `docs/product.md` *Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call* | Each work item shows its state on one line, and a person who comes back first sees "two sealed, one waiting for an answer". A summary shows what changed since the last look. So a parked work item is a line that waits for the person, and the decisions are counted in the summary |
| `docs/architecture.md` *Code runs the order, the orchestrator judges* | The daemon's code runs the order, and "Batching everything to ask the person into one set" is a judgment left to the orchestrator agent. So the park is the daemon's code, and what to ask, what to decide and whether to park are the orchestrator's judgments |
| `docs/architecture.md` *State lives in three places* | The daemon holds "Progress, session events and output, the cost ledger, questions and answers, schedule", and the user's repository holds all work records. So the questions a work item is parked with and their answers are the daemon's state, and so is the list of decisions the inbox shows |
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the rows "Asking the person" and "Running several work items together" | Asking is the app's question screen, and the daemon sets the order of several work items. Owlery can park one work item and go on with the others, which the plugin's one session cannot |
| `docs/architecture.md` *What we take from AgenticSeal* and *Taking in AgenticSeal's changes* | Owlery takes the process from AgenticSeal and carries a release's change over by choice. This work carries over the rule of AgenticSeal 0.38.4 named below |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 2, and *The phone: the terminal session as a chat* | Nothing a vendor names passes over the protocol, and no state lives on the UI side. So a decision and a question are neutral shapes the daemon holds and sends whole |
| `docs/architecture.md` *Overall layout*, the bullet "Agent state is judged from events, never guessed from what the terminal screen prints" | A park and a decision reach the daemon as calls of its own code, never as a reading of what a session printed |
| `docs/roadmap.md` *Milestones*, rows 2 and 3 | Milestone 2 runs the review rounds, the gate and the sealer on a branch that exists. Picking an issue, the depth judgment and the question batch on the question screen are milestone 3. So a request of several work items and its batch have no code to stand on in release 0.0.2 |

The facts below were read or run for this frame. Each line number is at `bc80b89`.

| Fact | How it was established |
|---|---|
| Issue #119 has no comment, and its body is the one this frame reads | `executed`: `gh issue view 119 --json title,body,comments,milestone`. The spawn carried no line on the issue's comments |
| The rule the issue ports is AgenticSeal 0.38.4's: one batch for a request that names several issues, before the first edit of its first work item; an issue's line that leaves a decision to a person is checked against the policy root, `seal/config.json`, the code and the earlier work items' records, and its answer is written into `routing.md` *Why this way* | `read`: `skills/implement/orchestration.md` *Orchestrator: what needs a person is asked in one batch, before the first edit*, `skills/core/SKILL.md` *The first value*, `skills/implement/SKILL.md` *1. Read the documents that outrank the code first*, and `skills/implement/routing-question.md` *Orchestrator: the two language keys*, in the installed copy under `~/.claude/plugins/cache/agenticseal/agentic/0.38.4` |
| `agentic` is the plugin's first answer to its routing question: the orchestrator chooses each work item's route and writes each choice down with its grounds. Owlery's policy documents do not use the word as a routing answer | `read`: `skills/implement/routing-question.md` *Question 1, the mode*. `executed`: `git grep -n -i -E 'agentic\|no question holds' bc80b89 -- docs README.md README.ko.md`, whose lines all name AgenticSeal |
| Nothing in the daemon or the window records a decision, holds a question or parks a work item | `executed`: `git grep -n -i -E 'parked\|decision\|question' bc80b89 -- apps/desktop/src`. It prints eight lines: comments on a CLI's first questions and on a terminal's questions, and the label "Answer the first question" of `apps/desktop/src/renderer/view.ts#summaryControls` |
| What stands closest today is a pane's state `waiting`: a Claude Code pane that asks for a permission or sends a notification is listed as waiting, with its text, and no other pane is held by it | `read`: `apps/desktop/src/shared/protocol.ts` (`AgentState` line 20, `SessionInfo` lines 176 to 190), `apps/desktop/src/renderer/view.ts#inboxLine` (line 73) |
| The daemon runs no stage, no orchestrator session and no request of several work items. Its one session without a terminal is the headless session an `ask` starts, which answers one prompt | `read`: `apps/desktop/src/daemon/daemon.ts` (the `ask` case at line 667, `startHeadless` at line 866), `apps/desktop/src/daemon/adapters/adapter.ts` |
| A work item holds no issue: it is a branch and a worktree of a repository | `read`: `apps/desktop/src/shared/protocol.ts#WorkItem` (lines 136 to 174). Issue #50, in release 0.0.3, starts a work item from a GitHub issue |
| The daemon keeps each kind of its state in a file of its own in the run folder: `repositories.json`, `last-look.json`, `keep-awake.json` | `read`: `apps/desktop/src/daemon/repositories.ts`, `last-look.ts`, `main.ts` (lines 22 to 24) |
| A look's file whose work items lack a field of the protocol's is read as no look, except for the fields that came with the repositories | `read`: `apps/desktop/src/daemon/last-look.ts` (`SinceRepositories` at line 41, `isWorkItem`, `lookOf`) |
| A case pins the names of a work item's fields | `read`: `apps/desktop/test/daemon.test.ts`, `WORK_ITEM_FIELDS` at line 25 and the case at line 452 |
| The summary screen exists: `changesSince` lists the work items whose line differs from the look's, and `summarySentence` counts them by state | `read`: `apps/desktop/src/renderer/view.ts` (lines 498 to 577), `apps/desktop/src/renderer/summary.ts` |
| The window raises a notification from a session's change of state alone | `read`: `apps/desktop/src/renderer/view.ts#notificationFor` (line 1394), `apps/desktop/src/renderer/renderer.ts` line 1045 |
| The built app's run folder is made inside `BuiltApp.start`, so a case cannot write into it before the app starts | `read`: `apps/desktop/test/built-app.ts` (lines 144 to 200), `apps/desktop/src/main/main.ts` lines 35 and 36 |
| The policy root has no index `docs/README.md`, and no `seal/follow-up.md` stands | `executed`: `ls docs` and `ls seal` in the worktree |
| The latest release's note holds no `### Process changes` table, and no changelog fragment under `seal/threads/` holds one | `executed`: `gh release view --json body --jq .body` piped to `grep -c 'Process changes'` printed 0, and `grep -rn 'Process changes' seal/threads/*/changelog.md` printed nothing |
| No work item on `release/v0.0.2` holds a `frame/design.md`, so no unsettled rule change stands on the branch. The frame of #38 on its own branch names sections of `docs/architecture.md` this design does not name | `executed`: `ls seal/threads/*`. `read`: `seal/threads/1795329620-role-bundle/frame/design.md` *Rule changes* at `106ff48` in the worktree of #38 |
| Each text a `from` of *Rule changes* quotes stands in its document | `executed`: `grep -n` of each quoted text in `docs/architecture.md` and `docs/architecture.ko.md`, which printed lines 148, 163 and 192 of each |
| The plugin's reader reads *Rule changes* of this design whole: it refuses no line and names none as unread, and it applies each operation to its document without an error. Where each operation lands was not printed (`frame/questions.md` Q4) | `executed`: `python3 -I test_tmp_rule_changes.py` in the framer's scratch directory, once, which calls `parse` and `apply_op` of `skills/settle/scripts/rule_changes.py` of AgenticSeal 0.38.4 on this file and on the documents of `docs/` at `bc80b89`, and writes nothing |
| The broad gate compares, for each document of `docs/` and its Korean edition, the count of headings and the count of table rows | `read`: `seal/config.json`, the key `Broad gate` |

No check of the repository's was run for this frame: no test, no linter, no typecheck and no `seal gate`.

## Scope

**In.** Items 1 to 5 are the decisions, items 6 to 11 the park, items 12 to 15 what both share. The exact shapes are in *Data & interfaces*.

1. **A decision is a neutral record the daemon keeps for one work item.** It holds a kind, what was decided, its grounds, the time, and the reversal where a person reversed it. The kinds are the ones the issue names: a route, a default taken, a scope chosen, and a question the tree answered. The grounds are prose and carry the coordinate the decision stands on.
2. **The daemon keeps the decisions in `decisions.json` in its run folder.** The file is written whole at each change and read at the daemon's start, as `last-look.json` is. A decision's id is given once over the whole file and never again. A file that is not the store's is read as no decision.
3. **`Daemon#decided` records a decision and tells every client.** It is a method of the daemon's own code, as `Daemon#agentEvent` is. It returns at once, changes nothing of any session and of any other work item, raises no notification, and sends an `inbox`. It refuses a work item the daemon does not keep, a kind that is no `DecisionKind`, and an empty `says` or `grounds`, and then records nothing and sends nothing.
4. **A person reverses a decision with a message.** The client message `reverseDecision` names the work item, the decision and the message. The daemon keeps the message and the time on the decision and answers `done`. It answers `error`, and changes nothing, for an empty message, for a decision the work item does not hold, and for a decision already reversed. The decision stays listed, as reversed.
5. **The inbox shows the decisions on their work item, and the work item's view lists them.** A line says how many decisions stand, a standing one being one not reversed. The preview and the view list every decision under the head "Decided without asking", the newest first, each with its kind, what was decided, its grounds, its age, and its reversal where it has one. In the view each standing decision has a control "Reverse" that opens a field for the message and sends `reverseDecision`. No decision changes a line's state or its group.
6. **The questions a work item is parked with are a neutral record the daemon keeps.** The record holds who asked, the time, the questions, and the time of the answer. A question holds its text, its options, each with what it implies, the option that is its default where it has one, and the person's answer. A work item is parked while its record holds no answer time.
7. **The daemon keeps the records in `asked.json` in its run folder**, under the rules of item 2.
8. **`Daemon#park` parks one work item with its questions and tells every client.** It is a method of the daemon's own code. It returns at once and sends an `inbox`. It starts nothing, stops nothing and refuses nothing in any work item, the parked one among them: a pane and an `ask` in a parked work item are served as before. It refuses a work item the daemon does not keep, an archived one, one that is already parked, a call with no question, a question with an empty text, and a default that names no option of its question, and then records nothing.
9. **A person's answer in the app ends the park.** The client message `answerQuestions` carries one answer for each question of the record. An answer is an option's label or the person's own words, stored as typed without the white space at its ends. The daemon stores the answers and the time and answers `done`. It answers `error`, and changes nothing, where the work item is not parked, where a question of the record has no answer in the message, where the message answers a question the record does not hold, and for an empty answer. The record stays on the work item, answered, until the next park replaces it, so the stage that goes on reads the answers there.
10. **A parked work item's line waits for the person and says its question.** Its state is `waiting`, whatever its panes say, so it stands in the inbox's first group, is counted in "waiting for you", and is what the summary's main control opens. Its second row says the first question's text, followed by " (and 1 more question)" or " (and N more questions)" where the record holds more. Its age is the time since the park. Once answered, the line is read from the work item's panes as before.
11. **The view of a parked work item holds the questions and takes the answers, and the window raises a notification at a park.** Under the head "Waiting for your answer" the view names who asked and shows every question at once, each with its options, what each implies, and a field for another answer. A question's default is chosen when the view opens. "Send answers" sends `answerQuestions`, and every control is reached by the keyboard. After the answer the section's head is "Answered", and it lists each question with its answer. The notification is titled with the work item's title and says "Waiting for your answer". None is raised for a muted work item, for the work item whose view is in front, or for a work item the window already held as parked.
12. **A work item carries both over the protocol.** `WorkItem` gains `decisions` and `asked`. A client reads a work item without them, as a daemon of an earlier build sends it, as one with no decision and no record.
13. **A look holds both, and a look written before them is still a look.** `lookOf` copies `decisions` and `asked`. A look's file whose work items lack them is read with no decision and no record on each, as the fields that came with the repositories are read.
14. **The summary counts the decisions apart from the work items that wait.** A work item is changed since the look where it holds a decision the look does not hold for it, by the decision's id, and where its line's state differs, which a park and an answer both change. Its line in the summary adds "1 decision made without asking." or "N decisions made without asking." for the decisions the look does not hold. The summary's sentence keeps its count by state and adds, after a full stop, "1 decision made without asking." or "N decisions made without asking.", the sum over the changed work items, where the sum is above zero.
15. **A work item's decisions and its record go when the work item is deleted, and stay when it is archived.** A delete and the removal of a repository take them out of `decisions.json` and `asked.json`. An archived work item is listed under `archived` with them.

**Out, each with its home.**

16. **Who calls `Daemon#park` and `Daemon#decided`.** No code of this work calls either but its cases.
    - A role session that ends asking the person, a sealer's `undecided` verdict among them, parks its work item: #42 for the sealer and #41 for the rounds and the fix passes. Each reads its role's result, which neither has designed yet, and calls `Daemon#park`.
    - The answer resumes the chain: #41 and #42 start the next stage where the record of item 9 is answered, and hand it the answers.
    - The judgment whether the rounds are converging is recorded: #41 calls `Daemon#decided` with it.
    - A reversal reaches the work item's next stage as a message: #41 hands each reversal of item 4 to the stage it starts next.
17. **The batch of a request that hands over several work items, and the check of an issue's question against the tree.** Both are an orchestrator session's judgments before the first edit, and both need the picking of an issue and the question screen, which are milestone 3: #50, #51 and #53. This work states the rule (*Rule changes*) and builds the outlets that rule names for a later work item of a request: `Daemon#decided` for a default taken and for a question the tree answered, `Daemon#park` for a stop.
18. **The question on the work item's issue.** A work item holds no issue until #50, and the daemon posts nothing to GitHub until #43.
19. **The question screen.** #53 builds the screen for the batch: every question of a work item at once, shaped for a phone. The section of item 11 is the place a parked work item's questions are answered until then, and #53 may put its screen there.
20. **The summary's counts of sealed and broken work items** stay #22's.

**Where each line of the issue's *Done when* lands.** The lines are numbered in the issue's order.

| Line | Lands |
|---|---|
| 1, the policy documents state the rule in both languages | *Rule changes*. The rule is in force from this work's merge, and the settle of release 0.0.2 writes it into `docs/` |
| 2, a role session that ends asking parks its work item, and the answer resumes it | The park, the question on the inbox line and the answer in the app: items 6 to 11. The role session that asks and the resume: item 16. The issue: item 18 |
| 3, one batch for a request of several work items | The rule: *Rule changes*. The outlets for a later work item: items 3 and 8. The batch itself: item 17 |
| 4, a question from an issue's text is checked against the tree | The rule: *Rule changes*. Where the answer is written for the person: item 3, the kind `answered`. The check itself: item 17 |
| 5, every decision shows in the inbox with its grounds, and a person reverses one | Items 1 to 5. The reversal's way to the next stage: item 16 |
| 6, the summary counts decisions apart | Item 14 |

## User scenarios & acceptance *(mandatory)*

Each scenario is a case or a set of cases. A case of the daemon drives a `Daemon` built with the fake adapter and a run folder of its own, and reads what a client receives. A case of the window's words reads a function of `apps/desktop/src/renderer/view.ts`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. A decision shows with its work item and holds nothing | Given work items A and B, B with a live pane and a headless session that is working. When `Daemon#decided` records a default for A. Then every client receives an `inbox` in which A holds the decision with an id, the daemon's time and no reversal, and B holds none. No session changed its state, and B's headless session reaches `finished` | Cases in `apps/desktop/test/daemon.test.ts` |
| 2. A decision that cannot be recorded changes nothing | When `Daemon#decided` names a work item the daemon does not keep, a kind that is no `DecisionKind`, or an empty `says` or `grounds`. Then it returns nothing, the file is not written and no `inbox` is sent | A case in `apps/desktop/test/daemon.test.ts` |
| 3. The decisions outlive the daemon | Given a run folder in which a daemon recorded two decisions and a person reversed one. When a second daemon starts on the folder. Then its `ready` lists both as they stood, and the next decision's id is above both. A `decisions.json` that is no JSON, or of another shape, gives no decision and is replaced at the next record | Cases in a new `apps/desktop/test/decisions.test.ts`, and one in `apps/desktop/test/daemon.test.ts` |
| 4. A person reverses a decision | Given a decision on A. When a client sends `reverseDecision` with the message "기본값 말고 main에서 시작해 주세요". Then the client receives `done`, and the `inbox` after it holds the decision with the time and the message as typed. A second `reverseDecision` of it, one that names a decision of B under A, one whose decision does not exist, and one with a message of white space each receive an `error`, and no `inbox` follows | Cases in `apps/desktop/test/daemon.test.ts` |
| 5. A park holds one work item and nothing else | Given A, and B with a headless session that is working behind a fake adapter that delays. When `Daemon#park` parks A with two questions. Then the `inbox` holds A's record with no answer time, and B holds none. While A is parked, B's headless session reaches `finished`, a `start` in B and a `start` in A each open a pane, an `ask` in A is answered with `asked`, and a `createWorkItem` creates a third work item. `Daemon#park` returned before any of them | Cases in `apps/desktop/test/daemon.test.ts` |
| 6. A park that cannot stand changes nothing | When `Daemon#park` names a work item the daemon does not keep, an archived one, or one already parked, or carries no question, a question with an empty text, or a default that names no option. Then it returns nothing, and the record that stood stays as it was | A case in `apps/desktop/test/daemon.test.ts` |
| 7. A person's answer ends the park | Given A parked with two questions. When a client sends `answerQuestions` with the first question's default label and the words "둘 다 아니고, 세 번째 방법으로" for the second. Then the client receives `done`, and the `inbox` holds the record with an answer time and both answers as typed. A message that leaves one question out, one that answers a question the record does not hold, one with an empty answer, and one for a work item that is not parked each receive an `error` and change nothing. After the answer `Daemon#park` parks A again, and the new record replaces the answered one | Cases in `apps/desktop/test/daemon.test.ts` |
| 8. The records outlive the daemon | Given a run folder in which A is parked and B's record is answered. When a second daemon starts on the folder. Then its `ready` lists both records as they stood | Cases in a new `apps/desktop/test/asked.test.ts`, and one in `apps/desktop/test/daemon.test.ts` |
| 9. A delete takes both, and an archive keeps both | Given A with a decision and a park. When A is archived. Then `archived` lists A with both. When A is deleted, or its repository removed. Then neither file holds anything under A's id, and a work item created afterwards holds none | Cases in `apps/desktop/test/daemon.test.ts` |
| 10. The line of a work item with decisions | Given a work item with three decisions, one of them reversed. Then its line's mark reads "2 decisions without asking", and "1 decision without asking" with one standing. With none standing the mark is empty. The line's state and its group are the ones its panes give | Cases in `apps/desktop/test/view.test.ts` |
| 11. The line of a parked work item | Given a parked work item whose live pane says `working`. Then its line's state is `waiting`, its second row is the first question's text with " (and 1 more question)", its age is counted from the park, the inbox's sentence counts it in "waiting for you", and it stands in the group "Waiting for you". Once answered, the line's state is `working` again | Cases in `apps/desktop/test/view.test.ts` |
| 12. The words of the decisions' list and of the questions' section | Given decisions of each kind, one reversed. Then the list's lines read the kind as "Route", "Default taken", "Scope chosen" or "Answered from the tree", then what was decided, the grounds after "Grounds: ", the age, and for the reversed one "Reversed" with its age and the message. Given a parked record, then the section names who asked, and each question's lines hold its options with what each implies and mark the default. Given an answered record, then each question's line holds its answer | Cases in `apps/desktop/test/view.test.ts` |
| 13. The notification at a park | Given the window's lists before and after an `inbox`. Then a work item that is parked now and was not before gives a notification with its title and "Waiting for your answer". A muted one, the one whose view is in front, one that was parked before, and an archived one give none | Cases in `apps/desktop/test/view.test.ts` |
| 14. A look before the fields of this work is a look | Given a `last-look.json` whose work items hold neither `decisions` nor `asked`. When a daemon starts on it. Then `ready` carries the look, each work item with no decision and no record. A look recorded now holds both fields of each work item | Cases in `apps/desktop/test/last-look.test.ts` |
| 15. The summary counts decisions apart | Given a look, and since it: A was parked, B gained two decisions and nothing else, C gained a commit and one decision. Then A, B and C are the changed work items, A first. B's line reads "No agent is running. 2 decisions made without asking.", and C's ends with "1 decision made without asking.". The summary's sentence reads "1 waiting for you. 3 decisions made without asking." where B and C have no state. The main control reads "Answer the first question" and opens A. A decision the look already held adds nothing, whether or not it was reversed since | Cases in `apps/desktop/test/view.test.ts` |
| 16. A window of this build beside a daemon of an earlier build | Given an `inbox` whose work items hold neither field. Then every function of scenarios 10 to 15 reads them as no decision and no record, and none throws | A case in `apps/desktop/test/view.test.ts` |
| 17. The window draws both and sends both messages | Given the built app with a work item that holds a decision and a second that is parked. Then the inbox's lines show the mark and the question, the view of the first lists the decision, and "Reverse" with a typed message leaves the decision reversed in the daemon's file. In the view of the second, the keyboard alone chooses an option, types another answer and sends, and the daemon's file holds both answers | One case that starts the built app, in a new `apps/desktop/test/decisions-and-questions.test.ts`. How the case puts the decision and the park into the app's daemon is `frame/questions.md` Q3 |
| 18. The protocol's fields stay named | The case that pins a work item's fields holds the list with `asked` and `decisions` added, and reads the fields of a decision, a reversal, a record and a question in the same way | The case of `apps/desktop/test/daemon.test.ts` named "carries only the fields the protocol names, none of them a vendor's" |

## Data & interfaces

All in `apps/desktop`. No field names a vendor, a role's model or a record's file format.

**`src/shared/protocol.ts`.**

```ts
/** Why the orchestrator decided without asking: it chose a route, took a default, chose a scope, or found the question answered in the tree. */
export type DecisionKind = "route" | "default" | "scope" | "answered";

/** One decision made for a work item in place of asking the person. */
export interface Decision {
  /** Given once over the daemon's whole store, and never again. */
  id: number;
  kind: DecisionKind;
  /** What was decided, 2000 characters of it at most. */
  says: string;
  /** Why, with the coordinate the decision stands on, 2000 characters at most. */
  grounds: string;
  /** The daemon's clock when it was recorded. */
  at: number;
  /** When a person reversed it and the message they gave, or null while it stands. */
  reversed: { at: number; message: string } | null;
}

/** One question a work item is parked with. */
export interface AskedQuestion {
  /** Its place in the record, from 1. */
  id: number;
  asks: string;
  /** The answers the asker names, each with what it implies. It may be empty. */
  options: { label: string; implies: string }[];
  /** The index in `options` of the answer taken where the person gives none, or null. */
  default: number | null;
  /** The person's answer, an option's label or their own words, or null until they answer. */
  answer: string | null;
}

/** The questions a work item was parked with. The work item is parked while `answeredAt` is null. */
export interface Asked {
  /** Who asked, as a person reads it, such as a role's name. */
  by: string;
  at: number;
  questions: AskedQuestion[];
  answeredAt: number | null;
}
```

- `WorkItem` gains `decisions: Decision[]`, in the order they were recorded, and `asked: Asked | null`.
- `ClientMessage` gains `{ type: "reverseDecision"; requestId: number; workItemId: number; decisionId: number; message: string }` and `{ type: "answerQuestions"; requestId: number; workItemId: number; answers: { questionId: number; answer: string }[] }`. Each is answered with `done` before the `inbox` that carries the change, or with `error`.
- No server message is added. `ready`, `inbox` and `lastLook` carry `decisions` and `asked` with each work item.
- A text is stored without the white space at its ends. `says`, `grounds`, `asks`, a label, an `implies`, a message and an answer are each cut at 2000 characters, as `SessionInfo.stateText` is.

**`src/daemon/decisions.ts`**, new: the store of `decisions.json`, `{ nextId, workItems: Record<number, Decision[]> }`, built as `LastLook` is: given no run folder it keeps memory alone, it writes through `writeWholeFile`, and it holds a change in memory before it writes it.

**`src/daemon/asked.ts`**, new: the store of `asked.json`, `{ workItems: Record<number, Asked> }`, built the same way.

**`src/daemon/daemon.ts`.**

```ts
/** Records a decision made for a work item in place of asking. Returns it, or undefined where it is refused. */
decided(workItemId: number, decision: { kind: DecisionKind; says: string; grounds: string }): Decision | undefined;

/** Parks a work item with questions for the person. Returns the record, or undefined where it is refused. */
park(workItemId: number, asking: { by: string; questions: { asks: string; options?: { label: string; implies: string }[]; default?: number | null }[] }): Asked | undefined;
```

`workItemOf` adds `decisions` and `asked` from the stores. `dropWorkItems` and the removal of a repository take a work item's entries out of the stores. The new cases of `handle` follow `setWorkItem`'s shape. `main.ts` and `DaemonOptions.runDir` name `decisions.json` and `asked.json` among the files the run folder holds.

**`src/daemon/last-look.ts`.** `lookOf` copies `decisions` and `asked`, each entry a copy. `isWorkItem` accepts a work item without either, and one with either of the protocol's type.

**`src/renderer/view.ts`**, the functions the window's words come from. `inboxLine` gives the state of *Scope* item 10, `lineText` gains the question as a source that comes first, and `changesSince`, `summarySentence` and `summaryHead` take item 14. New functions, named by the builder, give the mark of scenario 10, the lines of scenario 12 and the notification of scenario 13. `src/renderer/list.ts`, `shared.ts`, `work-item-view.ts`, `summary.ts`, `renderer.ts` and `index.html` draw them.

**A window beside a daemon of another build.** A daemon of an earlier build sends neither field, and answers each new message with nothing or with an `error`. The window's status line already names such a daemon and its restart.

## Rule changes

- add
  file: docs/product.md
  section: What we promise
  to: **Under the routing answer `agentic`, no question holds the run.** `agentic` is the answer by which a person leaves each work item's route to the orchestrator and walks away. What needs the person is asked once, in one batch, before the first edit of the request, for every work item the request hands over. A question that arises after the batch parks the one work item it belongs to, with the question on that work item's line in the inbox, and every other work item goes on. What the orchestrator decides in place of asking shows on the work item's line with its grounds, and the person can reverse it when they come back. A late question would otherwise stop the whole run until the person is back, and that wait is what the promise removes.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/product.ko.md
  section: 무엇을 약속하는가
  to: **경로를 묻는 질문에 `agentic`이라고 답했다면, 어떤 질문도 실행 전체를 세우지 않습니다.** `agentic`은 작업마다 어느 경로로 갈지를 orchestrator에게 맡기고 자리를 비우겠다는 답입니다. 사람에게 물을 것은 요청의 첫 편집 전에, 그 요청이 맡긴 모든 작업의 것을 한 묶음으로 한 번만 묻습니다. 그 뒤에 생긴 질문은 그 질문이 속한 작업 하나만 세웁니다. 질문은 작업함에서 그 작업의 줄에 보이고, 다른 작업은 모두 계속 진행됩니다. orchestrator가 묻지 않고 내린 결정은 근거와 함께 그 작업의 줄에 보이고, 돌아온 사람이 뒤집을 수 있습니다. 이렇게 하지 않으면 늦게 생긴 질문 하나 때문에 사람이 돌아올 때까지 실행 전체가 멈춥니다. 약속이 없애려는 것이 바로 그 기다림입니다.
    check: apps/desktop/test/daemon.test.ts apps/desktop/test/view.test.ts
- add
  file: docs/product.md
  section: Foundation: the inbox, the AgenticSeal process and the back of the seal, with terminals on call
  to: **A work item's line shows the decisions made for it in place of asking, and a parked work item's line shows its question.** A parked work item stands with the work items that wait for the person, and its line says the first question it waits on. A decision holds nothing. The line says how many decisions stand, and the work item's view lists each with its grounds. A person reverses one there with a message, which the daemon keeps for the work item. The summary counts the decisions made since the last look apart from the work items that wait.
    check: apps/desktop/test/view.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/product.ko.md
  section: 바탕: 작업함, AgenticSeal 프로세스, 인장의 뒷면, 그리고 불러 쓰는 터미널
  to: **작업의 줄에는 묻지 않고 내린 결정이 보이고, 세워 둔 작업의 줄에는 그 질문이 보입니다.** 세워 둔 작업은 사람을 기다리는 작업들과 함께 놓이고, 그 줄은 기다리는 첫 질문을 말합니다. 결정은 아무것도 세우지 않습니다. 줄에는 뒤집히지 않은 결정이 몇 개인지가 보이고, 작업 화면에는 결정마다 근거가 함께 나옵니다. 사람은 거기서 메시지를 적어 결정을 뒤집고, 데몬은 그 메시지를 그 작업의 것으로 간직합니다. 요약 화면은 마지막으로 본 뒤에 내려진 결정을 사람을 기다리는 작업과 따로 셉니다.
    check: apps/desktop/test/view.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  to: **Under the routing answer `agentic`, the orchestrator asks once for the whole request, and afterwards decides or parks one work item.** Before the first edit of a request it gathers what needs the person from every work item the request hands over, into one batch. A question an issue's text leaves to a person is checked against the policy documents, the config, the code and the earlier work items' records before it enters the batch. Where they answer it, the orchestrator does not ask, and records the answer with the coordinate it stands on. A question that arises after the batch is not put to the person in the middle of the run. Where its record states a default, the orchestrator takes the default and records the decision. Where it states none, the daemon parks that one work item with the question. The daemon's code keeps a park to one work item: a park starts nothing, stops nothing and refuses nothing in any other work item, and the person's answer in the app ends it. The daemon keeps each decision made in place of asking with its grounds, and sends it with its work item.
    check: apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  to: **경로를 묻는 질문의 답이 `agentic`이면 orchestrator는 요청 전체에 대해 한 번만 묻고, 그 뒤에는 스스로 결정하거나 작업 하나만 세웁니다.** orchestrator는 요청의 첫 편집 전에, 그 요청이 맡긴 모든 작업에서 사람에게 물을 것을 모아 한 묶음으로 만듭니다. 이슈의 글이 사람에게 남긴 질문은 묶음에 넣기 전에 정책 문서, 설정, 코드, 앞선 작업의 기록과 대조합니다. 거기에 답이 있으면 묻지 않고, 그 답을 근거가 있는 자리와 함께 기록합니다. 묶음 뒤에 생긴 질문은 실행 도중에 사람에게 묻지 않습니다. 기록에 기본값이 있으면 orchestrator가 기본값을 택하고 그 결정을 기록합니다. 기본값이 없으면 데몬이 그 작업 하나를 질문과 함께 세워 둡니다. 세워 둔 작업이 다른 작업에 번지지 않게 하는 것은 데몬의 코드입니다. 작업 하나를 세워도 다른 작업에서는 아무것도 시작되지 않고, 멈추지 않고, 거절되지 않습니다. 사람이 앱에서 답하면 세워 둔 것이 풀립니다. 데몬은 묻지 않고 내린 결정을 근거와 함께 간직하고, 그 작업과 함께 보냅니다.
    check: apps/desktop/test/daemon.test.ts
- change
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  from: Batching everything to ask the person into one set
  to: Batching everything to ask the person into one set, for every work item a request hands over
- change
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  from: 사람에게 물을 것을 한 번에 묶기
  to: 요청이 맡긴 모든 작업에서 사람에게 물을 것을 한 번에 묶기
- add
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  to: | | Whether the policy documents, the config, the code or an earlier work item's records already answer a question an issue's text leaves to a person |
- add
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  to: | | 이슈의 글이 사람에게 남긴 질문에 정책 문서, 설정, 코드, 앞선 작업의 기록이 이미 답했는지 |
- add
  file: docs/architecture.md
  section: Code runs the order, the orchestrator judges
  to: | | Under `agentic`, what to decide in place of asking, and whether a later question takes its default or parks its work item |
- add
  file: docs/architecture.ko.md
  section: 순서는 코드가, 판단은 orchestrator가
  to: | | `agentic`에서 묻지 않고 무엇을 결정할지, 그리고 늦게 생긴 질문에 기본값을 택할지 그 작업을 세울지 |
- change
  file: docs/architecture.md
  section: What changes because Owlery is not a plugin
  from: The app's question screen. It is an input form with choices and defaults, so it can also be shown on a phone once a mobile UI is attached
  to: The app's question screen. It is an input form with choices and defaults, so it can also be shown on a phone once a mobile UI is attached. A question that arises after the batch parks its one work item, with the question on that work item's inbox line, while the daemon goes on with the others. A decision made in place of asking shows on its work item's line with its grounds
- change
  file: docs/architecture.ko.md
  section: 플러그인이 아니라서 달라지는 것
  from: 앱의 질문 화면. 선택지와 기본값이 있는 입력 양식이라, 모바일 화면을 붙이면 휴대폰에도 띄울 수 있습니다
  to: 앱의 질문 화면. 선택지와 기본값이 있는 입력 양식이라, 모바일 화면을 붙이면 휴대폰에도 띄울 수 있습니다. 묶음 뒤에 생긴 질문은 그 작업 하나만 세우고 작업함의 그 줄에 보이며, 데몬은 다른 작업을 계속 진행합니다. 묻지 않고 내린 결정은 근거와 함께 그 작업의 줄에 보입니다
- change
  file: docs/architecture.md
  section: State lives in three places
  from: Progress, session events and output, the cost ledger, questions and answers, schedule
  to: Progress, session events and output, the cost ledger, questions and answers, the decisions made in place of asking, schedule
- change
  file: docs/architecture.ko.md
  section: 상태는 세 곳에 둡니다
  from: 진행 상태, 세션 이벤트와 출력, 비용 장부, 질문과 답, 일정
  to: 진행 상태, 세션 이벤트와 출력, 비용 장부, 질문과 답, 묻지 않고 내린 결정, 일정

## Removes

The work adds a rule, a store for the decisions and one for the questions, the methods `Daemon#decided` and `Daemon#park`, the client messages `reverseDecision` and `answerQuestions`, and the fields `decisions` and `asked` of a work item. Nothing can go in return: no stage of the tree asks a person and nothing waits on an answer today (*Grounding*, the fact on what the daemon runs), so no mechanism stands in the place of the ones added. The rows below are the pin and the sentences the added fields make untrue, each rewritten in place.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The pinned list of a work item's field names, which holds neither `asked` nor `decisions` | `apps/desktop/test/daemon.test.ts#WORK_ITEM_FIELDS` | The same constant with both names added (scenario 18) |
| The docstring "What the work item's agent is doing, or null where no live pane of it says." | `apps/desktop/src/renderer/view.ts#InboxLine` | Rewritten: `waiting` also for a parked work item (*Scope* item 10) |
| The docstring that calls a line "the state of its most recent live pane of a kind that reports state, and its new commits" | `apps/desktop/src/renderer/view.ts#inboxLine` | Rewritten with the park, which comes before the pane's state |
| The docstring "The text of a line's second row, and which of the three it is" | `apps/desktop/src/renderer/view.ts#lineText` | Rewritten with the question as the first source |
| The sentence that a look's file lacking a field is no look "but for the fields of a work item that came with the repositories" | `apps/desktop/src/daemon/last-look.ts#LastLook`, and the type `SinceRepositories` beside it | Rewritten to name `decisions` and `asked` as well (*Scope* item 13) |
| The sentences that say what the run folder holds without `decisions.json` and `asked.json` | `apps/desktop/src/daemon/main.ts`, the comment above `mkdirSync` and the one above `runDir`, and `apps/desktop/src/daemon/daemon.ts#DaemonOptions`, the docstring of `runDir` | Rewritten to name both files |
| The docstring that says a changed work item is one whose line differs in the state or in the count of new commits, and one the look does not hold | `apps/desktop/src/renderer/view.ts#changesSince` | Rewritten with the decisions the look does not hold (*Scope* item 14) |

Framed 2026-11-22 by framer, before the build.
