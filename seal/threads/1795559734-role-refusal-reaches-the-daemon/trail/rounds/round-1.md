# Review round 1: 1795559734-role-refusal-reaches-the-daemon

```seal
target: bc7de32a against release/v0.0.4
```

The base is `release/v0.0.4` at `4a005eb`, and the range read is `4a005eb..bc7de32a`. It holds twelve commits. `c8dc3fa0` and `e11311c0` change code: `apps/desktop/package.json`, `apps/desktop/test/model-stand-in.ts` and `apps/desktop/test/role-session.test.ts`. The rest change this work item's records. This is the first round, so no earlier round carries a coordinate or a verdict, and every fact below was established in this round. Every record that step 3 names was read whole at `bc7de32a`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. `Commit and pull request language` and `Record language` both read English, so no `pr.<lang>.md` is owed, and none stands. No `seal/parity.json` is declared.

## Findings

### 1. The changelog says every run's files landed in the check's config folder, which the runs listed for two of six

```seal
severity: should
location: `seal/threads/1795559734-role-refusal-reaches-the-daemon/changelog.md:6`
evidence: read `seal/threads/1795559734-role-refusal-reaches-the-daemon/changelog.md:6`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/trail/phases/phase-2.md:13`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/trail/phases/phase-2.md:42`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/trail/phases/phase-1.md:7`, `apps/desktop/test/role-session.test.ts:205`
```

Why it matters: the changelog fragment goes whole into the pull request body and the release note, and a person reads it to learn what the check guarantees about their own files. `bc7de32a` reworded this item "to the evidence", and it now claims: "The CLI runs under those two folders, and in every run the files it wrote landed in the check's config folder." The evidence is narrower. Phase 2 listed the kept folders after runs 1 and 4 only (`phase-2.md:42`: "After runs 1 and 4 the case's config folder held ... and the case's home was empty"). Phase 1 listed one run's kept folder (`phase-1.md:7`). In every run, the case asserts only that a `projects` folder exists under the case's config folder (`role-session.test.ts:205`). That shows where the conversation went, not where every file the CLI wrote went. No run looked at what the CLI wrote outside the two folders, which is the same gap that `gaps.md` rows 3 and 4 already name for hosts and for the daemon's reads. The sentence should say what each run showed and what the listed runs showed. It is the only statement of this claim: `phase-2.md:13` and `:42` already word it to the listed runs, and `pr.md` quotes no sentence of `changelog.md`.

```markdown
- **The check spends none of your usage and needs no login.** It gives the CLI a placeholder key and a home folder of its own. The daemon takes a Claude Code config folder of the check's own as its default and gives it to the session, as it gives an account's folder. In every run the session wrote its conversation into the check's config folder, and in the runs whose folders were listed afterwards the check's home stayed empty and the config folder held what the CLI writes there. In the daemon's code, every read of a Claude Code folder that this check reaches names the check's own folder. No run traced the daemon's reads of files, or the CLI's writes outside the two folders, so those parts rest on reading the code. The check still needs `pnpm install` and a `claude` your login shell finds.
```

### 2. The stand-in model answers a request that is not streamed, which no run showed the CLI send, while its comment and Scope item 11 say it answers only what a run showed

```seal
severity: should
location: `apps/desktop/test/model-stand-in.ts:78-90`, `apps/desktop/test/model-stand-in.ts:7-9`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/design.md:57`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/design.md:87-94`
evidence: read `apps/desktop/test/model-stand-in.ts:7-9`, `apps/desktop/test/model-stand-in.ts:82-86`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/design.md:32`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/design.md:57`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/design.md:94`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/plan.md:27`; executed `grep -n stream` over `trail/phases/*.md` and `frame/design.md`
```

Why it matters: *Scope* item 11 (`design.md:57`) says "The stand-in model answers what a run showed the CLI asks, and refuses the rest by name". `pr.md` quotes that sentence to the reader of the pull request. The helper's opening comment says the same (`model-stand-in.ts:7-9`: "It answers only what a run showed the CLI asks: any other request is refused with 404 and its method and path"). The code also answers a `POST /v1/messages` without `stream: true`, with a JSON body (`model-stand-in.ts:83-86`). No run showed the CLI send one. The framer's probe saw two requests, each "with `stream: true`" (`design.md:32`). The phase records name no non-streamed request, and the case prints no request's `stream` field (`role-session.test.ts:193`). The frame removed the `count_tokens` answer on exactly these grounds: "An answer no run asked for is never exercised, so nothing shows whether a later CLI accepts it. Without the row the request is refused by name and printed, which says more to the person who then adds the row" (`plan.md:27`). The non-streamed branch is the same kind of answer, so the sentence the pull request quotes is false of the helper. The branch came from `design.md:94` ("A request without it is answered with the message as one JSON body"), so the frame contradicts its own *Scope* item 11. The code and that frame paragraph change together.

The fix makes the code match *Scope* item 11. `message` stays, because `streamed` uses it for `message_start`:

```ts
      if (request.method === "POST" && pathname === "/v1/messages" && body?.stream === true) {
        const tools = Array.isArray(body.tools) ? (body.tools as { name?: unknown }[]).map((tool) => tool.name) : [];
        const block: Block = tools.includes("Bash") && toolResults(body).length === 0 ? { type: "tool_use", id: "toolu_stand_in_1", name: "Bash", input: { command, description: "The stand-in model's one call" } } : { type: "text", text: STAND_IN_TEXT };
        streamed(response, body.model, block, block.type === "tool_use" ? "tool_use" : "end_turn");
        return;
      }
      // No run showed the CLI ask anything else, a messages request that is not streamed among it, so it is refused by name and printed.
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ type: "error", error: { type: "not_found_error", message: `The stand-in model answers no ${request.method ?? ""} ${pathname}${pathname === "/v1/messages" ? " that is not streamed" : ""}.` } }));
```

The frame's *Data & interfaces* changes with it, in `design.md:89` to `:94`. The first three rows of the answers table read `POST /v1/messages…` with `stream: true`. The row "Anything else" covers a request without it. Replace the sentence at `:94` with:

```markdown
A request with `stream: true` is answered as server-sent events, in the order the probe sent them: `message_start`, `content_block_start`, `content_block_delta` (an `input_json_delta` holding the whole input for the call, a `text_delta` for text), `content_block_stop`, `message_delta` with the `stop_reason`, `message_stop`. A request without it takes the 404 row, because no run showed the CLI send one (*Scope* item 11). Each answer names the model the request named. The server keeps, for each request, its method, its path and its parsed body.
```

A fix pass may instead keep the branch and reword *Scope* item 11, the helper's comment and the quote in `pr.md` to say that the stand-in also answers one request that no run showed. Either way, `frame/plan.md:38` makes a fix to `model-stand-in.ts` owe the runs of scenarios 1 and 2 again at the fix's commit.

## Confirmations

What matched, *Scope* item 5, executed: where the stand-in model receives no request, the case fails on the stand-in's message and on no assertion of the daemon's. Phase 2 inserted the `projects` assertion (`role-session.test.ts:205`) ahead of the one that reads the stand-in's requests (`:208`), and no phase re-ran the unreachable case after that. This round ran it at `bc7de32a` with `ANTHROPIC_BASE_URL` pointed at port 9 of the loopback. The CLI wrote its conversation into the case's config folder before its first request, so `:205` passed and the case failed at `role-session.test.ts:208:70` with `AssertionError: the CLI did not reach the stand-in model: expected 0 to be greater than 0`. The session ended `failed` with `API Error: Connection refused`. The case took 179.5 s of its 280 s window. The case's home was empty, and its config folder held `.claude.json`, `backups`, `plugins`, `projects` and `sessions`.

What matched, read: the diff against `frame/design.md` *Scope* items 1 to 4, 6 to 8, 10 and 11's `count_tokens` row. `startModelStandIn` starts before `launched` and closes in a `finally` (`role-session.test.ts:177-183`). The wrapper script exports the four variables of item 2 before its `--version` branch (`:111`, `:114`). The stand-in shell prints `__owlery_config=` only with a stand-in address (`:117`), and `claude.ts#parseLookup` (`claude.ts:150-156`) and `defaultLoginFolder` (`claude.ts:473`) then give the session that folder through `claudeEnv` (`claude.ts:484`, `:116-125`). The stand-in issues one `Bash` call with `APPEND` for a request whose tools name `Bash` and whose messages hold no tool result (`model-stand-in.ts:80`). The assertions stand in item 4's order, with the stand-in and config checks of item 5 and scenario 5 placed before the daemon's (`role-session.test.ts:201-218`). The case prints `claude_code_version` (`:190`). Without the address, `pointed` is empty and the wrapper script, the stand-in shell and the `Daemon` options are those of `4a005eb`, word for word (diff). The comment, the `describe` title and the `it` title say what each case is (`:1-24`, `:62`, `:175`). Both scripts end with `--reporter=default` (`apps/desktop/package.json:18-19`), and `role:run` is unchanged (`:17`). No `count_tokens` answer stands. Each row of *Removes* is gone from the file.

