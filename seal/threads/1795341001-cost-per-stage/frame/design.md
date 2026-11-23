# Design: 1795341001-cost-per-stage

Issue #45, "the daemon keeps no cost per stage, so nothing can be set beside what a round caught". The paths below are under `apps/desktop/` unless they open with `docs/`, `seal/` or `apps/`.

## Grounding

The tree as read at `e262835`.

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *What changes because Owlery is not a plugin*, the row "Measuring cost" | The daemon records the result events of headless mode, `total_cost_usd` and the tokens per model, at each stage as they arrive. The daemon owns the ledger. Under a subscription login the cost is a value converted at API prices, and the ledger labels it so. |
| `docs/architecture.md` *State lives in three places*, the row "The daemon" | The cost ledger is the daemon's state and is not committed. The same table's row "The user's repository" keeps the work records there, so the ledger holds no copy of a round's findings. |
| `docs/architecture.md` *Agent adapters*, the row "Agent to daemon" | An adapter fits "tokens and cost per model" to the daemon. |
| `docs/architecture.md` *Rules that keep it portable*, rules 1 and 3 | Only the shapes an adapter produces cross the protocol, and no field of a vendor's does. The fake adapter reports whatever the Claude adapter reports. |
| `docs/architecture.md` *Measure before building*, the bullet "What the cost field means under a subscription login" | The bullet asks for one comparison under an API key login "before deciding how the ledger shows them". Issue #45's comment of 2026-11-22 carried that comparison to #140, because it needs a credential only the owner holds. This work decides the ledger's mark and not its display, which is #47's, and *Rule changes* rewrites the bullet's last sentence to say what stands until #140 runs. |
| `docs/architecture.md` *Memory design*, the first rule | A feature costs nothing while nobody uses it. The ledger is therefore not held in memory between two reads. |
| `seal/threads/1795268972-headless-failure-and-limit/frame/design.md` *Rule changes*, the rule on the 50 headless sessions | The daemon's list of headless sessions is bounded, and "a result that must outlive it belongs in the repository's records". The cost is the daemon's state by the row above, so it needs a store of its own that outlives that list. |
| `docs/roadmap.md` *Done criteria*, the row "The ledger is public", and issue #76's fifth *Done when* line | The published ledger "covers every work item sealed by Owlery since release 0.0.2". A person deletes a work item after its pull request merges, so an entry has to outlive the delete of its work item. |
| The index of the policy root | `docs/README.md` does not exist (executed: `ls docs`). Each `file:` of *Rule changes* is a file `ls docs` lists. |

What the tree and the probes showed. Each row is labelled as contract rule 4 asks.

