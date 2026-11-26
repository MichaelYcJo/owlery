# Design: the app ships as a .dmg, signed and notarized where the certificate is present (#78)

## Grounding

The tree as read at `845a3e7a`.

`routing.md` stands in this directory and answers `Automation` `yes`. Issue #78 was read with `gh issue view 78 --json title,body,comments,labels,milestone` on 2026-11-26 (`executed`). Its second comment, the owner's of 2026-11-26, cuts the scope: this issue covers the `.dmg` attached to a tagged GitHub release, the update from GitHub Releases moved to #266, and until the Developer ID certificate arrives the workflow builds the `.dmg` unsigned and signs and notarizes only where the certificate's secrets are present. Its first comment, of 2026-11-22, states what #36's study asks of an update, which is #266's now. `seal/follow-up.md`, `seal/parity.json` and `docs/README.md` do not exist (`executed`, `ls`). The body of release `v0.0.4` holds no `### Process changes` heading (`executed`, `gh release view v0.0.4 --json body`), and no changelog fragment under `seal/threads/` holds one (`executed`, `grep -rn`).

| Policy clause | What it fixes for this work |
|---|---|
| `docs/architecture.md` *Platforms and their order*, row 1: "macOS desktop: Signed and notarized, updated from GitHub Releases" | How the Mac app ships. This work builds the download and its signing. The update is #266's. The section gains the rule of the build: *Rule changes*. |
| `docs/roadmap.md` *Releases and the tracker*: "Signed and notarized downloads start with the release that issue #78 brings, whose milestone is `release: 0.1.0`." | The owner's cut of 2026-11-26 makes the sentence untrue for a release built before the certificate arrives. It changes, with the 0.1.0 row's "The first signed release (#78)": *Rule changes*. |
| `docs/roadmap.md` *Releases and the tracker*: "the merge is tagged `v<version>`", and a release's note is built from its changelog fragments | The workflow runs at that tag and attaches the `.dmg` to that tag's release. |
| `docs/architecture.md` *Overall layout*: "The daemon stays alive while the app restarts or updates", and the daemon "writes the SHA-256 of the script it runs into `daemon.json`" | The packaged app starts its daemon from inside the package, and the daemon has to read its own script there. The probe below ran it. |
| `docs/architecture.md` *Conclusions*: "Owlery ships the roles' agent definitions and skills inside the app" | The role bundle is in the package as files the user's `claude` can read. |
| `docs/architecture.md` *Screen framework: Electron*: an app started with `OWLERY_BACKGROUND=1` takes no focus and has no Dock icon | The check of the packaged app starts it that way. |
| `seal/config.json` `Broad gate` | `README.md` and `README.ko.md` hold the same number of headings and table rows, so the README section of *Scope* item 10 goes into both editions. |

**The facts the frame stands on.**