What matched, read and executed: *Scope* item 10's grounds. The installed Vitest is 4.1.12, its `coverage` chunk pushes the reporter `agent` where `std-env`'s `isAgent` holds, the reporter `agent` is `MinimalReporter`, and `std-env` 4.3.0 reads `AI_AGENT` and `CLAUDECODE` (`grep` over `node_modules/vitest/dist/chunks` and `std-env/dist/index.mjs`). `scripts/test-in-electron.mjs` passes the arguments after the file to `vitest run`.

What matched, read: the daemon readers that phase 2's answer to Q3 names, at the coordinates it gives. `daemon.ts#foldersOf` (`daemon.ts:1595-1597`) falls back to `defaultLoginFolder`. `conversationsOf` (`:1790-1797`) and `readAgentNotice` (`:3688-3693`) reach it. Pane starts reach it at `:1754` and `:2249`, and the chain's choice reaches it at `:2505`. `notice` runs `--version` under `claudeEnv(env, path)`, with no config folder (`claude.ts:601`). `git grep` over `apps/desktop/src/daemon` for `homedir()` and `".claude"` lists `claude.ts:473`, `claude-plugins.ts:29` and `:67`, and `worktrees.ts:20`, and the hand check reaches no reader beyond the ones phase 2 names. That is a reading of the code. Like phase 2's answer, it is no trace (`gaps.md` row 4).