| Fact | Label | Coordinate or command |
|---|---|---|
| The Claude adapter reads `total_cost_usd` alone from a `result` line, as `costUsd` of the neutral `result` event. | read | `src/daemon/adapters/claude.ts:253-261`, `src/daemon/adapters/adapter.ts:15` |
| The daemon copies that value into `HeadlessInfo.costUsd`, and a headless session lives in memory alone, 50 ended ones at most. | read | `src/daemon/daemon.ts:1355`, `:196`, `:74`, `src/shared/protocol.ts:375` |
| The window reads no cost: no file of the renderer, the main process or the preload names one. | executed | `git grep -n -i -e cost -e usage -- apps/desktop/src/renderer apps/desktop/src/main apps/desktop/src/preload ':!apps/desktop/src/renderer/themes.css'` at `e262835` printed nothing, exit 1 |
| Every end of a headless session but the daemon's own close passes through `headlessChanged`, whose block for a session that has just ended runs once per session: a result, an error result, an exit with no result, a start the adapter rejected, and a stop at the limit or at a request. | read | `src/daemon/daemon.ts:1305-1312`, `:1315-1378`, `:1388-1407` |
| The daemon's close stops each working run and changes no session's state. | read | `src/daemon/daemon.ts:458-479` |
| A `result` line of Claude Code under a subscription login carries `total_cost_usd` and `modelUsage`, whose entry for a model holds `inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens`, `costUSD` and `costBasis` `list`. The `init` line of the same stream carries `apiKeySource` `none`. | executed | `grep -n '"type":"result"' apps/desktop/test/fixtures/*.jsonl` and `grep -o '"apiKeySource":"[^"]*"' apps/desktop/test/fixtures/*.jsonl` at `e262835` |
| The executable of Claude Code 2.1.330 gives `apiKeySource` one of four values: `none`, `ANTHROPIC_API_KEY`, `apiKeyHelper` and `/login managed key`. | executed | `LC_ALL=C grep -a -o -E 'key:[A-Za-z0-9_.$()]{1,60},source:"[A-Za-z_/ ]{1,40}"' ~/.local/share/claude/versions/2.1.330`, 2026-11-23. The executable was read as a file and not started. |
| The same executable describes `costBasis` as the price table a model's last request was priced at: `list`, Claude Code's built-in list prices, `managed`, an organization's own rates, or `unknown`. | executed | `LC_ALL=C grep -a -o '.\{300\}costBasis.\{300\}'` on the same file, 2026-11-23 |
| A headless session's environment holds `HOME`, `USER`, `PATH`, `LANG` and one variable of Claude Code's, so an `ANTHROPIC_API_KEY` of the daemon's environment reaches no session. | read | `src/daemon/adapters/claude.ts:108-116` |
| A work item's id only rises, and begins again only where `repositories.json` is lost. | read | `src/daemon/repositories.ts:134`, `src/daemon/daemon.ts:574` |
| A daemon answers a message whose type it does not know with nothing. | read | `src/daemon/daemon.ts:1148-1149` |
| No frame of #41, #46 or #27 is committed. Each branch holds its `routing.md` alone. | executed | `git ls-tree -r --name-only <branch> -- seal/threads` for the three branches, 2026-11-23 |
| The release note of 0.0.1 and the changelog fragments under `seal/threads/` hold no `### Process changes` table. | executed | `gh release view --json body --jq .body` and `grep -rn 'Process changes' seal/threads/*/changelog.md`, 2026-11-23 |
| `seal/follow-up.md` does not exist. | executed | `ls seal` |
| The comments of #45, #140 and #141 were read with `gh issue view <N> --json body,comments`. #45's one comment carries the fourth *Done when* line to #140 and changes nothing else of the request. | executed | 2026-11-23 |

The earlier frame's conclusions, which survive only in #140 and #141, were weighed as claims. This frame reaches the same answer on two of them, by its own reading: the mark is "converted" for every login that names no key (*Scope* item 4), and a stage the daemon stopped has an entry with no usage (*Scope* item 9). It did not take the earlier frame's sentence that Claude Code prices a cost "under any login": the probe above shows the price table's three values and one recorded stream of a subscription login, and no more.

This work item's subject is the code, so its rules are stated in *Rule changes* for the settle.

## Scope

In scope:

