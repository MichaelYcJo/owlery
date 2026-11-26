# Closing memo: 1795673151-78-the-app-ships-as-a-signed-dmg

## Not verified

| Item | Who must answer |
|---|---|
| closed The Developer ID way of `package` has never run: the packager signing with the certificate of `CSC_LINK`, Apple notarizing the app, and `package:verify`'s two checks of a Developer ID app (`spctl --assess --type execute` and `xcrun stapler validate`). No certificate exists, and phases 1 and 2 ran the ad hoc way alone. | re-homed to issue #266, in a comment of the settle of release 0.0.5 that lists the row |
| closed What a person meets at the first open of the downloaded ad hoc build, how the Dock and the Finder draw the bundle's icon at each size, and whether a Claude Code pane of the app opened from the Finder starts the person's `claude`. `package:verify` starts the app from a shell, which hands the app the shell's environment. | re-homed to issue #110, in a comment of the settle of release 0.0.5 that lists the row |
| closed That the README's steps for the first open match what macOS 26 shows, in English and in the Korean labels `README.ko.md` gives ("개인정보 보호 및 보안", "그래도 열기", "열기"). Round 1 read the three labels in the Korean edition of Apple's support article 102445, and no one has read them on a screen. | re-homed to issue #184, in a comment of the settle of release 0.0.5 that lists the row |
| closed That `https://github.com/MichaelYcJo/owlery/releases/latest/download/Owlery-arm64.dmg`, which both READMEs link, serves the newest published release's `.dmg`. No release holds the asset yet. | re-homed to issue #58, in a comment of the settle of release 0.0.5 that lists the row |
| closed That `main.ts` gives the Dock no image in a packaged app. `dockImage`'s cases hold the function, and the call `dockImage(app.isPackaged, __dirname)` was read and not run in a packaged app with the Dock read. | re-homed to issue #184, in a comment of the settle of release 0.0.5 that lists the row |
| closed That the macOS runner of GitHub draws both SVGs with `sips` and packages the app. Phase 1 ran on the owner's Mac alone. | answered: the run of `package.yml` at tag `v0.0.5-package.1` (run 45775742348) passed its `package` step on GitHub's macOS runner, as the row's answer cell says |
| closed Scenario H: that `.github/workflows/package.yml`, at a pushed tag with a suffix, packages the app, passes `package:verify` on the runner, writes "Signed ad hoc" into the run's summary, and leaves a draft release of the tag holding `Owlery-arm64.dmg`. Phase 2 parsed the file and ran its commands on this Mac; no agent pushed a tag or ran the workflow. | answered: the run 45775742348 passed every step and left the draft release `v0.0.5-package.1` holding `Owlery-arm64.dmg`, as the row's answer cell says |
| closed That `gh release list` in the upload step lists a draft release, so a second run for a tag whose release is still a draft uploads into it and makes no second draft. | answered: the second run for the same tag uploaded into the one draft release, as the row's answer cell says |
| closed Scenario I: that the workflow, with the five secrets set, signs with the Developer ID certificate, has Apple notarize the app, writes "Signed with the Developer ID certificate and notarized" into the summary, and that a downloaded copy opens with no alert. | re-homed to issue #266, in a comment of the settle of release 0.0.5 that lists the row |
| closed The suite, the repository's typecheck and the README count of the broad gate at the work item's last commit. | answered: the broad gate passed at `0e664165`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 0e664165 f0ef6b02` outside its directory prints nothing); the `check` workflow passed on pull request #272 at `f0ef6b02`, the head it merged from |

## Not done

Phase 1 leaves the packager's two side files beside the `.dmg` in `out/`: `Owlery-arm64.dmg.blockmap` and `builder-debug.yml`. The block map is what a delta update reads, which is #266's, and neither file is in the workflow's upload of *Scope* item 8.

The package still carries `@xterm` and `node-pty`'s builds for other platforms, which no packaged code loads. `frame/design.md` *What the package could do beyond the issue* gives that to the orchestrator.
