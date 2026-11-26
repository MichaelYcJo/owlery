# Review round 1: 1795673151-78-the-app-ships-as-a-signed-dmg

```seal
target: 11ea2efc against e9fe914c
```

The round read `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md` and `pr.md` whole at `11ea2efc`, then the three phase records. `Commit and pull request language` is English, so no `pr.<lang>.md` stands, and `seal/parity.json` does not exist. This is the first round, so no coordinate was carried from an earlier one. The installed packager's text was read in `app-builder-lib@26.18.0` and `builder-util` as the lockfile pins them.

## Findings

### 1. The workflow's ad hoc way fails on GitHub's runner: the packager reads the empty `CSC_LINK` as a certificate path

```seal
severity: must
location: `apps/desktop/src/package/package.ts:157-159`, `.github/workflows/package.yml:57-74`, `apps/desktop/test/package.test.ts:56-82`
evidence: executed `CSC_LINK= CSC_KEY_PASSWORD= APPLE_API_KEY_ID= APPLE_API_ISSUER= pnpm --filter @owlery/desktop run package --tag v0.0.5-package.1` in a clone at `11ea2efc`, with `APPLE_API_KEY` unset (exit 1); read `app-builder-lib/out/platformPackager.js:84-88`, `app-builder-lib/out/platformPackager.js:711-713`, `app-builder-lib/out/macPackager.js:25-50`, `app-builder-lib/out/macPackager.js:323-336`, `app-builder-lib/out/codeSign/codesign.js:8-31`, `builder-util/out/cscLink.js:11-38`
```

Why it matters: with no secret set, which is the state of the repository until the owner's enrolment, every run of the workflow fails at the package step, and release 0.1.0 has no `.dmg`. This is the way the launch of 2026-11-28 ships with.

The grounds. *Scope* item 6 says "A variable that is set and empty counts as not present", and `frame/plan.md:25` says the step "treats an empty value as absent, because GitHub gives an unset secret as an empty string". The claim at `.github/workflows/package.yml:58-59` is "A secret that is not set reads as empty, which the command counts as not set". The command does count it so: `signingWay` (`package.ts:41`) reads `!env[name]`, and scenario D's case at `package.test.ts:26` holds that. But the packager reads the same environment by its own rule. `platformPackager.js:86` takes `process.env.CSC_LINK` through `chooseNotNull`, which at `:711-713` keeps any value that is not `null` or `undefined`, so an empty string comes back as the link. `macPackager.js:27` builds the signing information wherever `cscLink == null` is false, and `macPackager.js:334` awaits it in `sign` before it looks at the identity, also in the ad hoc way with `identity: "-"`. `createKeychain` then calls `importCertificate("")`. `codesign.js:9-31` finds no `https://` prefix, and `decodeCscLinkBase64` (`cscLink.js:14`) returns `null` for an empty string. `resolveCscLinkPath` (`cscLink.js:38`) resolves `""` against the project folder, which is `apps/desktop`, a folder, and `codesign.js:26-27` throws "… not a file". The probe ran the step's command with the environment the workflow gives where no secret is set, and it exited 1 after the packager had copied Electron's app into `out/mac-arm64`. Its last packager line was "empty password will be used for code signing reason=CSC_KEY_PASSWORD is not defined", and the command printed `package: …/apps/desktop not a file`, the path being the clone's. The way of signing had been decided as ad hoc before that, so the refusal is the packager's and not the command's.

Phases 1 and 2 ran `package` with the variables unset, not set and empty (`trail/phases/phase-1.md:54`, `trail/phases/phase-2.md:44`), so no run met this. The case at `package.test.ts:26` holds `signingWay` alone, and no case holds what the packager is handed.

The fix takes the empty signing variables out of the environment the packager reads, in the command, so a person who exports one empty is covered too. `scripts/package.mjs:31` passes `process.env` as `env`, so deleting from `env` deletes from the packager's environment. The precondition is that `env` is `process.env` when the command runs, which `scripts/package.mjs:31` gives.

