# Implementation Plan: the app ships as a .dmg, signed and notarized where the certificate is present (#78)

## Technical context

The tree as read at `845a3e7a`.

**The build the package starts from.** `apps/desktop/build.mjs` writes everything the app runs into `apps/desktop/dist/`: the five bundles, the page, the styles, the drawings and the role bundle as the folder `dist/bundle`. `package.json`'s `main` is `dist/main.js`. The package command runs this build first and hands `dist/` to the packager unchanged.

**What reads a path inside the package from outside the app's own code.** These are why the package is a folder (`frame/design.md` *Grounding*, the second fact):

- `apps/desktop/src/daemon/main.ts:44` takes the SHA-256 of the daemon's own script, and `apps/desktop/src/main/daemon-client.ts#otherBuild` takes it of the script the app would start. The two have to read the same bytes.
- `apps/desktop/src/daemon/main.ts:48-50` writes the paths of `chain.js` and of `bundle` into shell launchers in the run folder. A pane's session runs the launcher, which starts Electron's binary as Node on `chain.js` (`apps/desktop/src/daemon/pane-chain.ts:61`).
- The user's `claude` is handed the folder `bundle` as a plugin folder and reads its files itself.

**What the package command adds around the packager.** Three things the packager does not decide for this app: the way of signing from the variables that are present (`frame/design.md` *Scope* item 6), the `.icns` drawn from two SVGs (item 4), and the artifact's fixed name. The decisions are functions the cases read. The run of the packager and the check of its result are commands, recorded once by the phase that builds them, and run again by the workflow at each tag.

**The Dock's image.** `apps/desktop/src/main/main.ts:216-222` gives the Dock `app-icon.png` at every start. In a packaged app that call replaces the bundle's icon file with one image, so the drawing for 32 pixels and under would never show. The call moves behind a function that names no image for a packaged app (*Scope* item 5).

**Constraints.**

- `package` and `package:verify` are heavy commands: the first runs the build and the packager, the second starts the app. An agent runs each alone, in its turn on the machine, and never beside a run of the suite.
- `package:verify` starts the app with `OWLERY_BACKGROUND=1`, a user data folder of its own under a temporary folder, and `SHELL` set to `/usr/bin/true`, as `apps/desktop/measurements/built-app-launch.md` did, so no shell and no `claude` starts. It records the app's process id and the daemon's, from `daemon.json`, and stops both by those ids.
- No case of the suite runs the packager. A case that did would download Electron's archive and take the packager's 14 to 23 seconds at every run of the suite (`frame/design.md` *Grounding*, the probe).
- The packager finds signing identities in the keychain of the Mac it runs on. The ad hoc way names `identity: "-"`, so a certificate that happens to be in a person's keychain is never used. The probe ran with one development certificate in the keychain and signed ad hoc.
- The workflow reads each secret into the environment of the step that packages, and that step's script treats an empty value as absent, because GitHub gives an unset secret as an empty string.
- The version stays `0.0.5` in this pull request. The tag's check of *Scope* item 9 lets a tag with a suffix through, so the workflow can be run on this branch before the release moves the version (`frame/questions.md` Q4).

