# Phase 1: 1795673151-78-the-app-ships-as-a-signed-dmg

## What this phase found

**The frame held at `4b292728`, and the package was built to it.** Each coordinate the build leaned on stood where the frame put it: the Dock's `setIcon` call at `apps/desktop/src/main/main.ts:216-222`, the daemon's reading of its own script at `apps/desktop/src/daemon/main.ts:44-50`, `.gitignore`'s line `out`, and the packaged page in `apps/desktop/test/navigation.test.ts:4` (`read`).

**The layout of the command, Q7, is the default (a).** One module, `apps/desktop/src/package/package.ts`, holds the functions the cases read (`signingWay`, `packagerConfig`, `iconImages`) and the two runs (`packageApp`, `verifyPackage`). `scripts/package.mjs` and `scripts/verify-package.mjs` bundle it with esbuild and run the bundle from memory, as `scripts/settle.mjs` runs the settle, because the module's imports carry no extensions that Node.js could resolve. The packager's `build` is handed into `packageApp` by `scripts/package.mjs`, so the cases load no packager. Judged against `frame/questions.md` Q7 and `frame/design.md` *Data & interfaces*, which asks for modules that import nothing of Electron.

**A departure from Q7's one module: the Dock's image is `dockImage` in `apps/desktop/src/main/dock-image.ts`.** `main.ts` calls it and the package command does not. Importing it from the package module would put the command's code into the main process's import graph. Judged against `frame/design.md` *Data & interfaces*, which names the function's inputs and output and leaves the module to the builder.

**The rows of `frame/design.md` *Removes* are done, and one sentence the frame did not name went with them.** `main.ts` gives the Dock an image only where `dockImage` names one, and the comment under the call holds for an app started from a checkout alone. `TRADEMARKS.md` said the app gives the Dock `app-icon.png`, and `build.mjs`'s comment said the same; both now say an app started from a checkout does. They were found with `git grep -n -e app-icon.png -e Dock`, which is a sample of the places that state the rule.

**Two values the frame does not name stand in the configuration, and scenario F's cases pin both.**

- `mac.notarize` is `false` in the ad hoc way. The installed packager notarizes wherever one of its sets of variables is present and `notarize` is not `false` (`app-builder-lib/out/mac/MacTargetHelper.js#notarizeIfProvided`, `read`). So the ad hoc way skips it by the configuration and not only by the five variables being absent.
- `mac.hardenedRuntime` is `true`, the packager's default, written out so a later default of the packager cannot change it unseen.

**The entitlements are the same in both ways.** The packager signs with its template `app-builder-lib/templates/entitlements.mac.plist` where none is configured. The template holds `allow-jit`, `allow-unsigned-executable-memory` and `disable-library-validation` (`read`), and the ad hoc app carries the three (`executed`, `codesign -d --entitlements -`). A Developer ID build carries `disable-library-validation` too. That bears on Q5, and no run has made such a build.

**The packager is run through its API and not its command line.** `build({ projectDir, config, mac: [], publish: "never" })` takes the configuration as the object scenario F's cases read, and the target and architecture come from the configuration, as the probe's `--mac` did. No configuration file is written.

**`package:verify` unmounts the image right after it copies the app out.** `frame/design.md` *Scope* item 7 names the unmount after the stop. The checks read only the copy, so the image is not held while the app runs. A check that fails before the unmount leaves the image detached with `-force`, and the started processes killed, in the command's `finally`.

**The install's new warning.** `electron-builder` brings `electron-winstaller@5.4.0`, and pnpm prints "Ignored build scripts: electron-winstaller@5.4.0" at every install. The script builds for Windows, which no Owlery build targets, so it stays out of `onlyBuiltDependencies`. The add changed `apps/desktop/package.json` by one line and `pnpm-lock.yaml` by 1,841 insertions and 16 deletions (`executed`, `git diff --stat`).

### The cases, seen red and then green

At `12c02961`, `apps/desktop/test/package.test.ts` holds 14 cases of scenarios D, F, J and K. Each was seen red twice.

- Against the tree before the code: `pnpm run test test/package.test.ts` exited 1, "Cannot find module '../src/main/dock-image'" (`executed`). That red shows only that the file did not load.
- One break at a time, with `seal mutate` at `12c02961`, each against the cases named by `-t` alone (`executed`). Every mutant read `red`, exit 1, and the file was restored by the command:

| Unit | Break | Case run |
|---|---|---|
| `signingWay`, an empty variable counts as not set | `!env[name]` to `env[name] === undefined` | "set and empty" |
| `signingWay`, the refusal of only some | `missing.length === 0` to `missing.length < SIGNING_VARIABLES.length` | "only some hold text" |
| `signingWay`, the sentence names the missing ones | `missing.join` to `SIGNING_VARIABLES.join` | "only some hold text" |
| `packagerConfig`, the folder | `asar: false` to `true` | "as a folder" |
| `packagerConfig`, no rebuild | `npmRebuild: false` to `true` | "as a folder" |
| the artifact's name | `"Owlery-arm64.dmg"` to `"Owlery-${version}-${arch}.dmg"` | "as a folder" |
| Apple silicon alone | `arch: ["arm64"]` to `["arm64", "x64"]` | "as a folder" |
| the bundle identifier | `app.owlery.desktop` to `app.owlery.probe` | "bundle identifier" |
| the ad hoc identity | `{ identity: "-", notarize: false }` to `{ notarize: false }` | "naming the identity" |
| no identity in the Developer ID way | `{ notarize: true }` to `{ identity: "-", notarize: true }` | "names no identity" |
| the small drawing's sizes | `pixels <= 32` to `pixels < 32` | "from the small drawing" |
| the ten images | the `icon_512x512@2x.png` row removed | "ten images" |
| `dockImage`, no image for a packaged app | `packaged ? null :` to `false ? null :` | "packaged app no image" |
| `dockImage`, the PNG beside the script | `app-icon.png` to `icon.png` | "from a checkout" |

