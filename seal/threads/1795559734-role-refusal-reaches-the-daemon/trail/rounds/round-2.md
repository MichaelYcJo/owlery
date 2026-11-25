# Review round 2: 1795559734-role-refusal-reaches-the-daemon

```seal
target: 7005b5a6, fixes 4fd3c38e..7005b5a6
```

This is a verifying round. Its target is the diff from round 1's record, committed at `4fd3c38e`, to HEAD at `7005b5a6`. The diff holds three commits. `bd3bebc1` is the fix pass: it changes `apps/desktop/test/model-stand-in.ts`, `changelog.md:6` and `gaps.md:11`. `ff5c257c` adds the close blocks to `trail/rounds/round-1.md`. `7005b5a6` is the framer's rewrite of `frame/design.md` *Scope* item 11 and *Data & interfaces* (`design.md:87-94`). The code reviewed stays inside that diff. Every record step 3 names was read whole again at `7005b5a6`: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `pr.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. Of those, only `frame/design.md`, `changelog.md`, `gaps.md` and `round-1.md` changed since round 1.

Carried from round 1 and not re-established: the coordinates of the daemon's readers of a Claude Code folder, the Vitest reporter grounds of *Scope* item 10, and *Scope* item 5's behaviour with the stand-in unreachable. The fix diff touches none of them: `role-session.test.ts` is unchanged, and the stand-in's answer to a streamed request is the same as at `4fd3c38e`.

## Findings

### 1. Scope item 11 cites the phase records for "no run sent a messages request that is not streamed", and neither phase record holds that fact

```seal
severity: should
location: `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/design.md:57`
evidence: executed `grep -n "stream\|not streamed\|non-stream"` over `seal/threads/1795559734-role-refusal-reaches-the-daemon/trail/phases/*.md`, which printed nothing; read `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/design.md:32`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/frame/design.md:57`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/trail/phases/phase-2.md:42`, `seal/threads/1795559734-role-refusal-reaches-the-daemon/trail/rounds/round-1.md:63-66`, `apps/desktop/test/role-session.test.ts:193`
regression: round-1#2
```

Why it matters: `7005b5a6` rewrote *Scope* item 11. It now reads that the stand-in holds no answer for a `POST /v1/messages` that is not streamed, because "no run of 2.1.331 sent either (`trail/phases/phase-1.md`, `trail/phases/phase-2.md`)". Neither phase record says anything about whether a request was streamed. The grep above finds no line in either one with the words `stream`, `not streamed` or `non-stream`. They could not have said it: the case prints each request's method, path, tools and tool results, and not its `stream` field (`role-session.test.ts:193`). `phase-2.md:42` says "All twelve requests were `POST /v1/messages?beta=true`, so no run met the 404 row". At `e11311c0` a request that was not streamed was answered with a JSON body and took no 404, so that sentence does not show it either. The fact itself holds, but other records carry it. The framer's probe saw two requests, "each `POST /v1/messages?beta=true` with `stream: true`" (`design.md:32`). The fix pass's six runs at `bd3bebc1` passed with the 404 for such a request in place, and the stand-in refused none of their twelve requests (`round-1.md:63-66`, finding 2's close). The sealer reads this sentence and opens its coordinates. It would find the `count_tokens` half there and not the half this fix added. Before the fix, *Scope* item 11 said the stand-in answers only what a run showed and cited `phase-1.md` for the one request it refused, `count_tokens`, which `phase-1.md:46` holds. The fix extended the refusal to requests that are not streamed, as round 1's finding 2 asked, and kept the old citation for both. That is where the defect came from. `pr.md` quotes only the bold opening sentence of item 11, which did not change, so `pr.md` needs no change. Nothing else states this citation: `frame/plan.md`, `gaps.md` and the helper's comment do not cite the phase records for it.

```markdown
11. **The stand-in model answers what a run showed the CLI asks, and refuses the rest by name.** It holds no answer for `POST /v1/messages/count_tokens`: no run of 2.1.331 sent it (`trail/phases/phase-1.md`). It holds none for a `POST /v1/messages` that is not streamed: the probe's two requests each held `stream: true` (*The probe*, above), and the six runs at `bd3bebc1`, made with the 404 for such a request in place, passed with none of their twelve requests refused (`trail/rounds/round-1.md`, finding 2's close). Such a request takes the 404 row of *Data & interfaces*, which stays, because the server owes every request an answer and the case prints each request it received.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `changelog.md:6` at `7005b5a6` is round 1's replacement text word for word (read, `git diff 4fd3c38e..7005b5a6`). It now says what each run asserted, what the listed runs showed, and that no run traced the CLI's writes outside the two folders. The new `gaps.md:11` row names that untraced gap and gives it an answerer, a measurement the orchestrator may order. Its "three runs listed the two folders afterwards" counts phase 1's one listed run (`phase-1.md:7`) and phase 2's runs 1 and 4 (`phase-2.md:42`) (read). No row of `gaps.md` was removed: the diff adds one line and removes none.