- **Nothing in the tree packages the app.** `apps/desktop/package.json` holds `build` (`node build.mjs`) and `start` (`electron .`), no packager among its dependencies and no `productName`. `.github/workflows/` holds `check.yml` and `owlery-seal.yml`, and neither builds a download (`read`). `git grep -n -e 'electron-builder' -e 'asar' 845a3e7a -- . ':!seal' ':!pnpm-lock.yaml'` prints nothing (`executed`).
- **The files a packaged app reads beside its own script.** `apps/desktop/src/main/main.ts:85` starts the daemon at `join(__dirname, "daemon.js")`, and `:141`, `:163` and `:218` read `preload.js`, `index.html` and `app-icon.png` there. `apps/desktop/src/daemon/main.ts:44-50` takes the daemon's build from `process.argv[1]` and names `chain.js` and the folder `bundle` beside that script. It writes both paths into a shell launcher in the run folder, which a pane's session runs with Electron's binary as Node (`apps/desktop/src/daemon/pane-chain.ts:61`). The user's `claude` loads the role bundle from the folder `bundle`. `apps/desktop/build.mjs` leaves `node-pty` and `ws` out of its bundles, so they load from `node_modules` at run time (`read`).
- **The daemon is started with the app's own binary.** `apps/desktop/src/main/daemon-client.ts:50-54` spawns `process.execPath` with `ELECTRON_RUN_AS_NODE=1`, detached (`read`).
- **The daemon and the panes find `claude` through the person's login shell, not through the app's `PATH`.** `apps/desktop/src/daemon/adapters/claude.ts:135-146` asks `$SHELL -l -i -c` for `command -v claude` and the shell's `PATH`, with `/bin/zsh` where `SHELL` is unset. `apps/desktop/src/daemon/hooks.ts:133-151` starts a Claude Code pane through the same shell, and `apps/desktop/src/daemon/pty.ts#terminalEnv` sets `LANG` for an app opened from the Finder (`read`). So an app started from the Finder needs no `PATH` of its own to find `claude`. No agent ran a real `claude` from an installed app: `frame/questions.md` Q6.
- **The app's name and its folder.** The unpackaged app takes its name from `package.json`'s `name`, so its user data stands under `@owlery/desktop` in the user's Application Support folder (`executed`, `ls`). The window's title and the menu already say "Owlery" (`apps/desktop/src/main/main.ts:134`, `apps/desktop/src/main/menu.ts#menuTemplate`, `read`).
- **The icon's drawings.** `apps/desktop/assets/icon/` holds `app-icon.svg`, `app-icon-small.svg`, the drawing for 32 pixels and under, and `app-icon.png` at 1024 pixels (`executed`, `sips -g pixelWidth`). `main.ts:218` gives the PNG to the Dock at run time, which replaces whatever icon the bundle holds with one image for every size (`read`).
- **`apps/desktop/test/navigation.test.ts:4` already names the packaged page as `/Applications/Owlery.app/Contents/Resources/app/dist/index.html`**, a folder and not an archive (`read`).

**The probe (`executed`, 2026-11-26, macOS 26.5, Apple M3 Pro, Node.js 26.13.1, pnpm 10.33.0).** It ran in a `git clone --no-local` of this branch at `845a3e7a`, under the framer's scratch directory, as three scripts named `test_tmp_*`. In the clone alone, `pnpm --filter @owlery/desktop add -D electron-builder@26.18.0` added the packager, and a configuration file set `productName: Owlery`, `asar: false`, `npmRebuild: false`, `files: dist/**, package.json` and one `dmg` target for `arm64`. Each script exited 0.

| What was run | What it gave |
|---|---|
| `pnpm install --frozen-lockfile`, the packager's add, `node build.mjs` | Each exit 0. The add changed `apps/desktop/package.json` by one line and grew `pnpm-lock.yaml` by about 1,840 lines (`git diff --stat` in the clone). |
| `sips -s format png -z <n> <n>` on each SVG, then `iconutil -c icns` | Exit 0. `sips` drew both SVGs, and the framer read the 32 and 256 pixel images. `iconutil` wrote one `.icns` from ten PNGs. |
| `electron-builder --mac`, with an identity it found no certificate for | Exit 0 in 23 s. `Owlery-0.0.5-arm64.dmg` of 126,155,978 bytes and `Owlery.app` of 280 MB (`du -sh`). The packager logged "skipped macOS application code signing". `codesign --verify --deep --strict` on the app exits 1: "code has no resources but signature indicates they must be present". The executable keeps the linker's ad hoc signature and the bundle has none. |
| `electron-builder --mac --dir` with `identity: "-"` | Exit 0. `codesign -dv`: `Identifier=app.owlery.probe`, `flags=0x10002(adhoc,runtime)`, `Sealed Resources version=2`. `codesign --verify --deep --strict` exits 0. The entitlements hold `allow-jit`, `allow-unsigned-executable-memory` and `disable-library-validation`, which the packager added. `spctl --assess --type execute` exits 3, "rejected", as it does for any app Apple did not notarize. |
| `plutil -p` on the app's `Info.plist` | `CFBundleName` and `CFBundleDisplayName` "Owlery", `CFBundleExecutable` "Owlery", `CFBundleIconFile` "icon.icns", `LSMinimumSystemVersion` "13.0". |
| The package's contents, `ls` | `Contents/Resources/app/` holds `dist`, `node_modules` and `package.json`. `node_modules` holds `node-pty`, `ws`, `node-addon-api` and `@xterm`. `node-pty/build/Release/pty.node` and `spawn-helper` are executable files. |
| The packaged binary as Node, `ELECTRON_RUN_AS_NODE=1 Owlery.app/Contents/MacOS/Owlery -e`, loading the package's `node-pty` and spawning `/bin/echo` | The pane's process printed its line and exited 0. |
| The ad hoc signed app started with `OWLERY_BACKGROUND=1`, `SHELL=/usr/bin/true`, `--user-data-dir` in the scratch directory and a debugging port | The daemon started from inside the package. `daemon.json` holds a `build` equal to `shasum -a 256` of the package's `dist/daemon.js`. The page's `#status` read "Daemon running, no agent", with no notice of another build. The run folder held the launchers `owl-chain` and `owl-run`. The app and the daemon were stopped by their recorded process ids, and `kill -0` found neither afterwards. |
| The same app started with `open -n -g -j` and `--env OWLERY_BACKGROUND=1` | The page read "Daemon running, no agent". The daemon's environment held the calling shell's `PATH`, so `open` from a shell does not reproduce a click in the Finder. What a Finder start gives is Q6's. |