What matched, read: each quote of `pr.md` stands word for word at its coordinate. The quotes are `frame/plan.md` *Judgments of the run* (`plan.md:63`), `frame/design.md` *Scope* items 1, 2, 3, 4, 5, 10 and 11 (each item's bold opening sentence, `design.md:47-57`), and `frame/questions.md` Q1's question (`questions.md:12`). The truth of the item 11 quote is finding 2.

What matched, read: the frame's undated sentences agree with the target, apart from finding 2. The *Phases* rows name `c8dc3fa` and `e11311c0`, which the range holds. `questions.md` Q1 to Q3 are closed with what the phase records hold. `gaps.md` removes no row, because the range adds it whole. The phase records' line numbers (`phase-1.md:13`, `:22`, `:30-31`; `phase-2.md:17`) name their phase's tree, and `phase-2.md:17`'s `:205` is the `projects` assertion at `bc7de32a`.

No test the diff adds goes to the suite. Both cases of `role-session.test.ts` are skipped without their variables, and `model-stand-in.ts` is a helper with no case of its own. So no new case is read against a group.

## Not judged

| What | Location | Who answers |
|---|---|---|
| `pnpm run role:run`, the first case, at `bc7de32a`. Q1's default is `no`, and this round's instructions forbid the run. The diff was read for it, above | `apps/desktop/test/role-session.test.ts:160-173` | the owner, as `gaps.md` row 1 names |
| The whole suite, the typecheck and the documents' checks of the `Broad gate` key. Rule 2 gives them to no agent, so they are `unverified` | the whole tree at `bc7de32a` | the orchestrator, at the broad run |
| Whether the CLI reached a host other than the stand-in, or wrote outside the case's two folders, during a run | `gaps.md` rows 3 and 4 | a measurement the orchestrator may order, as `gaps.md` names it |
| The passing runs of scenarios 1 and 2 at `bc7de32a`. This round did not repeat them: the code at the target is that of `e11311c0`, where phase 2 ran them, and this round spent its one run on Scope item 5 | `trail/phases/phase-2.md:31-42` | carried from phase 2's record, which says it executed them, and owed again after a fix to `model-stand-in.ts` by `frame/plan.md:38` |

## Probes

| Command | Result |
|---|---|
| In a `git clone --no-local` at `bc7de32a` under the round's scratch directory: `pnpm install --frozen-lockfile`, then `ANTHROPIC_BASE_URL` in `role-session.test.ts:111` pointed at `http://127.0.0.1:9` through the `Edit` tool, then the wait on `pgrep -f 'vites[t]'`, then `OWLERY_BACKGROUND=1 pnpm run role:refusal`, its exit code read directly, then the edit reverted | Exit 1. 1 case failed and 1 was skipped. The failure is at `test/role-session.test.ts:208:70`: `AssertionError: the CLI did not reach the stand-in model: expected 0 to be greater than 0`. The session ended `failed` with `API Error: Connection refused`. The case took 179.5 s. The kept folder's `config` held `.claude.json`, `backups`, `plugins`, `projects` and `sessions`, and its `home` was empty. The kept folder was then removed |