1. `src/shared/protocol.ts` gains the neutral shape of what a turn used: `Usage` and `ModelUsage`, as *Data & interfaces* gives them.
2. The `result` event of `RoleEvent` (`src/daemon/adapters/adapter.ts`) carries `usage: Usage | null` in place of `costUsd`. It is null where the agent reported neither a cost nor a model's tokens.
3. The Claude adapter fills `usage` from a `result` line: `costUsd` from `total_cost_usd`, and one `ModelUsage` for each key of `modelUsage`, in the line's order, with `inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens` and `costUSD` read into the neutral names. A value that is no number is null. A line with no numeric `total_cost_usd` and no `modelUsage` object gives `usage` null. The result the adapter itself makes for a refused role launch carries `usage` null.
4. The Claude adapter sets `usage.converted` from the `apiKeySource` of the stream's `init` line. It is false only where that value is `ANTHROPIC_API_KEY`, `apiKeyHelper` or `/login managed key`. It is true for `none`, for any other value, for a value that is no string, and for a stream whose `result` line came with no `init` line before it. The vendor's value stays in `src/daemon/adapters/claude.ts`.
5. The fake adapter takes an option `usage`, a function of the prompt and the role, and reports what it gives on the result of a session that succeeds. Without the option, and on the result of a session told to fail, `usage` is null.
6. `HeadlessInfo` carries `usage: Usage | null` in place of `costUsd`, null until the result and where the result carried none. The daemon copies the event's value.
7. `src/shared/protocol.ts` gains `LedgerEntry` and `LedgerStage`, as *Data & interfaces* gives them. `LedgerStage` names the gate, so that #42's gate, which is no role session, has a value to write.
8. A new module `src/daemon/ledger.ts` holds the store, `Ledger`. Given a run directory it appends each entry as one line of JSON to `ledger.jsonl` there, a file readable by the user alone, and holds no entry in memory. `add` appends one entry. `read` reads the file and gives the entries of one work item that started at or after a given time, in the file's order, and the count of the lines it could not read as an entry. A line it cannot read stays in the file. An append that fails is logged with `console.error`, and the entry is held in memory, written before the next entry's line and included in every read meanwhile. Given no run directory, the store keeps the entries in memory alone.
9. The daemon adds one entry when a headless session ends, with a role and without: at its result, at its error result, at an exit that came with no result, and at a stop at its limit or at a request. The entry's `usage` is the result's where a result ended the session, and null otherwise. `startedAt` is the session's, `endedAt` the daemon's clock at the end, and `repo` and `branch` the repository's folder and the work item's branch as the store held them when the session was asked. A session whose adapter rejected the start gets no entry, because nothing ran. No session gets two entries.
10. The daemon's close adds one entry for each headless session that is still working, with `state` `failed`, `stopped` `daemon` and `usage` null, before it stops the runs.
11. No delete, archive or removal takes an entry out of the ledger: `dropWorkItems` leaves the store as it is. A work item is read its entries from its own `createdAt` on, so where an id is given a second time after `repositories.json` was lost, the earlier work item's entries are not read as the new one's.
12. A client asks for a work item's ledger with `readLedger`, and the daemon answers with `ledger`: the entries and the count of unread lines. An archived work item is answered as any other. An id the daemon lists no work item under is answered with an `error`.
13. The comments that list the run directory's files name the ledger: `DaemonOptions.runDir` in `src/daemon/daemon.ts` and the two comments of `src/daemon/main.ts`.

Out of scope, each with where it lands:

