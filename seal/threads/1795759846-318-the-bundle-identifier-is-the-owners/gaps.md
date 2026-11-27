# Closing memo: the bundle identifier is the owner's

## Scope confirmation

`BUNDLE_ID` in `apps/desktop/src/package/package.ts` and its pin in `apps/desktop/test/package.test.ts` change from `app.owlery.desktop` to `com.akmaios.owlery` at `a6492dde`, and nothing else; `git grep -n -F "app.owlery.desktop"` outside `seal/threads/` printed nothing after the change.

## Not verified

| Item | Who must answer |
|---|---|
| A `.dmg` built with the new value names `com.akmaios.owlery` as its `CFBundleIdentifier`: no build ran here, and `package.ts`'s own check of the built bundle reads it | the `package` job at the release's tag |
| The broad gate | the orchestrator's broad gate |

## Not done

Whether `docs/architecture.md` *Platforms and their order* should say that the macOS bundle identifier is fixed from the first public release, as it says of the Android package name: this work item has no `## Rule changes`, so the settle writes nothing from it, and the sentence is left for the release's settle to weigh.
