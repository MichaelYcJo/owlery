# Phase 1: 1795497826-pane-carries-the-chain

## What this phase found

### Where the tree contradicted the frame

**The screenshot run started four chains through the client message, and nothing can start one in the built app once the message is gone.** `frame/plan.md` phase 1 asks for "the screenshots' scenes without a press", which reads as if the scenes stand once the button is out of them. At `5b520ed`, `apps/desktop/test/screenshots.test.ts:302` sends `getSeal` as a second client of the daemon, and lines 498, 521, 547 and 548 call it for four work items. The app's daemon runs in a process of its own, so a case has no `Daemon` object to call `startChain` on. `frame/design.md` *Removes* row 3 says the same of the cases of `get-a-seal.test.ts` and does not say it of the screenshot run.

Decision: the run commits a chain's records with git in each worktree and appends the finished work item's stages to the daemon's ledger, which is how `apps/desktop/test/seal-back-view.test.ts` already built its scene. Grounds: scope item 11 removes the message from the daemon, so no driver is left, and a way into the daemon kept for one test would be the path the issue's *Done when* removes. Judged against `frame/design.md` scope item 11 and *Removes* row 3. The run was executed once after the change and wrote its sixteen files.

**That decision leaves three rules of `docs/design.md` untrue, and the frame names none of them.** *A pull request that changes the window carries its screenshots* says at line 503 that the run starts four chains and that two stay at work, at line 513 that the parked work item carries a chain whose broad gate passed and lists that gate under "Ask", and at line 516 that the finished work item carries a pull request whose checks passed. Each ends with `check: apps/desktop/test/screenshots.test.ts`. After this phase the run shows no stage at work, no gate's line and no pull request. `frame/design.md` scope item 18 names two other places of that document. Policy outranks the frame, so this is not the crafter's to settle: the hand-back carries it as a question for a person. A second build keeps lines 513 and 516 true: a case can write the daemon's run folder before the app starts (`apps/desktop/test/built-app.ts`, `writeRun`), so a stored chain with a passed gate and a stored pull request can be drawn with no start. It cannot keep line 503's stage at work, because `chain.ts#chainRead` reads a chain stored `running` as stopped. That build adds to this one and undoes nothing of it.

**Two more built-app cases ran a chain, in a file *Removes* row 3 does not name.** `apps/desktop/test/approval-line.test.ts` at `5b520ed` lines 200 and 225 started a chain for a second work item and read the proofer's place at work and then failed. They went with the three of `get-a-seal.test.ts`, for the same reason. `apps/desktop/test/view.test.ts` holds the functions they drew.

**`get-a-seal.test.ts` had little left to move.** *Removes* row 3 says its cases of the seal's place, held and broken, move to a built-app case that commits the records with git. `approval-line.test.ts` already held both. What it lacked moved into its broken case: the line that waits and says "Seal broken", the notification of the broken seal, and the seal's sentence under the head at the foot. The pull request under the seal's place did not move: the daemon first stores a pull request at its chain's pull request stage (`Daemon#runPullRequest`), and afterwards only reads that one again, so no built-app case can show one now.

**A fixture and most of another went with the chains, which *Removes* does not name.** `apps/desktop/test/fixtures/sample-gh/gh` had two users, `get-a-seal.test.ts` and the screenshot run's finished chain, and has none now, so the file is removed. Row 6 lists it as a line to rewrite. `fixtures/sample-cli.sh` keeps the version, the held prompt and the failure, and loses every answer to a chain's stage.

**`docs/design.md:458` and `docs/design.ko.md:458` named the deleted file on a `check:` line.** `seal rules --check` exited 1 on those two lines once `get-a-seal.test.ts` was gone, and exits 0 with the name taken out. The plan gives the documents to phase 6, and this one line could not wait for it. Nothing else under `docs/` changed.

**`apps/desktop/test/role-bundle.test.ts:157` pinned a sentence of the bundle by the button's name.** The phase's search must print nothing under `apps/desktop/test/`, and the sentence itself is phase 3's. The case now pins the same sentence of `docs/forms/the-guarantee.md` by other words of it, "the person fixes what the reason names and starts". Phase 3 meets that pin when it rewrites the sentence.

**Scenario 13 names one file for two halves.** The back's half is a case of `apps/desktop/test/seal-back.test.ts`. The composed body's half is a case of `apps/desktop/test/pull-request.test.ts`, where the cases of `github.ts#backSection` stand.

### Decisions made while building