```ts
// apps/desktop/src/package/package.ts, packageApp
export async function packageApp(appDir: string, env: Record<string, string | undefined>, build: Build, log: (line: string) => void, tag?: string): Promise<{ way: SigningWay; dmg: string }> {
  if (tag !== undefined) checkTag(tag, (JSON.parse(readFileSync(join(appDir, "package.json"), "utf8")) as { version: string }).version);
  const way = signingWay(env);
  // The packager reads a signing variable as set wherever it is not undefined: an empty CSC_LINK makes it
  // import the project folder as the certificate and fail ("… not a file"). GitHub gives a secret that is
  // not set as an empty string, so the empty ones leave the environment. scripts/package.mjs passes process.env.
  for (const name of SIGNING_VARIABLES) if (env[name] === "") delete env[name];
  const built = run(process.execPath, ["build.mjs"], { cwd: appDir });
```

```ts
// apps/desktop/test/package.test.ts, describe("packageApp")
it("takes the empty signing variables out of the environment the packager reads, before it builds anything", async () => {
  const dir = bare();
  const env: Record<string, string | undefined> = { PATH: "/usr/bin", ...Object.fromEntries(SIGNING_VARIABLES.map((name) => [name, ""])) };
  try {
    await expect(packageApp(dir, env, packager, () => {}, "v0.1.0")).rejects.toThrow("The build of dist/ failed");
    expect(env).toEqual({ PATH: "/usr/bin" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

The comment at `.github/workflows/package.yml:57-60` then reads: "The command checks the tag against the app's version and decides the way of signing before it builds anything. A secret that is not set reads as empty, and the command counts it as not set and takes it out of the environment the packager reads. The notarization key is handed to the packager as a file." The search `git grep -n -i -e empty 11ea2efc -- .github/workflows/package.yml apps/desktop/src/package apps/desktop/scripts apps/desktop/test/package.test.ts seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg` printed the statements of the rule: `package.yml:59`, `package.ts:35`, `package.test.ts:26`, `frame/design.md:55`, `:76` and `:117`, `frame/plan.md:25` and two phase records. The frame's lines state the rule this fix makes true and stay. The search is a sample under contract rule 12, since a statement in other words escapes it. Scenario H on the runner (Q4) is the run that shows the fix holds there.

### 2. The checkout leaves the write token in the clone for every later step, the dependencies' install scripts among them

```seal
severity: should
location: `.github/workflows/package.yml:41-43`
evidence: read `.github/workflows/package.yml:29-31`, `.github/workflows/package.yml:41-43`, `.github/workflows/package.yml:54-55`, `.github/workflows/package.yml:82-85`
```

Why it matters: the repository is public, and the job holds `contents: write` (`package.yml:30-31`). `actions/checkout` writes the job's token into the clone's git configuration unless `persist-credentials` is `false`. Every step after it can then read a token that pushes to the repository and edits its releases. Those steps run `pnpm install` (`:55`), whose lifecycle scripts come from the whole dependency tree that the packager's 1,841 lock lines brought in, and the packager itself. No step needs the token from git's configuration: the upload step takes it from `GH_TOKEN` (`:84`), and no step runs `git push`. The question the spawn put, whether the permissions are safe for a public repository, is answered here: the permission the release needs is given to code that does not need it.

```yaml
      - uses: actions/checkout@v4
        with:
          ref: refs/tags/${{ env.TAG }}
          # No step pushes with git. The upload step takes the token from GH_TOKEN, so the clone keeps none
          # for the install's scripts and the packager to read.
          persist-credentials: false