The call in `main.ts`, `dockImage(app.isPackaged, __dirname)`, has no case: that a packaged app's Dock shows the bundle's icon is read on a screen, Q6.

### Scenario A: one run of `package`

`pnpm --filter @owlery/desktop run package` at `12c02961`, with no change in the working tree and no signing variable set, exited 0 (`executed`). The packager's lines that bear on the frame:

```
• skipped dependencies rebuild  reason=npmRebuild is set to false
• packaging       platform=darwin arch=arm64 electron=45.3.3 appOutDir=out/mac-arm64
• signing         file=out/mac-arm64/Owlery.app platform=darwin type=distribution identityName=- identityHash=none provisioningProfile=none
• skipped macOS notarization  reason=`notarize` options were set explicitly `false`
• building        target=DMG arch=arm64 file=out/Owlery-arm64.dmg
Signed ad hoc: no signing variable is set, so macOS asks the person to allow the first open.
```

The packager also wrote `out/Owlery-arm64.dmg.blockmap` and `out/builder-debug.yml`. On the app it left in `out/mac-arm64/`, `codesign -dv` read `Identifier=app.owlery.desktop` and `flags=0x10002(adhoc,runtime)`, and `spctl --assess --type execute` exited 3, as for any app Apple did not notarize (`executed`). `iconutil -c iconset` on the bundle's `icon.icns` gave back the ten images, and the 32-pixel image shows the small drawing where the 64-pixel image shows the full one (`read`, the two images opened).

### Scenario B: one run of `package:verify`

`pnpm --filter @owlery/desktop run package:verify` on that `.dmg` exited 0 (`executed`). Its lines:

```
ok   the image mounted, Owlery.app was copied out of it, and the image was unmounted
ok   the signature: codesign --verify --deep --strict exits 0
ok   Info.plist names Owlery, app.owlery.desktop and the icon file icon.icns, which stands in the bundle
ok   the role bundle stands as the folder Contents/Resources/app/dist/bundle
ok   the package's node-pty, loaded by the app's binary as Node, ran a process that printed its line
ok   the app started in the background, and its status line reads "Daemon running, no agent", with no notice of another build
ok   daemon.json's build is the SHA-256 of the package's dist/daemon.js
ok   the app (process 11629) and the daemon (process 11640) are gone after the stop
--   not signed with a Developer ID certificate, so Gatekeeper's assessment and the notarization ticket are not checked
```

After the run, `kill -0` exited 1 for each of the two process ids, and `hdiutil info` listed no image of the run (`executed`). The status line is compared whole with "Daemon running, no agent": the notice of another build stands before the state in the same line (`apps/desktop/src/renderer/shared.ts`, `daemonNotice`), so a line equal to the state alone holds no notice (`read`).

### Scenario C: the check refuses an unsigned package

A probe in the phase's scratch directory bundled `package.ts`, took `packagerConfig("ad-hoc", …)`, set `mac.identity` to `null` and the output folder to the scratch directory, and ran the packager, which logged "skipped macOS code signing reason=identity explicitly is set to null" (`executed`, exit 0). `package:verify` on that `.dmg` exited 1 (`executed`):

```
ok   the image mounted, Owlery.app was copied out of it, and the image was unmounted
package:verify: FAILED the signature: codesign --verify --deep --strict exited 1: …/Owlery.app: code has no resources but signature indicates they must be present
```

### *Scope* item 11: the sizes

`package:verify`'s size line of the run of scenario B gave 124,928,691 bytes for the `.dmg` and 283,232 KiB on disk for the app copied out of it. `apps/desktop/measurements/install-size.md` records them with the date, the commit, the machine and the commands. The probe of `frame/design.md` *Grounding* made a `.dmg` of 126,155,820 bytes at `845a3e7a`.

### The phase's set of cases

The set of `skills/verify/SKILL.md` *Scope: cheap and often, broad and once*, *Phase boundary* row, ran as one command at `12c02961`: `test/package.test.ts`, `test/records-place.test.ts`, which reads `apps/desktop/package.json`, and the test files that build the app with `buildApp`, which runs `build.mjs` and so bundles `main.ts`, listed by the pattern `vitest.config.ts` puts them in the `app` project with. The repository names no tree-wide test files. That run set `TMPDIR` to the phase's scratch directory and exited 1: 267 passed, 8 skipped, 5 failed in `test/machine-dialog.test.ts` and `test/terminal-basics.test.ts` (`executed`). The failures read the length of that folder's path, not this phase's code. One was `connect EINVAL` on a socket path past the system's limit for a socket's path, and the others were a pane's printed path wider than the pane ("Invalid count value: -82") and the links the cases wait for after it. The two files ran again at `12c02961` in one command, with the system's own temporary folder, and exited 0: 35 passed (`executed`). The package command's own scratch folders sit under the system's temporary folder too, and the run of scenario B under the long folder passed, so no change follows for it.