The probe answers a row the settle of release 0.0.1 carried to this issue: the daemon of a packaged app finds its own script at `process.argv[1]` and reads it, where the package is a folder.

**The installed packager's own text (`read`, in the clone, `app-builder-lib@26.18.0`).**

- `out/options/macOptions.d.ts`, `identity`: not set, the packager searches the keychain, and "If none is found, signing is skipped for all architectures — there is no automatic ad-hoc fallback". `null` skips signing. `"-"` opts in to ad hoc signing, which under the hardened runtime needs `com.apple.security.cs.disable-library-validation`.
- `out/options/macOptions.d.ts`, `notarize`: notarization is activated by one of three sets of environment variables, the first of them `APPLE_API_KEY`, `APPLE_API_KEY_ID` and `APPLE_API_ISSUER`, which the text recommends "for security reasons".
- `out/platformPackager.js:86-91`: the certificate is read from `CSC_LINK` and its password from `CSC_KEY_PASSWORD`.
- `dmg-builder@26.18.0`, `out/dmg.js:44`: the `.dmg` itself is signed only where `dmg.sign` is `true`.

**What the published pages say (`read`, 2026-11-26).**

- GitHub's "Events that trigger workflows": `workflow_dispatch` "will only trigger a workflow run if the workflow file exists on the default branch". For `release`, `GITHUB_REF` is the tag's ref.
- GitHub's "Using secrets in GitHub Actions": "secrets are not passed to the runner when a workflow is triggered from a forked repository", `GITHUB_TOKEN` excepted. A secret that is not set reads as an empty string, and a secret cannot be named in an `if:`.
- Apple's "Safely open apps on your Mac" (support article 102445): for an app Apple did not check, the person opens System Settings, clicks Privacy & Security, scrolls down and clicks "Open Anyway", and the warning then offers "Open". The page says its alerts are examples and that the wording differs by version. For software that "has been modified or damaged" the Mac says the app cannot be opened, and the page offers no "Open Anyway" there.

**The two searches of scenario G, run at `845a3e7a` (`executed`).** `git grep -n 'secrets\.' 845a3e7a -- .github/workflows` prints nothing and exits 1. `git grep -n 'pull_request' 845a3e7a -- .github/workflows/package.yml` prints nothing and exits 1, the file not standing yet. Both pathspecs lie outside this directory, so the frame's own quotes of the patterns match neither.