```

A stronger form gives the write permission to a second job alone that downloads the `.dmg` as an artifact and uploads it, with `contents: read` for the job that installs and packages. It costs an artifact upload of about 125 MB per run. The one line above is the least change.

### 3. A third-party action runs by a movable tag inside the job that reads the signing secrets, and the notarization key's file outlives its step

```seal
severity: should
location: `.github/workflows/package.yml:46`, `.github/workflows/package.yml:68-74`
evidence: read `.github/workflows/package.yml:46`, `.github/workflows/package.yml:61-74`, `.github/workflows/check.yml:29`
```

Why it matters: `pnpm/action-setup@v4` is a tag its owner can move. It runs at step 2, before the package step that holds the five secrets. It puts `pnpm` on the `PATH` that the package step then runs (`:74`), and it has a post step that runs at the job's end. A moved tag can therefore read the certificate and its password through the `pnpm` it installed. The notarization key's file, which `:70` writes into `RUNNER_TEMP`, is not removed after the step, so every post step can read it too. `check.yml:29` uses the same tag, but that job reads no secret and holds `contents: read`, so the same reference weighs less there. Pinning the action to a commit is the form GitHub's hardening guide gives for an action that is not GitHub's own. The commit below is not in the tree, so it is marked.

```yaml
      # The version comes from `packageManager` in the root package.json. Pinned to a commit, since this job reads the signing secrets.
      - uses: pnpm/action-setup@<full commit SHA of v4.x>   # NAME NOT IN TREE: the commit of the release the owner pins
```

```sh
          if [ -n "$APPLE_API_KEY_P8" ]; then
            printf '%s\n' "$APPLE_API_KEY_P8" > "$RUNNER_TEMP/notarization-key.p8"
            export APPLE_API_KEY="$RUNNER_TEMP/notarization-key.p8"
          fi
          unset APPLE_API_KEY_P8
          # The key's file goes with the step, so no later step or post step reads it.
          trap 'rm -f "$RUNNER_TEMP/notarization-key.p8"' EXIT
          pnpm --filter @owlery/desktop run package --tag "$TAG"
```

The `trap` assumes the step's shell is `bash`, GitHub's default for `run` on macOS, where `EXIT` runs at the end of the script whether the command fails or not.

### 4. In the Developer ID way a certificate the packager cannot use is skipped with a warning, and the run's summary still says it signed and notarized

```seal
severity: should
location: `apps/desktop/src/package/package.ts:73`, `apps/desktop/scripts/package.mjs:31-32`, `apps/desktop/test/package.test.ts:117-121`
evidence: read `app-builder-lib/out/macPackager.js:323-348`, `app-builder-lib/out/mac/MacTargetHelper.js:20-50`, `app-builder-lib/out/codeSign/macCodeSign.js:46-80`, `app-builder-lib/out/codeSign/macCodeSign.js:225-253`, `app-builder-lib/out/platformPackager.js:613-615`, `apps/desktop/src/package/package.ts:29-32`, `apps/desktop/src/package/package.ts:342-351`
```

Why it matters: the spawn asked whether the owner's adding five secrets is enough, and whether the way fails loudly where something is wrong. The five variables are the packager's own, and `signingWay` refuses a partial set by name, so a missing secret fails loudly before any build. A certificate the packager finds no identity in does not. A certificate of another kind is taken: where no "Developer ID Application" identity stands, `_findIdentity` takes any identity whose name carries none of Apple's prefixes (`macCodeSign.js:236-252`), an "Apple Development" one among them, and Apple's notarization then refuses it, which fails the step loudly. The quiet case is a `.p12` that yields no valid identity at all, such as one exported without its private key, or a certificate that has expired. Then `findSigningIdentity` finds none (`MacTargetHelper.js:20-50`) and calls `reportError`. `reportError` throws only where `forceCodeSigning` is set (`macCodeSign.js:73-78`), and the configuration does not set it (`package.ts:73`, `platformPackager.js:613-615`). So the packager logs "skipped macOS application code signing", `sign` returns `false` before notarization (`macPackager.js:336-338`), and the packager exits 0 with an unsigned bundle. `scripts/package.mjs:32` then writes "Signed with the Developer ID certificate and notarized." into the run's summary, from the way the variables gave and not from what the packager did. The run fails one step later at `package:verify`'s signature check, with "code has no resources but signature indicates they must be present" (the message `trail/phases/phase-1.md:91` recorded for an unsigned package). That names neither the certificate nor the way. An owner whose first `.p12` holds no usable identity reads a summary that says the build was signed and notarized, and a failure that says the bundle has no resources.

`forceCodeSigning` makes the packager throw at the identity, with the identities it found in the imported keychain (`macCodeSign.js:62-75`). The command's `catch` (`scripts/package.mjs:33-37`) then writes "Not packaged:" and that message into the summary.

```ts
// apps/desktop/src/package/package.ts, packagerConfig
  // The Developer ID way fails where the packager finds no identity to sign with, rather than skipping the signature with a warning.
  const signing = way === "ad-hoc" ? { identity: "-", notarize: false } : { notarize: true, forceCodeSigning: true };
