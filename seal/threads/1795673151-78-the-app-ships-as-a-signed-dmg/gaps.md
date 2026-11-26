# Closing memo: 1795673151-78-the-app-ships-as-a-signed-dmg

## Not verified

| Item | Who must answer |
|---|---|
| The Developer ID way of `package` has never run: the packager signing with the certificate of `CSC_LINK`, Apple notarizing the app, and `package:verify`'s two checks of a Developer ID app (`spctl --assess --type execute` and `xcrun stapler validate`). No certificate exists, and phases 1 and 2 ran the ad hoc way alone. | the owner, after the enrolment, by `frame/questions.md` Q5 |
| What a person meets at the first open of the downloaded ad hoc build, how the Dock and the Finder draw the bundle's icon at each size, and whether a Claude Code pane of the app opened from the Finder starts the person's `claude`. `package:verify` starts the app from a shell, which hands the app the shell's environment. | the owner, at a screen, by `frame/questions.md` Q6 |
| That the README's steps for the first open match what macOS 26 shows, in English and in the Korean labels `README.ko.md` gives ("개인정보 보호 및 보안", "그래도 열기", "열기"), which were recalled and not read on a screen. | the owner, at a screen, by `frame/questions.md` Q6 |
| That `https://github.com/MichaelYcJo/owlery/releases/latest/download/Owlery-arm64.dmg`, which both READMEs link, serves the newest published release's `.dmg`. No release holds the asset yet. | the orchestrator, once release 0.1.0 is published, before the site points at it |
| That `main.ts` gives the Dock no image in a packaged app. `dockImage`'s cases hold the function, and the call `dockImage(app.isPackaged, __dirname)` was read and not run in a packaged app with the Dock read. | the owner, at a screen, by `frame/questions.md` Q6 |
| That the macOS runner of GitHub draws both SVGs with `sips` and packages the app. Phase 1 ran on the owner's Mac alone. | the orchestrator, by `frame/questions.md` Q4 |
| Scenario H: that `.github/workflows/package.yml`, at a pushed tag with a suffix, packages the app, passes `package:verify` on the runner, writes "Signed ad hoc" into the run's summary, and leaves a draft release of the tag holding `Owlery-arm64.dmg`. Phase 2 parsed the file and ran its commands on this Mac; no agent pushed a tag or ran the workflow. | the orchestrator, by `frame/questions.md` Q4 |
| That `gh release list` in the upload step lists a draft release, so a second run for a tag whose release is still a draft uploads into it and makes no second draft. | the orchestrator, by `frame/questions.md` Q4, running the workflow twice for the tag |
| Scenario I: that the workflow, with the five secrets set, signs with the Developer ID certificate, has Apple notarize the app, writes "Signed with the Developer ID certificate and notarized" into the summary, and that a downloaded copy opens with no alert. | the owner, after the enrolment, by `frame/questions.md` Q5 |
| The suite, the repository's typecheck and the README count of the broad gate at the work item's last commit. | the orchestrator, at the broad gate |

## Not done

Phase 1 leaves the packager's two side files beside the `.dmg` in `out/`: `Owlery-arm64.dmg.blockmap` and `builder-debug.yml`. The block map is what a delta update reads, which is #266's, and neither file is in the workflow's upload of *Scope* item 8.

The package still carries `@xterm` and `node-pty`'s builds for other platforms, which no packaged code loads. `frame/design.md` *What the package could do beyond the issue* gives that to the orchestrator.