- **The comparison under an API key login**, the issue's fourth *Done when* line. It needs a credential only the owner holds and a real `claude` turn. Issue #140 holds it, with the check of item 4's rule against what an API key login names.
- **Any display of a cost.** No window code reads one today (*Grounding*). #47 draws the ledger on the back of the seal and reads `usage.converted` there. The issue's third line, "wherever the app shows it", is held by items 2 and 6: no cost crosses the protocol without its mark.
- **Which round or fix pass an entry belongs to.** An entry names its pair, its times and how it ended. #41 runs the rounds and #47 joins them to the round records, so the join is theirs to frame.
- **The gate's entry and the sealer's stage.** #42 runs both. The sealer is a role session, so item 9 gives it an entry. The gate is a command of the daemon's, and #42 calls `Ledger#add` with the stage item 7 names.
- **The cost of a stage that was stopped**, a budget cap per stage (`--max-budget-usd`), a mark on a cost Claude Code could not price (`costBasis` `unknown`), and a stage's share of the usage window. Issue #141 holds all four.
- **An entry for a stage a crashed daemon cut.** A crashed daemon writes nothing. #141's read of the CLI's session log is where its cost can come from.
- **An export or a publication of the ledger.** Issue #76.
- **Moving the ledger between machines.** `docs/architecture.md` *What changes because Owlery is not a plugin*, the row "Moving records to another machine", places it with a later sync.
- **The version.** The first pull request of `release/v0.0.2` moved it.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A role session's cost is kept | Given a work item and a fake adapter told to report a usage. When a client asks a proofer at a round and the session finishes. Then `readLedger` answers one entry with the pair, the two times, `state` `finished`, `stopped` null and that usage. | A case of `test/daemon.test.ts` under "headless sessions" |
| The ledger outlives the daemon | Given the entry above in a run directory. When the daemon closes and a second daemon starts on the same run directory. Then `readLedger` answers the same entry, and `ledger.jsonl` has the mode `0600`. | A case of `test/daemon.test.ts` with two daemons on one `runDir` |
| Nothing of the ledger is committed | Given the same run. Then the work item's worktree and the repository's main checkout hold no file the ledger wrote: `git status --porcelain` prints the same in both before the session and after it. | The same case |
| A stopped stage has an entry with no usage | Given a session that works. When its limit stops it, and in a second case a `stopHeadless`. Then the entry says `failed`, `stopped` `limit` or `request`, and `usage` null. | Two cases of `test/daemon.test.ts` |
| The daemon's own stop is entered | Given a session that works. When the daemon closes. Then the next daemon on the run directory answers one entry with `stopped` `daemon`. | A case of `test/daemon.test.ts` |
| A failed stage keeps what it reported | Given an adapter whose result is an error with a usage. Then the entry says `failed`, `stopped` null and that usage. Given an exit with no result. Then `usage` is null. Given a start the adapter rejects. Then the ledger holds no entry. | Cases of `test/daemon.test.ts` |
| A subscription login's cost is marked | Given the lines of `test/fixtures/claude-role-stream.jsonl`, whose `init` line says `apiKeySource` `none`. When the adapter reads them in order. Then the result's `usage` has `converted` true, the cost `0.2807378` and one model with the fixture's four token counts. | A case of `test/claude-adapter.test.ts` |
| A key's cost is not marked, and an unknown login is | Given a stream whose `init` line names each of the three key values in turn. Then `converted` is false. Given a value item 4 does not list, and a stream with no `init` line. Then `converted` is true. | Cases of `test/claude-adapter.test.ts` |
| No vendor's field crosses the protocol | Given the built tree. Then the names `apiKeySource`, `modelUsage`, `total_cost_usd` and `costBasis` stand in `src/daemon/adapters/claude.ts` alone. | `git grep -n -e 'apiKeySource' -e 'modelUsage' -e 'total_cost_usd' -e 'costBasis' -- apps/desktop/src ':!apps/desktop/src/daemon/adapters/claude.ts'` prints nothing. Run at `e262835`: it printed nothing, exit 1 (executed). The pathspec excludes this work item's directory. The search can fail: a build that reads `apiKeySource` in the daemon or names it in the protocol prints that line. |
| The fake adapter reports usage | Given a fake adapter with the option `usage`. Then its result carries what the option gives, and null without the option. | A case of `test/fake-adapter.test.ts` |
| A session's cost travels with its mark | Given a session that finished with a usage. Then every `headless` message carries `usage` with `converted`, and no field `costUsd` beside it. | The case of `test/daemon.test.ts` that lists a session's fields, with `usage` in the place of `costUsd` |
| A deleted work item's entries stay | Given a work item with one entry. When the person deletes the work item. Then `ledger.jsonl` still holds the line. | A case of `test/daemon.test.ts` that reads the file |
| An id given twice reads its own entries | Given a line in `ledger.jsonl` under a work item's id with a `startedAt` before the time `read` is given. Then `read` does not give it. | A case of `test/ledger.test.ts` |
| A line the daemon cannot read is counted | Given a `ledger.jsonl` with one entry, one line that is no JSON and one object of another shape. Then `read` gives the one entry and `unread` 2, and the file still holds those three lines after the next `add`. | A case of `test/ledger.test.ts` |
| A failed append loses no entry | Given a run directory where `ledger.jsonl` is a folder. When an entry is added. Then `read` gives the entry. | A case of `test/ledger.test.ts` |
| The gate's entry can be written | Given an entry whose stage is the gate and whose `usage` is null. Then `add` and `read` give it back. | A case of `test/ledger.test.ts` |
| An unknown work item is refused | When a client sends `readLedger` with an id the daemon does not list. Then the daemon answers with an `error`. | A case of `test/daemon.test.ts` |