**The orchestrator's finding on the release's other work items**, as the spawn gave it: #188 and #133 are being framed in their own worktrees, and #231 is near its gate. `executed`, `git diff --name-only` against `e9fe914c`: the branches of #188 and #133 hold their `routing.md` alone, and the branch of #231 changes `apps/desktop/package.json`, `pnpm-lock.yaml` and `apps/desktop/src/main/main.ts` among its files.

## Scope

**In.**

1. **One command packages the app on a Mac.** `pnpm --filter @owlery/desktop run package` builds `dist/` and writes `Owlery.app` and `Owlery-arm64.dmg` under `apps/desktop/out/`, which `.gitignore`'s line `out` already ignores. The packager is `electron-builder` at the exact version 26.18.0, a `devDependency` of the desktop package.
2. **The package holds the app as a folder, not as an archive.** It holds `dist/`, `package.json`, and the modules `build.mjs` leaves out of its bundles with what they load. The packager rebuilds no native module: the install's `postinstall` has rebuilt `node-pty` for Electron.
3. **The system names the app Owlery.** The package's product name is "Owlery", its bundle identifier is the value of `frame/questions.md` Q1, its category is developer tools, its version is `package.json`'s, and it is built for Apple silicon (Q2).
4. **The package's icon file holds both drawings.** The command draws an `.icns` from `assets/icon/app-icon-small.svg` for the images of 32 pixels and under and from `assets/icon/app-icon.svg` for the larger ones, with `sips` and `iconutil`, and commits no `.icns`. The command fails, and names the size, where a drawing cannot be made.
5. **A packaged app gives the Dock no image at run time.** The bundle's icon then shows from launch, at each size. An unpackaged app keeps giving the Dock `app-icon.png`, as today.
6. **The signature follows the secrets that are present, in one of three ways.**
   - Where the certificate and the notarization key are all present, the app is signed with the Developer ID certificate under the hardened runtime, and Apple notarizes it.
   - Where none of them is present, the app is signed ad hoc, under the hardened runtime, with the packager's default entitlements, which it gives the Developer ID way too.
   - Where only some are present, the command fails before it packages and names each missing variable. No build goes out signed and not notarized.

   A variable that is set and empty counts as not present.
7. **One command checks a packaged `.dmg`.** `pnpm --filter @owlery/desktop run package:verify` mounts the `.dmg`, copies the app out of it, and unmounts the image, which it also detaches where a check fails before then. It checks what scenario B lists, starts the copied app in the background with a user data folder of its own, and stops the app and the daemon by the process ids it recorded. It exits non-zero at the first check that fails and names it.
8. **A workflow builds the `.dmg` at a release's tag and attaches it to that tag's GitHub release.** `.github/workflows/package.yml` runs at a pushed tag `v*` and on a person's request that names a tag. It runs the two commands of items 1 and 7 on GitHub's macOS runner. Where the tag has a release, it uploads `Owlery-arm64.dmg` there, replacing an asset of that name. Where it has none, it creates a draft release for the tag, titled "Owlery" and the version, and uploads there. Its summary says which of the three ways of item 6 it built.
9. **The workflow refuses a tag that is not the app's version.** The tag without its leading `v` and without a suffix that starts at `-` has to equal `package.json`'s version, and the run fails before it packages where it does not.
10. **Both READMEs say how to install the download.** A section "Install" in `README.md` and `README.ko.md` holds: where the download is, that it is for Apple silicon on macOS 13 Ventura or later (Q2; the bundle's `LSMinimumSystemVersion` is 13.0), the steps of *What a person who downloads the build without the certificate meets* below, what Owlery needs on the Mac (`claude`, `git` and `gh` on the login shell's `PATH`), and how a newer version is installed (Q3).
11. **The install size is recorded.** `apps/desktop/measurements/install-size.md` holds the bytes of the `.dmg` and of the installed app, with the date, the commit, the machine and the commands, for the caps of #75.
12. **The changelog fragment says what a person meets.** It holds the download, the first open of a build without the certificate, and that a newer version is downloaded and installed by hand.

**Out.**

