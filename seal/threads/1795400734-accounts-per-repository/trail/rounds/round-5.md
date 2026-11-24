# Review round 5: 1795400734-accounts-per-repository

```seal
target: 9a58a55, fixes b76da02..9a58a55
```

This is a verifying round. Its target is the fix diff `b76da02..9a58a55`. `b76da02` committed round 4's record. The diff holds three commits:

- the frame's choice of round 4's second fix, at `c941013`;
- the style comment, at `47c04cb`;
- the close, at `9a58a55`.

No code changes in this diff beyond one CSS comment. The changed lines of `frame/design.md` were read at `9a58a55`. A search was run over the work item's other records and the app's source for any sentence that still says the menu shows a whole name. Carried from round 4, not re-established: what the rule `#ask-account` draws at 1440 by 900, which round 4 measured from both view shots. The fix diff does not change the rule or the shots. `seal/parity.json` does not stand. No test ran, because the diff changes no behaviour.

## Findings

No finding. The one finding the round before closed holds. The fix diff makes no claim that the tree contradicts.

## Confirmations

```seal
confirms: round-4#1
```

The close holds. `frame/design.md:163` now says the Ask field's menu "takes up to the width of a tab (`--tab-width`) while the field gives way: closed, it shows the work item's prefix and about 18 characters of a name, and open, its list shows every name whole". `frame/design.md:270` says the select shows "The work item's (System default)" whole, "a longer name being cut where the closed menu ends and shown whole in its open list". Both sentences describe what the rule draws. The rule is `#ask-account { flex: none; max-width: var(--tab-width); … }` (`apps/desktop/src/renderer/index.html:512`), and round 4's crops measured it at 1440 by 900. The comment at `index.html:511` now says the same. No store limit was added, so `apps/desktop/src/daemon/accounts.ts` is unchanged, as the option chosen asks. A search for claims of a whole name, `git grep -n -i 'name whole\|whole name\|its whole'`, was run over `frame/`, `changelog.md`, `gaps.md` and `pr.md`. It found only the line at `frame/design.md:163`, which now states the limit. A second search, `git grep -n -i 'whole name\|full name'` over the work item and `apps/desktop/src`, found only `worktree-setup.ts:142`, which is about a temporary folder's name. Executed for both searches, read for the rest.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The Ask row's closed and open menu with a long account name, drawn in the built app | `frame/questions.md` Q8 | the owner's walk of the built app (#184) |
| The broad gate at the work item's last commit | `seal/config.json` `Broad gate` | the orchestrator |

This round leaves nothing open. The orchestrator's broad run comes next, then the sealer's spawn.

## Probes

| Command | Result |
|---|---|
| `git grep -n -i 'name whole\|whole name\|its whole'` over the work item's `frame/`, `changelog.md`, `gaps.md` and `pr.md`, and `git grep -n -i 'whole name\|full name'` over the work item and `apps/desktop/src` | only `frame/design.md:163`, which states the limit, and `apps/desktop/src/daemon/worktree-setup.ts:142`, which is about a temporary folder |
