# Review round 4: 1795400734-accounts-per-repository

```seal
target: 76b0a41, fixes 7730512..76b0a41
```

This is a verifying round. Its target is the fix diff `7730512..76b0a41`. `7730512` committed round 3's record. The diff holds:

- the frame's choice at `468bd81`;
- the CSS at `b0bf997`;
- the retaken view shots at `a91b3d9`;
- `pr.md` at `7be065a`;
- `gaps.md` at `07bd856`;
- the closes at `5134677`;
- the orchestrator's fold at `76b0a41`.

The code reviewed is inside that diff. Of the work item's records, the diffs of `frame/design.md`, `gaps.md` and `pr.md` were read at `76b0a41`, and so was round 3's record with its closes. Earlier rounds read the parts these files did not change, and the fix diff touches nothing they state. The two retaken view shots were read through crops of the Ask row and the pane bar, in both appearances. Carried from round 3, not re-established: the crop offsets of the Ask row and the pane bar, and where the Ask row is styled (`apps/desktop/src/renderer/index.html:508-512`). `seal/parity.json` does not stand. This round ran no test: the fix diff changes a style and records, and no case pins the style.

## Findings

### 1. The Ask row's account menu still cuts any account name longer than about 18 characters, though the frame now says it shows its whole name

```seal
severity: should
location: `apps/desktop/src/renderer/index.html:512`, `apps/desktop/src/renderer/index.html:57`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:163`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:270`
evidence: read `apps/desktop/src/renderer/index.html:57`, `apps/desktop/src/renderer/index.html:508-512`, `apps/desktop/src/daemon/accounts.ts:190-194`, `apps/desktop/src/daemon/accounts.ts:282-286`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:163`, `seal/threads/1795400734-accounts-per-repository/frame/design.md:270`; executed `sips -c 40 420 --cropOffset 492 1020` on both view shots at `76b0a41` in the round's scratch directory, and read the crops
reopens: round-3#1
```

Round 3's finding 1 named one instance: "System default" in the scene. The defect it stands for is a cut account name, and that defect still stands for every longer name, in the unit that `b0bf997` changed. Round 3's own snippet kept the `max-width`, so the gap comes from the snippet that round wrote, and the fix pass applied it as given.

Why it matters: since round 3's close, the frame says the menu "keeps its account's whole name" (`frame/design.md:163`). It also says the menu "shows its whole name, since a name cut short can name another account" (`frame/design.md:270`). The rule `#ask-account { flex: none; max-width: var(--tab-width); … }` (`index.html:512`) still caps the menu at `--tab-width`, which is 240px (`index.html:57`). The crops show the scene's label, "The work item's (System default)", in a menu about 218px wide. That leaves about 22px, or about four characters, before the cap. So with the work item's prefix, an account name longer than about 18 characters is cut. Picked alone, a name longer than about 34 characters is cut. The store refuses only an empty name (`accounts.ts:192`, `:284`), so a person can give any length. Take two accounts named "Work (client Acme)" and "Work (client Bolt)". Each takes the menu past the cap, and both labels are cut where the frame says a cut name "can name another account". The open list draws each option whole, so the cut shows only in the closed menu, which is what the person reads before "Ask". Both crops measure the field at about 108px. Without the cap the menu would take more of that width, and at some length nothing is left.

This defect needs the frame's choice, not only CSS. Two fixes exist:

- **The name has a length the menu always holds.** The store refuses a name past a limit at add and at rename, with a sentence, and the window's field takes `maxlength`. With the prefix and the cap at 240px, the limit is about 18 characters. A wider cap allows a longer limit and leaves the field narrower. The rename case and the add case of `apps/desktop/test/accounts.test.ts` pin the refusal.
- **The frame states the limit of what it shows.** The two sentences say that the menu shows a name whole up to the width of a tab, about 18 characters after the work item's prefix, and that the open list shows every name whole. The CSS stays as it is.

```ts
// apps/desktop/src/daemon/accounts.ts, the first fix: beside the check of an empty name in addHanded, addMade and rename
// NAME NOT IN TREE: ACCOUNT_NAME_MAX, the limit the frame sets so the Ask row's menu holds the name with the work item's prefix
if (named.length > ACCOUNT_NAME_MAX) throw new Error(`An account's name is ${String(ACCOUNT_NAME_MAX)} characters at most, so the menus show it whole.`);
```

```seal
verdict: fixed c941013
location: `seal/threads/1795400734-accounts-per-repository/frame/design.md`
answer: The orchestrator took the record's second fix at `c941013`: `frame/design.md:163` and `:270` now say that the Ask row's closed menu shows the work item's prefix and about 18 characters of a name, and that its open list shows every name whole. The rule `#ask-account { flex: none; max-width: var(--tab-width); … }` at `index.html:512` already draws exactly that, as the round's crops show, so the code locations take no change, and no name limit is added to the store. `47c04cb` rewrites the rule's comment at `index.html:511`, which said the menu keeps its whole name, to say it keeps the prefix and about 18 characters of a name. Neither `changelog.md` nor `gaps.md` says the closed menu shows a whole name.
```

## Confirmations

```seal
confirms: round-3#2
```

The close holds. `pr.md:26-27` link the view shots at `a91b3d98e9a54f9aa4681701c85bfe6f03094a0c`, and `pr.md:28-29` link the menu shots at `927f12d7acc783046645aa608e683e0f5387d623`. Each linked commit holds the image that stands at `76b0a41`:

- `git diff --quiet a91b3d9 76b0a41` over the screenshots folder, and `git diff --quiet 927f12d 76b0a41` over the two menu shots, each exited 0.
- The same check from `9202d1f` over the six inbox, settings and accounts shots that the other lines still link exited 0.

Executed. The pane-bar crops of the retaken view show "Back of the seal", "Setup" and "Claude Code" whole in both appearances. Executed.

```seal
confirms: round-3#3
```

The close holds. `gaps.md:25` now says that each of the four built-app files starts the app through `BuiltApp.start`, which gives it a config folder of its own, with a stand-in shell that answers no lookup. That is what round 3 read at `apps/desktop/test/built-app.ts:204` and in the three stand-in shells. The fix diff changes neither, so the coordinates carry. Read.

What matched with nothing earlier to name: `frame/design.md:270` gives the Ask field's width as about 108px, measured at `a91b3d9`. The crops of both appearances measure about 108px as well. Executed.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The Ask row and the menu of accounts on a pane button, drawn and pressed in the built app at window sizes other than the screenshot run's 1440 by 900 | `frame/questions.md` Q8 | the owner's walk of the built app (#184) |
| The broad gate at the work item's last commit | `seal/config.json` `Broad gate` | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `sips -c 40 420 --cropOffset 492 1020` and `sips -c 60 770 --cropOffset 45 256` on `night-watch-dark-view.png` and `night-watch-light-view.png` at `76b0a41`, written to the round's scratch directory | the Ask menu reads "The work item's (System default)" whole, in a menu about 218px wide beside a field about 108px wide; the pane bar shows the three tabs whole |
| `git diff --quiet <commit> 76b0a41 -- <shots>` for `a91b3d9`, `927f12d` and `9202d1f` over the shots `pr.md` links at each | exit 0 for each |
