# Phase 2: 1795673151-78-the-app-ships-as-a-signed-dmg

## What this phase found

**A defect of phase 1: the packaged app was named `@owlery/desktop`, and so kept its user data in the same folder as an app started from a checkout.** `frame/design.md` *Data & interfaces*, *The user data folder*, states that a packaged app's name is "Owlery" and that the two folders stay apart. The packager's `productName` names the bundle, and it does not write a `productName` into the package's `package.json`, whose `name` stays `@owlery/desktop` (`read`, the package built at `12c02961`). Electron names the app from that file. A probe in the phase's scratch directory started the package of `12c02961` in the background, with a user data folder of its own, and read `app.getName()` through the main process's inspector: `"@owlery/desktop"`, with `isPackaged` true (`executed`, exit 0). A packaged app started from the Finder would then have met the daemon of an app started from a checkout, the case `frame/plan.md` *Alternatives considered* rejects in its row "Point the packaged app at the unpackaged app's folder". `package:verify` had not seen it, because it starts the app with `--user-data-dir`.

- `efe69004` adds `extraMetadata: { productName: "Owlery" }` to `packagerConfig`, and a case of scenario F pins it. The case was seen red before the fix ("expected undefined to deeply equal { productName: 'Owlery' }"), and `seal mutate` of `productName` to `name` read `red` (`executed`).
- `package:verify` gains a check: the app's `Contents/Resources/app/package.json` names the product Owlery. Run on the `.dmg` of `12c02961`, it exited 1 with "FAILED the app's name: Contents/Resources/app/package.json names the product undefined, not "Owlery"" (`executed`). Scenario B's list in `frame/design.md` does not name this check.
- After the fix, the same probe read `"Owlery"` on the package of `efe69004` (`executed`, exit 0). The app and the daemon it started were gone after the stop, and its user data folders under the system's temporary folder were removed.

**The tag's check stands inside the package command, and not as a step of its own.** `pnpm --filter @owlery/desktop run package --tag <tag>` checks the tag against `package.json`'s version before it decides the way of signing and before it builds anything. The workflow's package step passes the tag. `frame/design.md` *Data & interfaces*, *The workflow*, lists "the tag's check" as a step before "package"; one command keeps the order a case can hold, where two steps would hold it only in the workflow's text. Judged against *Scope* item 9, which asks that the run fail before it packages.

**The run's summary is written by the package command.** Under GitHub Actions, `scripts/package.mjs` appends the way it signed (`WAY_SENTENCE`), or "Not packaged:" and the refusal, to the file `GITHUB_STEP_SUMMARY` names. The upload step appends whether it attached the `.dmg` to a release or created a draft. A run on this Mac with `GITHUB_STEP_SUMMARY` set to a scratch file and the tag `v9.9.9` exited 1 before building anything. It printed "package: The tag v9.9.9 is not the app's version 0.0.5. …", and the summary file held the same sentence after "Not packaged:" (`executed`). The run also showed that pnpm hands `--tag` to the script.

**Decisions in `.github/workflows/package.yml`, each judged against `frame/design.md` *Data & interfaces*, *The workflow*.**

- The tag reaches each script as the job's variable `TAG`, never as text inside a script, since the tag of a person's request is free text.
- The notarization key's file is written only where `APPLE_API_KEY_P8` holds text. A file written from an empty secret would set `APPLE_API_KEY` to a path, and the command would count that variable as set and refuse the run as "only some".
- Whether the tag has a release is read from `gh release list`, which lists drafts too, so a second run for a tag whose release is still a draft uploads into that draft and does not make a second one. `gh release view <tag>` reads the release of a pushed tag and may not find a draft. Neither has been run on GitHub (Q4).
- `GH_TOKEN` is `github.token`, so the file names no secret beyond the five.
- Runs for one tag do not overlap (`concurrency` by the tag, not cancelled), since two runs would upload over each other.

**Scenario E's cases, and the order the command refuses in.** At `efe69004`, `apps/desktop/test/package.test.ts` holds 25 cases. Phase 2 added the cases of `checkTag`, and two cases of `packageApp` that run it in a folder holding only a `package.json`, so a build started there fails with a sentence of its own. Seen red:

- Before the code: each case of `checkTag` failed with "checkTag is not a function", and the case of the tag in `packageApp` failed with "The build of dist/ failed" (`executed`). The case of only some signing variables passed there, since phase 1 already decided the way first.
- `seal mutate` at `e8ae42d6`, each break against the cases `-t` names (`executed`):

| Unit | Break | Case run | Verdict |
|---|---|---|---|
| the leading `v` | `^v(` to `^v?(` | "refuses 0.1.0 for" | red |
| the suffix | the group `(?:-.*)?` removed | "lets v0.1.0-rc.1 through" | red |
| the comparison with the version | `named !== version` to `named === undefined` | "refuses v0.1.1 for" | red |
| the tag is checked where one is given | `tag !== undefined` to `tag === ""` | "refuses a tag that is not" | red |
| the way is decided before the build | the line `const way = signingWay(env);` removed | "refuses only some of the signing" | red |
| the regular expression's closing `$` | removed | "refuses v0.1.0.1 for" | SURVIVED |

The `$` that survived is an equivalent mutant. `[^-]+` takes every character up to a `-`, and the optional group takes the rest. So the expression matches to the end of the tag with the `$` and without it, and no tag tells the two apart.

**Scenario G's two searches at `e8ae42d6`** (`executed`):

- `git grep -n 'secrets\.' e8ae42d6 -- .github/workflows` exited 0 and printed six lines, all of `.github/workflows/package.yml`: the comment at line 5 and the five secrets in the package step's `env`.
- `git grep -n 'pull_request' e8ae42d6 -- .github/workflows/package.yml` exited 1 and printed nothing. The same pattern over `.github/workflows/check.yml` printed its `pull_request:` line, so the pattern finds the word where it stands.

**One run of `package` and of `package:verify` at `efe69004`.** `pnpm --filter @owlery/desktop run package --tag v0.0.5-package.1` exited 0 and printed "Signed ad hoc: …". `package:verify` exited 0, with its checks' lines as phase 1 records them, and the new line "ok   the app's package.json names the product Owlery, so its user data stands under "Owlery"" (`executed`). The `.dmg` was 124,928,842 bytes.

**The workflow file was parsed and not run.** `ruby -ryaml -e 'YAML.load_file(...)'` read it without an error (`executed`). Scenario H, the run itself on GitHub's runner, is `gaps.md`'s row for Q4.

**The phase's set of cases.** `apps/desktop/test/package.test.ts` is the one test file that reads a path the phase changed: no test file reads `.github/workflows/` of this repository or `scripts/package.mjs`. `pnpm run test test/package.test.ts` at `efe69004` exited 0, 25 passed (`executed`).