**`Daemon#startChain` resolves once the chain has started and rejects with the refusal's sentence.** The `getSeal` case answered `done` or `error` on a socket. A method has no socket, so the caller awaits it. It keeps the case's wait behind `this.changing`, its refusal for a work item nothing runs in, and its `broadcastInbox`. A refused start is caught off the queue, so it holds back nothing behind it. Judged against `frame/design.md` scope item 12.

**The cases start a chain through their client, which now holds the daemon.** `apps/desktop/test/chain-run.ts#client` takes the daemon's address, or the address with the daemon, and its `startChain` calls the method with `byPerson` true. The call returns in the case's own process before the socket delivers the lists the start sent, and a list sent before the start can still arrive after it. So the helper waits for a list received after the call that carries the chain as running. Without that wait two cases of `chain.test.ts` failed on a stale list.

**The foot's function is `view.ts#chainSays`.** `sealButton`, `refusedSeal` and `SealRefusal` held the button's words, its state and its refusal. Only the chain's sentence is left to draw.

**The back's sentence stands in `Back.sums`.** The window draws `sums` and `github.ts#backSection` writes them, so one field puts the sentence in both with no second change. It is given where no entry of the ledger has a `chain`, so a session asked outside the chain does not take it away. One existing case of `seal-back.test.ts` composed a round with outside sessions alone and read `sums` as empty, and now reads the sentence there.

**The sentences that named the button.** `chain.ts#notConvergingSays` and `#ceilingSays` say "The next start runs", as scope item 12 asks. `chain.ts#routingText` says "Answered <date> by Owlery, at the first start of the work item's chain." and "its chain was started for a seal on it", so the routing reads true whoever starts the chain. `daemon.ts#whyNoChain` says "Its chain can start once the session has finished." and promises no start, because nothing queues one.

**`chain_check.py`'s refusal changed in two sentences.** The first says "start the chain again, in the pane's session or by Owlery's daemon", which scope item 18 names. The last said that Owlery's daemon then runs the gate and the sealer's stage, which the first sentence made false for a pane, so it says "The chain then runs". The sentence on an `undecided` verdict is unchanged, and `gaps.md` names it.

**The comment on the message went with the message.** `protocol.ts` described the whole chain above `getSeal`. `chain.ts`, `Daemon#runChain` and `Daemon#whyNoChain` state the same order and the same refusals in their own comments, so nothing was moved.

### What was seen red

- The two cases of the back's sentence failed before the code: `seal-back.test.ts` on `expected [] to deeply equal [ Array(1) ]`, and `pull-request.test.ts` on the sentence missing from the section.
- `seal mutate` on `seal-back.ts`: four mutants red, the condition flipped, each half of its second term dropped, and the sentence cut.
- `seal mutate` on `view.ts#chainSays` returning nothing: red on the foot's case.
- `seal mutate` on `chain_check.py`: two mutants red, one in each changed sentence.
- `seal mutate` on `chain.ts`: four mutants red, one in each reworded sentence.
- `seal mutate` on `Daemon#startChain`: `byPerson` passed as false, red; the refusal for a work item nothing runs in removed, red; `whyNoChain`'s sentence cut, red; the catch off the queue removed, red.
- Two mutants of `startChain` first SURVIVED: the wait behind `this.changing` replaced by no wait, and `broadcastInbox` removed. Neither was watched before this phase either. Each got a case in `chain.test.ts`, "starts only once a rename of the branch that is under way has ended" and "sends every client the lists that carry the chain as running", and each mutant is red against its case.
- The built app, each a run of `approval-line.test.ts`: a button put back into the foot in `index.html`, red on three cases; the foot's sentence set to nothing in `work-item-view.ts`, red on the new case of a stored chain.

### What the next phases need

- **Phase 2.** `Daemon#startChain` and `beginChain` are where a refusal of a branch that left its base lands (scope item 13). The cases call `c.startChain(id)`, which answers `done` or the refusal's sentence.
- **Phase 2.** A built-app case can show a chain or a pull request only by writing the run folder before the app starts. `approval-line.test.ts` now does so for one work item with a stored stopped chain, which is the one built-app case of a chain's sentence at the foot.
- **Phase 3.** The bundle's three lines that name the button are untouched: `agents/orchestrator.md:103`, `agents/sealer.md:123` and `docs/forms/the-guarantee.md:25`.
- **Phase 6.** `docs/design.md` lines 503 to 523 and the same lines of the Korean edition describe the screenshot run as it was. Scope item 18 does not list them.
- **Any phase that opens a pull request with screenshots.** `pnpm run screenshots` now shows the broken work item's back with the sentence of scope item 14 and the finished one's with each stage's cost.