## Data & interfaces

`src/shared/protocol.ts`, new:

```ts
/** What one model used in a turn. A count is null where the agent reported none. */
export interface ModelUsage {
  /** The model's name, as the agent names it. */
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  /** The tokens read from the cache, and the tokens written to it. */
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
  /** The model's part of the cost in US dollars, or null where the agent reported none. */
  costUsd: number | null;
}

/** What a turn used, as its adapter reports it. */
export interface Usage {
  /** The turn's cost in US dollars, or null where the agent reported none. */
  costUsd: number | null;
  /** True unless the adapter knows the session's login is billed for each token: the cost is then a value converted at API prices and no charge. */
  converted: boolean;
  /** One for each model the agent reported, in the agent's order. */
  models: ModelUsage[];
}

/** The stage an entry of the ledger is for: a pair of `ROLE_STAGES`, the broad gate, or null for a headless session with no role. */
export type LedgerStage = RoleStage | { role: null; stage: "gate" } | null;

/** One entry of the cost ledger: one stage of a work item that ended. */
export interface LedgerEntry {
  workItemId: number;
  /** The top-level folder of the repository's main checkout, and the work item's branch, as they stood when the stage started. */
  repo: string;
  branch: string;
  stage: LedgerStage;
  /** The daemon's clock at the stage's start and at its end. */
  startedAt: number;
  endedAt: number;
  state: "finished" | "failed";
  /** What stopped the stage before it ended by itself: its limit, a request, or the daemon's own stop. Null where it ended by itself. */
  stopped: "limit" | "request" | "daemon" | null;
  /** What the adapter reported the stage used, or null where it reported none before the stage ended. */
  usage: Usage | null;
}
```

`src/shared/protocol.ts`, changed:

- `HeadlessInfo.costUsd` is replaced by `usage: Usage | null`.
- `ClientMessage` gains `{ type: "readLedger"; requestId: number; workItemId: number }`.
- `ServerMessage` gains `{ type: "ledger"; requestId: number; workItemId: number; entries: LedgerEntry[]; unread: number }`.

`src/daemon/adapters/adapter.ts`: the `result` event becomes `{ type: "result"; text: string; isError: boolean; usage: Usage | null }`.

`src/daemon/adapters/fake.ts`: `FakeAdapterOptions` gains `usage?: (prompt: string, role?: RoleStage) => Usage | null`.

`src/daemon/ledger.ts`, new: `class Ledger` with `constructor(runDir: string | undefined)`, `add(entry: LedgerEntry): void` and `read(workItemId: number, since: number): { entries: LedgerEntry[]; unread: number }`. A line is an entry where it is one JSON object with every field of `LedgerEntry` in its type, and its `stage` is a pair `roleStageOf` reads, the gate, or null.

The run directory gains `ledger.jsonl`: one `LedgerEntry` as JSON on each line, in the order the stages ended.

A stage's duration is `endedAt - startedAt`. It is stored nowhere else.

## Rule changes

