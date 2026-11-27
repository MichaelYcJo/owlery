# Closing memo: the bundle identifier is the owner's

## Scope confirmation

`BUNDLE_ID` in `apps/desktop/src/package/package.ts` and its pin in `apps/desktop/test/package.test.ts` change from `app.owlery.desktop` to `com.akmaios.owlery` at `a6492dde`, and nothing else; `git grep -n "owlery.desktop"` outside `seal/threads/` printed nothing after the change.

## Not verified

| Item | Who must answer |
|---|---|
| A `.dmg` built with the new value names `com.akmaios.owlery` as its `CFBundleIdentifier`: no build ran here, and `package.ts`'s own check of the built bundle reads it | the `package` job at the release's tag |
| The broad gate | the orchestrator's broad gate |

## Not done

nothing