- **The update from GitHub Releases, and delta updates.** #266, by the owner's cut.
- **The three rows the settles carried to #78 that ask what an update leaves running.** They are the two rows on a window attached to a daemon of an earlier build (release 0.0.1) and the row on a daemon started from inside a folder the updater replaced (release 0.0.2). Their line of #78's *Done when* moved to #266, and #133 builds the replacement of an idle daemon in this release. The orchestrator moves the rows in the issues. What a person who replaces the app by hand is told is Q3.
- **A build for Intel Macs, and a universal build.** Q2.
- **The version's move to 0.1.0.** `routing.md` gives it to the release's own work item, #80.
- **A build of the package at every pull request.** `check.yml` stays as it is. A package takes a download of Electron's archive and minutes of the macOS runner at each push, and the workflow of item 8 can be run for a tag before the release's tag (`frame/plan.md` *Alternatives considered*).
- **The Mac App Store.** The owner's decision.
- **Entitlements for a microphone or a camera.** A CLI in a pane that asks for either is refused by macOS under the hardened runtime. No document asks for it.
- **The other sentences of `docs/roadmap.md` that the owner's restructure of 2026-11-26 made untrue**, such as the milestone each release number holds. They are the release's own work item's.
- **The first paragraph of the README's "Run it"**, which still describes release 0.0.1.

### What a person who downloads the build without the certificate meets

The site can say this. Steps 1, 2 and 5 hold for a signed build too, and steps 3 and 4 are gone once the certificate signs the build.

