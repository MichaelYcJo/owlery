# Review round 3: 1795636143-213-a-panes-tab-has-a-menu

```seal
target: be948ff6, fixes c086e4ac..be948ff6
```

This round reviews one commit, `be948ff6`, which follows the failure of the broad gate at `c086e4ac`. The gate failed on `daemon.test.ts` › *the last look* › "replaces the look with the one of a later `looked`, from whichever client", because the case expected `name` and `colour` in the look's session. The crafter judged the case wrong and not the code, and changed only the case. Round 2 left no finding open, so no close is answered here. Carried from round 1 and not established again: phase 2's paragraph "The last look keeps no name and no colour of a pane" (`trail/phases/phase-2.md:25`) and the case *carries only the fields the protocol names* (`daemon.test.ts:550`), whose filter already leaves `name` and `colour` out of the look's sessions.

## Findings

None.

## Confirmations

What matched: the decision. `last-look.ts#lookOf` (`last-look.ts:155-158`) builds each kept session from fields it names, and `name` and `colour` are not among them. So the look holds neither, as it holds no account. The window reads the look's sessions in one place, `changeOf` (`view.ts:1459`), and only for the state of a work item's line: `inboxLine(held, look.sessions, paneKinds).state`. Every label the summary and the inbox show comes from the current sessions (`view.ts:1445`, `view.ts:1463`). So a look without the given name changes nothing a person sees, and *Scope* item 4's "names the pane everywhere" is not touched. No line of the frame asks the look to keep a name or a colour (read). The expectation the gate refused was the defect, and the code was right.

What matched: the case. `daemon.test.ts:5586-5588` now leaves out `name` and `colour` beside `accountId` and `signsIn`, and compares the rest of the started session with `toEqual`. A look that kept the name or the colour would still fail it, so the case still holds what the look keeps. Its comment says the same. A search for other cases that derive a look's session from a started session found this one alone (executed, `grep -n 'accountId: _\|signsIn: _' test/*.ts`). The other look cases spell the session whole without the two fields (`daemon.test.ts:5569`, `:5638`) and passed before and after.

What matched: why phase 2's narrow run missed it. Phase 2 picked the cases to run by the assertions that gained `NO_MARKS`, and this case built its expectation from `session` and holds no `NO_MARKS`. `gaps.md` row 4 already gave `daemon.test.ts` whole to the broad gate, which then caught the case. The deferral was disclosed and was answered as planned, so this is no finding.

What matched: `daemon.test.ts -t "the last look"` passed at `be948ff6`, 7 cases (executed).

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `be948ff6`, `daemon.test.ts` whole among it: `unverified` | `gaps.md` rows 4 and 6 | the orchestrator's broad gate |

## Probes

| Command | Result |
|---|---|
| `cd apps/desktop && node scripts/test-in-electron.mjs test/daemon.test.ts -t "the last look"` | exit 0: 7 passed, 405 skipped |