```

```ts
// apps/desktop/test/package.test.ts, the case at :117
  it("names no identity in the Developer ID way, so the packager takes the certificate of CSC_LINK, notarizes, and fails where it cannot sign", () => {
    const { mac } = packagerConfig("developer-id", ICNS);
    expect("identity" in mac).toBe(false);
    expect(mac.notarize).toBe(true);
    expect(mac.forceCodeSigning).toBe(true);
  });
```

Scenario F of `frame/design.md:119` lists the Developer ID way's configuration as "no `identity` with `notarize: true`". The fix adds a value to it, so the sentence gains "and `forceCodeSigning: true`". Whether the packager names `forceCodeSigning` under `mac` in its type was not read; `platformPackager.js:614` reads it from the platform's options first.

### 5. The README says Owlery runs on any Mac with Apple silicon, and the app does not open below macOS 13

```seal
severity: should
location: `README.md:15`, `README.ko.md:15`, `seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg/changelog.md:5`
evidence: executed `git grep -n -F LSMinimumSystemVersion 11ea2efc -- .`, `grep -n -e 'Apple silicon' -e 'Apple 실리콘' README.md README.ko.md seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg/changelog.md`; read `seal/threads/1795673151-78-the-app-ships-as-a-signed-dmg/frame/design.md:37`, `node_modules/electron/dist/Electron.app/Contents/Info.plist` (`LSMinimumSystemVersion` 13.0)
```

Why it matters: the first M1 Macs shipped with macOS 11, and a person on macOS 11 or 12 who reads "Owlery runs on a Mac with Apple silicon, an M1 chip or later" (`README.md:15`) downloads a `.dmg` whose app macOS refuses as needing a newer system. The frame's probe read the package's `LSMinimumSystemVersion` as "13.0" (`frame/design.md:37`), and Electron 45.3.3's own `Info.plist` holds the same value, which the packager carries into the bundle. *Scope* item 10 asks the section to say "what Owlery needs on the Mac". The README lists `claude`, `git` and `gh` there and leaves out the system. The search on "Apple silicon" and "Apple 실리콘" printed `README.md:15`, `README.ko.md:15`, `changelog.md:3` and `changelog.md:5`. `changelog.md:3` says only what downloads the `.dmg`, so it stays; the other three take the version. The search is a sample under contract rule 12.

```md
<!-- README.md:15 -->
Owlery runs on a Mac with Apple silicon, an M1 chip or later, and macOS 13 Ventura or later. It does not open on an Intel Mac or on an earlier macOS.
```

```md
<!-- README.ko.md:15 -->
Owlery는 Apple 실리콘, 곧 M1 칩 이후의 칩을 쓰고 macOS 13 Ventura 이후를 쓰는 Mac에서 돌아갑니다. Intel Mac이나 그보다 이전의 macOS에서는 열리지 않습니다.
```

```md
<!-- changelog.md:5, the third sentence -->
The app runs on Apple silicon with macOS 13 or later, and does not open on an Intel Mac or on an earlier macOS.
```

The value comes from Electron's version, so a later Electron can raise it. The README states it as of this build, and a change of Electron is where it is read again.

## Confirmations

What matched: the five variables the workflow sets are the ones the installed packager reads. `CSC_LINK` and `CSC_KEY_PASSWORD` at `app-builder-lib/out/platformPackager.js:86` and `:91`; `APPLE_API_KEY`, `APPLE_API_KEY_ID` and `APPLE_API_ISSUER` at `app-builder-lib/out/mac/MacTargetHelper.js:236-243`, which throws where only some of the three are set. `importCertificate` (`codesign.js:15-20`) takes a base64 `.p12` that is longer than 2,048 characters or ends in `=`, which a Developer ID `.p12` exported from Keychain Access is. With all three key variables present, `notarizeIfProvided` (`MacTargetHelper.js:256-268`) never skips, so the Developer ID way with a usable certificate signs and notarizes, and `@electron/notarize` staples the app. Read; no run has made the way, which stays Q5's.

What matched: a missing secret fails loudly and early. `signingWay` (`apps/desktop/src/package/package.ts:40-45`) throws naming each missing variable, `packageApp` calls it before `build.mjs` (`:158-160`), and `scripts/package.mjs:33-37` writes "Not packaged:" and the sentence into the summary and exits 1. The sentence names the packager's variables, such as `CSC_LINK`, and not the secrets the owner sets, such as `MAC_CERTIFICATE_P12`. The mapping stands in the step's `env` at `.github/workflows/package.yml:63-67` and in `frame/design.md` *Data & interfaces*. Read.

What matched: no run a fork starts reads the signing secrets. `.github/workflows/package.yml:14-22` has `push` of tags and `workflow_dispatch` alone, and both need write access to the repository. Scenario G's searches at `11ea2efc`: `git grep -n 'secrets\.' 11ea2efc -- .github/workflows` exited 0 and printed six lines, all of `package.yml` (the comment at `:5` and `:63-67`); `git grep -n 'pull_request' 11ea2efc -- .github/workflows/package.yml` exited 1. Executed. The tag of a person's request reaches the shell only as `"$TAG"` (`:39`, `:74`, `:88-93`), and the expressions at `:26`, `:39` and `:43` stand in `concurrency`, `env` and `with`, which no shell reads. Read.

What matched: the Korean labels of `README.ko.md:23-24` are Apple's. The Korean edition of Apple's support article 102445, read on 2026-11-26, says "'개인정보 보호 및 보안'을 클릭하고 아래로 스크롤한 다음 '그래도 열기' 버튼을 클릭", and for the alert that follows, "'열기'를 클릭합니다". The English edition gives "Privacy & Security", "Open Anyway" and "Open", as `README.md:23-24` does. Read. What macOS 26 draws on a screen stays the owner's, as the third row of `gaps.md` says; that row's sentence that the labels "were recalled and not read on a screen" now has the article beside it, and the fix pass may say so in the row.

What matched: "Quit Owlery Completely…" is an item of the Owlery menu on macOS, `apps/desktop/src/main/menu.ts:31` and `:52-63`, as `README.md:28`, `README.ko.md:28` and `changelog.md:7` say. Read.

What matched: both READMEs hold 7 lines that open with `#` and 16 that open with `|`, as `trail/phases/phase-3.md:13` says (`grep -c`, executed). That is the part of scenario L the broad gate counts; the gate itself is the orchestrator's.

