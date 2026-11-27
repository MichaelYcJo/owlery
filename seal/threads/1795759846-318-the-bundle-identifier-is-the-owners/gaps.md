# Closing memo: the bundle identifier is the owner's

## Scope confirmation

`BUNDLE_ID` in `apps/desktop/src/package/package.ts` and its pin in `apps/desktop/test/package.test.ts` change from `app.owlery.desktop` to `com.akmaios.owlery` at `a6492dde`, and nothing else; `git grep -n -F "app.owlery.desktop"` outside `seal/threads/` printed nothing after the change.

## Not verified

| Item | Who must answer |
|---|---|
| closed A `.dmg` built with the new value names `com.akmaios.owlery` as its `CFBundleIdentifier`: no build ran here, and `package.ts`'s own check of the built bundle reads it | a measurement no record asks for: `package.ts` reads the built bundle's `CFBundleIdentifier` against `BUNDLE_ID` and fails the `package` job on any other value, so the tag's build answers it and nothing waits on a separate reading |
| closed The broad gate | answered: the broad gate's run at `21234e23` (`trail/gate.md`), after which only this work item's records changed to the pull request's head (`git diff --name-only`); the `check` run of #335, run 46014156485, passed |

## Not done

Whether `docs/architecture.md` *Platforms and their order* should say that the macOS bundle identifier is fixed from the first public release, as it says of the Android package name: this work item has no `## Rule changes`, so the settle writes nothing from it, and the sentence is left for the release's settle to weigh.