```seal
confirms: round-1#2
```
What holds: at `7005b5a6`, `model-stand-in.ts:80-89` answers a `POST /v1/messages` only where the body holds `stream: true`. Every other request, a messages request that is not streamed among them, takes the 404 with its method and path, plus the words "that is not streamed" for the messages path. The opening comment (`model-stand-in.ts:6-11`) now says the same, and so do *Data & interfaces* (`design.md:87-94`) and the bold sentence of *Scope* item 11 that `pr.md` quotes. Executed: the probe `test_tmp_non_streamed.mjs` sent five requests straight to the helper at `7005b5a6`, once. A non-streamed request and one with `stream: false` each took status 404 with `The stand-in model answers no POST /v1/messages that is not streamed.` A streamed first request took status 200 as `text/event-stream` with a `tool_use` block. A streamed request holding a `tool_result` took a text delta. `count_tokens` took status 404 with `The stand-in model answers no POST /v1/messages/count_tokens.`. The citation the frame's rewrite added to *Scope* item 11 is this round's finding 1, which names this finding on its `regression:` line.

What matched, read: `message()` is still used, by `streamed` for `message_start` (`model-stand-in.ts:42`), so the fix leaves no dead function. `role-session.test.ts` is unchanged in the diff, and it sends the stand-in nothing of its own: only the CLI's requests reach the stand-in. The quote of *Scope* item 11 in `pr.md:10` still stands word for word at `design.md:57`, and so does every other quote in `pr.md`, since `pr.md` and the lines it quotes are unchanged apart from item 11's body. The close blocks of `round-1.md` name `bd3bebc1`, which the range holds.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The six runs of scenarios 1 and 2 at `bd3bebc1`, which `frame/plan.md:38` owes after a fix to `model-stand-in.ts`. This round did not repeat them. The fix pass's close says it ran them and that each exited 0, and this round's probe showed the helper's answer to a streamed request unchanged. The claim rests on the close block alone, because no phase record holds those runs | `trail/rounds/round-1.md:63-66` | carried from the fix pass's close; the sealer reads it at HEAD |
| The whole suite, the typecheck and the documents' checks of the `Broad gate` key. Rule 2 gives them to no agent, so they are `unverified` | the whole tree at `7005b5a6` | the orchestrator, at the broad run |
| `pnpm run role:run` at `7005b5a6`. Q1's default is `no`, and the fix diff does not touch `launched` | `apps/desktop/test/role-session.test.ts:160-173` | the owner, as `gaps.md` row 1 names |

## Probes

| Command | Result |
|---|---|
| `node test_tmp_non_streamed.mjs <clone>/apps/desktop/test/model-stand-in.ts`, run once, with the round's clone checked out at `7005b5a6`. The probe file stays under the round's scratch directory | Exit 0. `POST /v1/messages?beta=true` without `stream`: 404, "The stand-in model answers no POST /v1/messages that is not streamed.". With `stream: false`: the same 404. With `stream: true`, `Bash` among the tools and no tool result: 200 `text/event-stream` with `tool_use` and `input_json_delta`. With `stream: true` and a tool result: 200 with `text_delta`. `POST /v1/messages/count_tokens`: 404, "The stand-in model answers no POST /v1/messages/count_tokens.". The stand-in kept 5 requests |