What matched: the tag's check. `checkTag` (`package.ts:52-55`) lets `v0.1.0` and `v0.1.0-rc.1` through and refuses `v0.1.1`, `0.1.0` and `v0.1`, as scenario E asks (`package.test.ts:47-53`, read). The survived mutant of `trail/phases/phase-2.md:35-37`, the closing `$`, is equivalent over git's ref names: without the `$`, only a string that holds a newline after its suffix, such as `v0.1.0-a` followed by a newline and more, passes where it is now refused, and git refuses a ref name that holds a control character. The phase's sentence "no tag tells the two apart" holds for tags and not for strings. Read.

What matched: the Dock's image. `dockImage` (`apps/desktop/src/main/dock-image.ts:13-15`) and its call at `apps/desktop/src/main/main.ts:217-225` do what *Removes* names, and `TRADEMARKS.md` and `build.mjs`'s comment were rewritten with them. Read.

What matched: the package's user data folder. `extraMetadata: { productName: "Owlery" }` (`package.ts:77`) is what phase 2's fix added, pinned at `package.test.ts:102-105`, and `package:verify` checks the packaged `package.json` (`package.ts:291-293`). Read.

The new cases of `apps/desktop/test/package.test.ts` cover new functions with no earlier group, and none repeats another. The case at `:107-109` pins the constant that the case at `:87-100` compares `appId` with, so the two together hold the value. No test file declares `TARGET` for the pairs `seal layout --pairs` prints: the one hit, `apps/desktop/test/chain.test.ts:222`, is a constant of a case.