- add
  file: docs/architecture.md
  section: Agent adapters
  to: **An adapter reports what a turn used in one neutral shape, and every cost carries whether it is a value converted at API prices.** The shape holds the turn's cost in US dollars and, for each model, the input tokens, the output tokens, the tokens read from the cache, the tokens written to it and that model's cost. The Claude adapter reads them from the `result` line of the headless stream (`total_cost_usd` and `modelUsage`), and reads the login from the stream's first `init` line; a result that comes before any `init` line reads as converted. It takes a cost as what the account is billed only where `apiKeySource` names a key: `ANTHROPIC_API_KEY`, `apiKeyHelper` or `/login managed key`, the three values the executable of Claude Code 2.1.330 gives a key (read 2026-11-23). Under every other value, a subscription login's `none` among them, the cost is marked as converted. A value nobody has set beside a bill is not shown as a charge, so a login the adapter does not know reads as converted. No cost crosses the protocol without the mark, and no field of Claude Code's does. The fake adapter reports the same shape in the cases.
    check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/fake-adapter.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 에이전트 어댑터
  to: **어댑터는 한 턴이 쓴 것을 특정 회사에 묶이지 않은 한 가지 모양으로 알리고, 비용에는 그 값이 API 가격으로 환산한 값인지가 늘 함께 실립니다.** 그 모양에는 턴의 비용(미국 달러)과, 모델마다 입력 토큰, 출력 토큰, 캐시에서 읽은 토큰, 캐시에 쓴 토큰, 그 모델의 비용이 담깁니다. Claude 어댑터는 이것을 headless 스트림의 `result` 줄(`total_cost_usd`와 `modelUsage`)에서 읽고, 로그인은 스트림의 첫 `init` 줄에서 읽습니다. `init` 줄보다 먼저 온 result는 환산한 값으로 읽습니다. `apiKeySource`가 키를 가리킬 때에만 비용을 그 계정에 청구되는 값으로 봅니다. 키를 가리키는 값은 `ANTHROPIC_API_KEY`, `apiKeyHelper`, `/login managed key` 셋이고, Claude Code 2.1.330 실행 파일이 키에 붙이는 값입니다(2026-11-23에 읽음). 구독 로그인의 `none`을 포함해 그 밖의 값에서는 모두 비용을 환산한 값으로 표시합니다. 청구서와 견줘 본 적이 없는 값을 청구액처럼 보여 주지 않으려는 것이므로, 어댑터가 모르는 로그인도 환산한 값으로 읽습니다. 이 표시가 없는 비용은 프로토콜을 지나지 않고, Claude Code의 필드도 지나지 않습니다. 테스트에서는 가짜 어댑터가 같은 모양으로 알립니다.
    check: apps/desktop/test/claude-adapter.test.ts apps/desktop/test/fake-adapter.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.md
  section: State lives in three places
  to: **The daemon keeps the cost ledger in its run folder, one entry for each stage that ended, and no delete takes an entry out.** An entry holds the work item, its repository's folder and its branch as they stood when the stage started, the role and the stage, when the stage started and ended on the daemon's clock, how it ended, and what the adapter reported it used. A headless session with no role gets an entry with no stage, because it spends from the same account. The daemon appends the entry as one line of `ledger.jsonl` when the stage ends, so the ledger outlives the daemon and nothing of it is committed. A stage the daemon stopped, at its limit, at a request or at the daemon's own stop, has an entry with no usage, because its agent reported none before it ended. A daemon that crashes writes no entry for the stage it cut. A deleted work item's entries stay, because the ledger is published after its work items are merged and deleted (issue #76). The daemon holds no entry in memory between two reads, except an entry whose append failed, which it holds until the next append. A client asks for one work item's ledger over the protocol, and the answer says how many lines of the file the daemon could not read.
    check: apps/desktop/test/ledger.test.ts apps/desktop/test/daemon.test.ts
- add
  file: docs/architecture.ko.md
  section: 상태는 세 곳에 둡니다
  to: **데몬은 비용 장부를 실행 폴더에 두고, 끝난 단계마다 항목을 하나 적으며, 무엇을 지워도 항목은 빠지지 않습니다.** 항목에는 그 작업, 단계가 시작될 때의 저장소 폴더와 브랜치, 역할과 단계, 데몬의 시계로 단계가 시작된 때와 끝난 때, 어떻게 끝났는지, 어댑터가 알린 사용량이 담깁니다. 역할 없이 뜬 headless 세션도 같은 계정에서 쓰므로, 단계가 없는 항목으로 적습니다. 데몬은 단계가 끝날 때 항목을 `ledger.jsonl`에 한 줄로 덧붙입니다. 그래서 장부는 데몬이 끝난 뒤에도 남고, 장부의 어떤 것도 커밋되지 않습니다. 데몬이 멈춘 단계는 사용량이 없는 항목으로 적습니다. 한도에 이르러 멈췄든, 요청으로 멈췄든, 데몬이 스스로 멈추면서 끊었든 같습니다. 에이전트가 끝나기 전에 사용량을 알리지 않았기 때문입니다. 데몬이 죽으면서 끊긴 단계에는 항목이 적히지 않습니다. 지운 작업의 항목도 남깁니다. 장부는 작업이 머지되고 지워진 뒤에 공개되기 때문입니다(이슈 #76). 데몬은 장부를 읽을 때가 아니면 항목을 메모리에 두지 않습니다. 다만 덧붙이기에 실패한 항목은 다음 덧붙이기까지 메모리에 남습니다. 클라이언트는 프로토콜로 작업 하나의 장부를 묻고, 답에는 데몬이 파일에서 읽지 못한 줄의 수가 함께 옵니다.
    check: apps/desktop/test/ledger.test.ts apps/desktop/test/daemon.test.ts
- change
  file: docs/architecture.md
  section: Measure before building
  from: Before deciding how the ledger shows them, compare the values for the same work against an API key login.
  to: Claude Code prices a model's requests from a price table, which its result names for each model (`costBasis`: its built-in list prices, an organization's own rates, or none), and a result under a subscription login named the list prices (read in the executable of 2.1.330 and in a recorded stream, 2026-11-23). Until the comparison is run, the ledger marks every cost as converted unless the session's login names an API key ([Agent adapters](#agent-adapters)). What is left is to set the values for the same work under an API key login beside that account's bill, which issue #140 runs.
- change
  file: docs/architecture.ko.md
  section: 만들기 전에 잴 것
  from: 장부에 어떻게 표시할지 정하기 전에, 같은 작업의 값을 API 키 로그인과 견줘 확인합니다.
  to: Claude Code는 모델의 요청에 가격표를 적용해 비용을 매기고, 어느 가격표인지를 결과에 모델마다 적습니다(`costBasis`: 내장된 정가, 조직이 정한 요율, 또는 없음). 구독 로그인의 결과에는 정가가 적혀 있었습니다(2026-11-23에 2.1.330 실행 파일과 기록해 둔 스트림에서 읽음). 견줘 보기 전까지 장부는 세션의 로그인이 API 키를 가리키지 않으면 모든 비용을 환산한 값으로 표시합니다([에이전트 어댑터](#에이전트-어댑터)). 남은 일은 같은 작업의 값을 API 키 로그인에서 재어 그 계정의 청구서와 견주는 것이고, 이슈 #140이 합니다.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The field `costUsd` of the neutral `result` event | `apps/desktop/src/daemon/adapters/adapter.ts#RoleEvent` | `usage.costUsd` of the same event. A cost alone carries no mark, and the issue's third line asks that none travels without one. |
| The field `costUsd` of a headless session | `apps/desktop/src/shared/protocol.ts#HeadlessInfo` | `HeadlessInfo.usage.costUsd`. No window code reads the old field (*Grounding*). A daemon of an earlier build still sends `costUsd` and no `usage`, and nothing reads either from it. |
| The test pins of the old field: the case "carries the cost the adapter reports", the literals that spell a session or a `result` event with `costUsd`, and the list of a session's fields | `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/claude-adapter.test.ts`, `apps/desktop/test/fake-adapter.test.ts`, `apps/desktop/test/view.test.ts` | The same cases with `usage`. The first becomes the case that carries the usage. |
| The sentence that puts the comparison before the ledger's mark | `docs/architecture.md` *Measure before building* and `docs/architecture.ko.md` *만들기 전에 잴 것*, at the settle | The `to` of *Rule changes*, and issue #140 for the comparison itself. |

This work adds no gate, check, hook, CI step, label or mark of the process. The `converted` field is data the issue's third line asks for.

Framed 2026-11-23 by framer, before the build.