**The failure scenario of this approach.** The package is checked by commands and not by the suite, so a later change that breaks the packaged app alone is found at the next tag and not at its pull request. Such a change is one that reads a file where the package does not hold it, or that adds a module the bundles leave out. The workflow fails at `package:verify` then, with the release's tag already pushed. The run on a tag with a suffix before the release's tag (Q4) is what finds it earlier, and it is a step of the release, not of each pull request. The second scenario is the certificate: the Developer ID way is built from the installed packager's text and has never run (Q5). Its first run is the owner's, on a tag that already has an ad hoc `.dmg`, so a failure there leaves the ad hoc download in place.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Package with `electron-builder` 26.18.0 | A dependency of about 1,840 lock lines. Its defaults change between versions, so the version is exact and scenario F pins the configuration. | Chosen. The probe built, signed ad hoc and started a package with it in 23 seconds. It reads the certificate and the notarization key from variables, and #266's update from GitHub Releases is its companion library's. |
| Package with `@electron/packager`, and make the `.dmg`, the signature and the notarization with scripts of this repository over `hdiutil`, `codesign` and `notarytool` | Each of the three is a script nobody else maintains, and the signing order of a bundle's nested code is where such scripts fail. None of them could be run against a Developer ID certificate before the launch. | Rejected. |
| Electron Forge | It owns the build as well as the package, so `build.mjs` and the `start` script would be rewritten around it two days before the release. | Rejected. |
| Keep the app's files as a folder (`asar: false`) | The packager warns that it is "strongly not recommended". The app's files are readable and editable in place, and Electron's integrity check of an archive cannot be turned on. The signature seals each file, so an edit breaks it. | Chosen. The premise that keeps the structure: three readers outside the app's own code open paths inside the package (*Technical context*). Checked: `daemon/main.ts:44-50` and `pane-chain.ts:61` read, and the probe's packaged daemon wrote a `build` equal to its script's SHA-256 and showed no notice of another build. `test/navigation.test.ts:4` already names the folder. |
| Replace the folder with an archive (`asar: true`) and unpack what outside readers open: the role bundle, `chain.js`, `daemon.js` and `node-pty` | Every path the daemon writes into a launcher or hands to `claude` has to be rewritten from the archive's path to the unpacked one, in `daemon/main.ts` and `chain-main.ts`. A path left unrewritten works in a checkout and fails in the package alone, where no case of the suite runs. `buildOf` has to read the same bytes from both sides of the archive. | Rejected for this release. It is a change to how the daemon finds its files, with no case that would hold it. |
| Sign ad hoc where the secrets are absent | A person meets the alert and the detour through System Settings at the first open. | Chosen. The bundle's signature verifies (the probe), which leaves Apple's "Open Anyway" path open. |
| Build with no signature where the secrets are absent (`identity: null`) | `codesign --verify` fails on the bundle (the probe). Apple's article gives no way to open software it reads as modified or damaged. | Rejected. |
| Publish no `.dmg` until the certificate arrives | The launch of 2026-11-28 has no download. | Rejected by the owner's cut. |
| Fail the run where only some secrets are present | A secret mistyped at the certificate's arrival stops the run, and the release keeps its earlier `.dmg`. | Chosen. |
| Sign without notarizing where the certificate is present and the notarization key is not | The build reads as signed in the run's summary and still meets the alert at first open. | Rejected. |
| Run the workflow at a pushed tag and on a person's request for a tag | The tag's push starts the build before the release exists, so the workflow creates a draft. A release step that creates the release itself, at the same moment, gets the upload a few minutes after it is public. | Chosen. The draft lets the release be published with its `.dmg` already attached. It can be run on this branch before the merge. The request for a tag is how the owner rebuilds a released tag once the certificate arrives. |
| Run the workflow when a release is published | Each release is public for the length of the build with no download, and the stable link of the artifact's name answers 404 for that time. | Rejected. |
| Build the package at every pull request, in `check.yml` | Minutes of the macOS runner at each push, where `check` already waits for a runner. | Rejected. See the failure scenario above for what it would have caught. |
| Name the artifact `Owlery-arm64.dmg`, with no version | The file in a person's Downloads folder does not say its version. | Chosen. A name that does not change lets the site keep one link to the newest release's asset (*Operational impact*, the site's link). The mounted image's title and the app's About panel say the version. |
| Name the artifact with its version, the packager's default | The site's link changes at each release, or points at a page and not at the download. | Rejected. |
| Draw the `.icns` at package time from the two SVGs | `sips` draws SVG on macOS 26.5 (the probe). On a runner whose `sips` does not, the command fails and names the size. The run of Q4 answers it for GitHub's runner. | Chosen. No binary is committed, and a change of either drawing reaches the package with no second step. #201 changes the drawings in this release. |
| Commit an `.icns` | A change of a drawing leaves the committed file stale unless a second step redraws it. | Rejected. |
| Give the packager `app-icon.png` alone | The packager scales one image to every size, so the drawing for 32 pixels and under is in no package, which the issue asks for. | Rejected. |
| Build for Apple silicon alone | A person with an Intel Mac cannot open the app. | The default of Q2. No Intel Mac has run Owlery: the suite runs on GitHub's arm64 runner and on the owner's Mac. |
| A universal build, or a second `.dmg` for Intel | A build nobody has started goes out in the first public release. A universal `.dmg` is about twice the size. | Q2's other options. |
| A packaged app keeps its user data under "Owlery" | The owner's repositories and accounts of the unpackaged app do not appear in the installed one. | Chosen. It is what Electron does with the product name. A start from a checkout then never meets the installed app's daemon. |
| Point the packaged app at the unpackaged app's folder | One daemon would serve an installed app and a checkout of another build, and each would tell the person to restart it. | Rejected. |

## Phases

The phases follow the launch: the package this Mac makes and opens first, the workflow at a tag next, the words last.

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* 1 to 7 and 11, with the rows of `frame/design.md` *Removes*. | Scenarios D, F, J and K as cases of `apps/desktop/test/package.test.ts`, run by name, each shown red first (contract rule 15). One run of `package` and then one of `package:verify`, each a heavy command run alone: scenarios A and B, with each check's line in `trail/phases/phase-1.md`. Scenario C, shown once against a package made with `identity: null`. The bytes of *Scope* 11 are that run's. | |
| 2 | *Scope* 8 and 9. | Scenario E as cases of `apps/desktop/test/package.test.ts`, run by name. Scenario G's two searches at the phase's commit: the first prints lines of `.github/workflows/package.yml` alone, and the second prints nothing. Scenario H is `unverified` at the phase's close and goes into `gaps.md` with the orchestrator as its answerer (Q4). Scenario I is `unverified` and goes into `gaps.md` with the owner as its answerer (Q5). | |
| 3 | *Scope* 10 and 12. | Scenario L, read at review. The changelog fragment holds the three facts of *Scope* 12. | |

The suite and the broad gate are the orchestrator's, after the review rounds.

**The step only the certificate can verify.** It is scenario I: that the Developer ID way signs, that Apple notarizes the app, and that a downloaded copy opens with no alert. No Developer ID certificate exists yet, so no party of this run can make that run, and no probe stands in for Apple's notarization service. The owner answers it, after the enrolment, by setting the five secrets of `frame/design.md` *Data & interfaces* and running the workflow for the release's tag (Q5). Until then the work goes out with the row open in `gaps.md`.

**The step only a pushed branch can verify.** It is scenario H: the workflow itself. No agent pushes, and GitHub runs a requested workflow only from a file on the default branch (`frame/design.md` *Grounding*). The orchestrator answers it by pushing a tag with a suffix at the branch's head (Q4).

## Overlap with the release

The spawn named #188, #133 and #231. #201 and #80 are open issues of the same milestone that this work meets, read from their issues. The branches of #188 and #133 hold their `routing.md` alone (`executed`, `git diff --name-only` against `e9fe914c`), so their rows are judged from the issues, and what their frames decide is `unverified`: the orchestrator answers it when each frame is committed. No branch of #201 is on the remote.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #231 | `apps/desktop/package.json`: it adds to `dependencies`, this work adds one `devDependency` and two scripts. `pnpm-lock.yaml`: both add packages. `apps/desktop/src/main/main.ts`, in other parts: its editor and menu lines, this work's Dock image. | #231 | It is near its gate. This work merges the release branch in and runs the install once, which writes the lock from both lists, inside a round it spends anyway. A package that #231 adds and the bundles leave out would need a place in the package: its changed `build.mjs` is read at that merge. |
| #133 | `apps/desktop/src/main/main.ts` and `apps/desktop/src/main/daemon-client.ts`, where #133 replaces an idle daemon of another build at the window's load. This work reads the same start: `package:verify` waits for the status line of a first start, which holds no earlier daemon. The README's sentence on installing a newer version (*Scope* 10, Q3) states what #133 changes for a person. | Either | No function both change. Whichever merges second reads the other's README sentence and status line. |
| #188 | Nothing. It changes how a turn's end is read from an agent's events. | Either | No file and no rule both change. |
| #201 | `apps/desktop/assets/icon/app-icon.svg` and `app-icon-small.svg`, which #201 redraws and this work reads at package time. | Either | The `.icns` is drawn from the files at their paths at each package, so neither order leaves a stale icon. |
| #80 | The version in `apps/desktop/package.json`, which #80's pull request moves and the tag's check reads. The tag `v0.1.0`, whose push starts this work's workflow. `README.md` and `docs/roadmap.md`, in other sections. | #78 | The workflow has to stand on the release branch before the release's tag is pushed. |

## Operational impact

- **A new dependency.** `electron-builder` 26.18.0, a `devDependency` of `apps/desktop`. The first package on a machine downloads Electron's archive for the packager.
- **A new workflow, with write access to releases.** `.github/workflows/package.yml` holds `contents: write`. It runs at every pushed tag that starts with `v`.
- **Five repository secrets, none of which exists yet.** `MAC_CERTIFICATE_P12`, `MAC_CERTIFICATE_PASSWORD`, `APPLE_API_KEY_P8`, `APPLE_API_KEY_ID` and `APPLE_API_ISSUER`. With none set, the workflow signs ad hoc. The owner sets all five once the certificate exists, and then runs the workflow for the released tag, which replaces the release's `.dmg` under the same name.
- **The order of a release's last steps.** Push the tag. The workflow creates a draft release that holds the `.dmg`. Write the note into that draft and publish it. A release created before the workflow ends gets its `.dmg` when the workflow ends.
- **The site's link.** `https://github.com/<owner>/<repository>/releases/latest/download/Owlery-arm64.dmg` should serve the newest published release's `.dmg`. The framer recalls this address from GitHub's documentation and did not read it in this run, so it is `unverified`: the orchestrator opens the link once release 0.1.0 is published, before the site points at it.
- **The installed app's data.** A packaged app keeps its user data under "Owlery" in the user's Application Support folder, apart from the folder an app started from a checkout uses. Nothing is moved between them.
- **Sizes at the probe, version 0.0.5.** The `.dmg` is 126 MB and the installed app 280 MB. *Scope* 11 records the built ones.
- **No move of the version.** It stays `0.0.5` here, and #80 moves it.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