#231, merged into the release at `911d9bf0` after this branch's cut, adds `@xterm/addon-search` to `apps/desktop/package.json`'s `dependencies` (`git diff e9fe914c 911d9bf0 -- apps/desktop/package.json`, executed). It enters the package's `node_modules` beside the other `@xterm` modules, which `gaps.md` *Not done* already names. The merge of the release into this branch is not at the target, so the lock's rewrite is the orchestrator's before the gate, as `frame/plan.md` *Overlap with the release* says.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether the workflow runs green on GitHub's runner once finding 1 is fixed: the runner's `sips` drawing the SVGs, `package:verify` starting the app there, and the draft release | `.github/workflows/package.yml` | the orchestrator, by `frame/questions.md` Q4 |
| Whether the Developer ID way signs, notarizes and staples, and whether `disable-library-validation` and the packaged `node-pty` pass notarization | `apps/desktop/src/package/package.ts:73` | the owner, after the enrolment, by `frame/questions.md` Q5 |
| What macOS 26 shows at the first open of a downloaded ad hoc build, and whether it asks for the administrator's password at "Open Anyway", which Apple's article does not say | `README.md:19-24`, `README.ko.md:19-24` | the owner, at a screen, by `frame/questions.md` Q6 |
| The suite, the typecheck and the README count of the broad gate at the work item's last commit: `unverified` by this round, under contract rule 2 | the work item | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `CSC_LINK= CSC_KEY_PASSWORD= APPLE_API_KEY_ID= APPLE_API_ISSUER= pnpm --filter @owlery/desktop run package --tag v0.0.5-package.1`, `APPLE_API_KEY` unset, in a clone at `11ea2efc` after `pnpm install --frozen-lockfile` (exit 0), as one probe file `test_tmp_*` run once | Exit 1. The tag passed, the packager packaged into `out/mac-arm64`, logged "empty password will be used for code signing reason=CSC_KEY_PASSWORD is not defined", and the command printed `package: …/apps/desktop not a file`. No `.dmg` was written. Finding 1. |
| `git grep -n 'secrets\.' 11ea2efc -- .github/workflows`, and `git grep -n 'pull_request' 11ea2efc -- .github/workflows/package.yml` | Exit 0 with six lines of `package.yml`, and exit 1 with nothing printed. |
| `grep -c '^#'` and `grep -c '^\|'` on `README.md` and `README.ko.md` | 7 and 16 in each. |
| `git diff e9fe914c 911d9bf0 -- apps/desktop/package.json apps/desktop/build.mjs` | One line: `@xterm/addon-search` 0.16.0 added to `dependencies`; `build.mjs` unchanged. |