1. The person downloads `Owlery-arm64.dmg`, opens it, and drags Owlery into Applications.
2. The person opens Owlery.
3. macOS refuses the first open with an alert that Apple could not check the app for malicious software. The alert offers no button that opens the app. The wording differs by macOS version (`read`, Apple's article).
4. The person opens System Settings, clicks Privacy & Security, scrolls down, clicks "Open Anyway", and confirms with "Open" (`read`, Apple's article). Which alert macOS shows for this build, and whether it asks once, is `unverified`: no agent opened a downloaded copy at a screen, and Q6 names who does.
5. Owlery opens on the inbox. It starts the person's own `claude`, `git` and `gh` through their login shell, so each has to be installed and on that shell's `PATH`.

A newer version is installed by downloading the `.dmg` again and replacing the app (Q3). On an Intel Mac, and on macOS 12 or earlier, the app does not open (Q2).

A build with no signature at all is not what goes out. On such a bundle `codesign --verify` fails (the probe), which is the state Apple's article describes as modified or damaged and gives no "Open Anyway" for. That is why item 6 signs ad hoc.

## User scenarios & acceptance *(mandatory)*

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A. The package is made without a certificate | Given an installed checkout and no signing variable. When `pnpm --filter @owlery/desktop run package` runs. Then `apps/desktop/out/Owlery-arm64.dmg` and the app stand, the command says it signed ad hoc, and it exits 0. | The recorded run of phase 1, one heavy command. |
| B. The packaged `.dmg` holds an app that starts | Given the `.dmg` of scenario A. When `package:verify` runs. Then each of these holds, and the command exits 0: `codesign --verify --deep --strict` exits 0 on the app copied out of the image; the app's `Info.plist` names "Owlery", the bundle identifier and an icon file that stands in the bundle; the `package.json` inside the package names the product "Owlery"; the app holds `Contents/Resources/app/dist/bundle/` as a folder; the package's `node-pty`, loaded by the app's binary as Node, runs a process that prints a line; the app started in the background shows "Daemon running, no agent" in its status line and no notice of another build; `daemon.json`'s `build` equals the SHA-256 of the package's `dist/daemon.js`; and after the stop neither recorded process id is alive. | The recorded run of phase 1, one heavy command. The probe of *Grounding* ran each check by hand. |
| C. The check refuses an app whose bundle is not signed | Given an app packaged with no signature. When `package:verify` runs on it. Then it exits non-zero and names the signature. | Shown once in phase 1 against a package made with `identity: null`, and recorded in `trail/phases/phase-1.md` (contract rule 15). |
| D. The way of signing follows the variables | Given the five variables of *Data & interfaces*. When all are absent or empty, the way is ad hoc. When all hold text, the way is Developer ID with notarization. When some hold text, the function throws a sentence that names each one that is missing. | Cases of `apps/desktop/test/package.test.ts`, run by name. |
| E. A tag is held against the version | Given version `0.1.0`. Then `v0.1.0` and `v0.1.0-rc.1` pass, and `v0.1.1`, `0.1.0` and `v0.1` are refused with a sentence that names the tag and the version. | Cases of `apps/desktop/test/package.test.ts`, run by name. |
| F. The package's configuration is the one the probe ran | Given the configuration the command hands the packager. Then it holds `asar: false`, `npmRebuild: false`, the product name "Owlery", `extraMetadata: { productName: "Owlery" }` for the `package.json` inside the package, the output folder `out`, the artifact name `Owlery-arm64.dmg`, one `dmg` target for `arm64`, `identity: "-"` in the ad hoc way, and no `identity` with `notarize: true` and `forceCodeSigning: true` in the Developer ID way. | Cases of `apps/desktop/test/package.test.ts`, run by name. |
| G. No run a fork starts reads the signing secrets | Given the workflows. Then `git grep -n 'secrets\.' -- .github/workflows` prints lines of `.github/workflows/package.yml` alone, and `git grep -n 'pull_request' -- .github/workflows/package.yml` prints nothing. | Both searches, run by the builder at phase 2's commit. Their runs at `845a3e7a` are in *Grounding*. |
| H. The workflow attaches the `.dmg` at a tag | Given this branch pushed, and a tag `v<version>-<suffix>` pushed at its head. When the workflow ends. Then a draft release of that tag holds `Owlery-arm64.dmg`, the run's summary says "signed ad hoc", and `package:verify` passes on the downloaded asset. | `unverified` by any agent: no agent pushes. The orchestrator's run, Q4. |
| I. With the certificate, the download opens without an alert | Given the five secrets set. When the workflow runs for a tag. Then the summary says "signed with the Developer ID certificate and notarized", `spctl --assess --type execute` exits 0 on the app, `xcrun stapler validate` exits 0 on it, and a downloaded copy opens with no alert. | Only the certificate can verify it: Q5, the owner's. `package:verify` runs the two commands where the app carries a Developer ID signature. |
| J. A packaged app gives the Dock no image | Given the function that names the Dock's image. Then it names `app-icon.png` beside the script for an unpackaged app, and nothing for a packaged one. | A case of `apps/desktop/test/package.test.ts`, run by name. |
| K. The icon file takes each drawing at its sizes | Given the list of the icon set's images. Then each image of 32 pixels and under names `app-icon-small.svg`, each larger one names `app-icon.svg`, and the list holds the ten names `iconutil` reads. | A case of `apps/desktop/test/package.test.ts`, run by name. How the Dock and the Finder draw it is Q6's. |
| L. Both READMEs hold the section | Given `README.md` and `README.ko.md`. Then each holds the section "Install" with the contents of *Scope* item 10, and the two hold the same number of headings and table rows. | Read at review. The count is the broad gate's, which the orchestrator runs. |

## Data & interfaces

**Commands of `apps/desktop/package.json`.**

| Script | What it runs |
|---|---|
| `package` | `scripts/package.mjs`: builds `dist/`, draws the `.icns`, decides the way of signing, and runs the packager. With `--tag <tag>` it first checks the tag against the version, and refuses before any build where they disagree. It writes the way of signing, or "Not packaged: …", to the run's summary where `GITHUB_STEP_SUMMARY` is set. |
| `package:verify` | `scripts/verify-package.mjs`, with the path of a `.dmg` as its argument, and `out/Owlery-arm64.dmg` where none is given. |

**Functions the cases read**, each in a module that imports nothing of Electron. The names are the builder's to settle (`frame/questions.md` Q7).

| Function | Takes | Gives |
|---|---|---|
| The way of signing | the environment | `"ad-hoc"` or `"developer-id"`, or throws the sentence of scenario D |
| The packager's configuration | the way of signing, the path of the `.icns` | the object of scenario F |
| The tag's check, run inside `package --tag` | a tag, a version | nothing, or throws the sentence of scenario E |
| The icon set's images | nothing | the names, the pixel sizes and the source drawing of each image |
| The Dock's image | whether the app is packaged, the script's folder | a path or `null` |

**The variables the command reads**, which are the installed packager's own (*Grounding*):

| Variable | Holds | The workflow sets it from the secret |
|---|---|---|
| `CSC_LINK` | the Developer ID Application certificate with its key, a `.p12` in base64 | `MAC_CERTIFICATE_P12` |
| `CSC_KEY_PASSWORD` | the `.p12`'s password | `MAC_CERTIFICATE_PASSWORD` |
| `APPLE_API_KEY` | the path of the App Store Connect API key file | `APPLE_API_KEY_P8`, whose text the workflow writes to a file under `RUNNER_TEMP` |
| `APPLE_API_KEY_ID` | the key's id | `APPLE_API_KEY_ID` |
| `APPLE_API_ISSUER` | the issuer's id | `APPLE_API_ISSUER` |

**The workflow `.github/workflows/package.yml`.**

- `on`: `push` with `tags: ["v*"]`, and `workflow_dispatch` with one input, `tag`.
- `permissions`: `contents: write`, which creating a release and uploading to one need.
- `runs-on: macos-latest`, the runner `check.yml` uses.
- Steps: check out the tag, with `persist-credentials: false`; set up pnpm (its action pinned to a commit), Node.js 22 and the install as `check.yml` does; `package --tag`, which checks the tag and writes the way of signing to the summary; `package:verify`; the upload with `gh release`, as *Scope* item 8 states, which adds the release to the summary.
- Each secret is named once, in the `env` of the step that packages.

**The user data folder.** Electron names the app from the `package.json` inside the package, not from the bundle's name, so the package sets its `productName` to "Owlery" (scenario F). A packaged app's name is then "Owlery", so Electron keeps its user data under `Owlery` in the user's Application Support folder. An unpackaged app keeps `@owlery/desktop`. The two run folders are apart, so a start from a checkout and an installed app each have a daemon of their own, and nothing moves from one folder to the other.

## Rule changes

- add
  file: docs/architecture.md
  section: Platforms and their order
  to: **The macOS app ships as a `.dmg` for Apple silicon, attached to the GitHub release of its version's tag, and one workflow builds it.** The workflow runs at a pushed tag `v<version>` and on a person's request for a tag, and at no pull request, so no run that a fork starts reads the signing secrets. Where the repository holds the Developer ID certificate and the notarization key, the workflow signs the app under the hardened runtime and has Apple notarize it. Where it holds none of them, it signs the app ad hoc, and macOS asks the person to allow the first open in System Settings, under Privacy & Security. Where it holds only some of them, the run fails and names the ones that are missing, so no build goes out signed and not notarized. The package holds the app's files as a folder and not as an archive, because the user's `claude` loads the role bundle from that folder and the daemon reads its own script there to name its build. A packaged app keeps its user data under "Owlery", apart from an app started from a checkout. The update from GitHub Releases is issue #266's.
    check: apps/desktop/test/package.test.ts
- add
  file: docs/architecture.ko.md
  section: 플랫폼과 그 순서
  to: **macOS 앱은 Apple 실리콘용 `.dmg`로 내고, 그 버전의 태그에 달린 GitHub 릴리스에 붙이며, 워크플로 하나가 빌드합니다.** 워크플로는 태그 `v<version>`이 푸시될 때와 사람이 태그를 지정해 요청할 때 돌고, PR에서는 돌지 않습니다. 그래서 포크가 시작한 실행은 서명 시크릿을 읽지 못합니다. 저장소에 Developer ID 인증서와 공증 키가 있으면 워크플로는 hardened runtime으로 앱에 서명하고 Apple의 공증을 받습니다. 하나도 없으면 앱에 ad hoc 서명을 하고, macOS는 처음 열 때 시스템 설정의 개인정보 보호 및 보안에서 허용하라고 사람에게 묻습니다. 일부만 있으면 실행이 실패하고 빠진 것의 이름을 알리므로, 서명만 하고 공증하지 않은 빌드는 나가지 않습니다. 패키지는 앱의 파일을 아카이브가 아니라 폴더로 담습니다. 사용자의 `claude`가 그 폴더에서 역할 번들을 읽고, 데몬이 자기 빌드를 알리려고 자기 스크립트를 거기서 읽기 때문입니다. 패키지된 앱은 사용자 데이터를 "Owlery" 아래에 두고, 체크아웃에서 시작한 앱의 것과 섞지 않습니다. GitHub Releases에서 받는 업데이트는 이슈 #266이 맡습니다.
    check: apps/desktop/test/package.test.ts
- change
  file: docs/roadmap.md
  section: Releases and the tracker
  from: Signed and notarized downloads start with the release that issue #78 brings, whose milestone is `release: 0.1.0`.
  to: Downloads start with release 0.1.0: the workflow of issue #78 builds a `.dmg` at the release's tag and attaches it to the GitHub release. The `.dmg` is signed and notarized from the first build made after the Developer ID certificate's secrets are in the repository, and is signed ad hoc until then ([Platforms and their order](architecture.md#platforms-and-their-order)).
- change
  file: docs/roadmap.ko.md
  section: 릴리스와 트래커
  from: 서명과 공증을 거친 다운로드는 이슈 #78이 가져오는 릴리스부터 냅니다. 그 이슈의 마일스톤은 `release: 0.1.0`입니다.
  to: 다운로드는 릴리스 0.1.0부터 냅니다. 이슈 #78의 워크플로가 릴리스의 태그에서 `.dmg`를 빌드해 GitHub 릴리스에 붙입니다. `.dmg`는 Developer ID 인증서의 시크릿이 저장소에 들어온 뒤의 첫 빌드부터 서명과 공증을 거치고, 그 전에는 ad hoc 서명으로 냅니다([플랫폼과 그 순서](architecture.ko.md#플랫폼과-그-순서)).
- change
  file: docs/roadmap.md
  section: Releases and the tracker
  from: The first signed release (#78)
  to: The first release with a download, a `.dmg` on its GitHub release (#78)
- change
  file: docs/roadmap.ko.md
  section: 릴리스와 트래커
  from: 서명한 첫 릴리스(#78)
  to: 다운로드가 있는 첫 릴리스. GitHub 릴리스에 `.dmg`를 붙입니다(#78)

## Removes

This work adds three mechanisms: the package command, the check of a packaged `.dmg`, and a workflow. Nothing in the tree packaged the app or checked a package before them (*Grounding*), so no command, check or workflow goes in return. The two policy sentences the work makes untrue are rewritten through *Rule changes*.

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The unconditional call that gives the Dock `app-icon.png` | `apps/desktop/src/main/main.ts`, the `app.dock?.setIcon` call inside `app.whenReady` | The function of scenario J decides it. A packaged app shows its bundle's icon. |
| The comment's sentence that the Dock "keeps Electron's icon" where the image cannot be loaded | `apps/desktop/src/main/main.ts`, the `catch` under that call | Rewritten to hold for an unpackaged app alone. |

## What the package could do beyond the issue

None of these is in *Scope*, and none was built. The orchestrator takes what is cheap and files issues for the rest.

- **Leave out of the package the modules a bundle already holds.** The probe's package carries `@xterm` and `node-pty`'s builds for other platforms, which no packaged code loads. Moving `@xterm` to `devDependencies` meets #231's change of the same list.
- **Sign and staple the `.dmg` itself.** The packager signs the app and leaves the image unsigned unless `dmg.sign` is set.
- **A background image and a window layout for the mounted image.** The packager's default shows the app beside a link to Applications.

Framed 2026-11-26 by framer, before the build.
