Part of #43. The issue closes when `release/v0.0.2` reaches `main`.

Before this work "Get a seal" ended at the sealer's verdict. Nothing pushed the sealed branch or opened its pull request, the pull request check refused the body of every pull request a "Get a seal" work item could have, and GitHub showed the verdict only as the result of a job, which cannot end as neutral.

| Done when | What holds now |
|---|---|
| After the sealer's verdict the daemon composes the pull request body from the committed records, pushes the branch and opens the pull request through the user's `gh`, with no login of Owlery's own | Where the work item's `routing.md` reads `open the pull request`, a seal is followed by a pull request stage. The daemon pushes with the person's git to one remote, never by force, with `GIT_TERMINAL_PROMPT=0`, then lists, opens or edits the pull request through the person's `gh` found on the login shell's `PATH`. It reads and keeps no token. The body is composed from the records the head commit holds and opens with the seal section. The stage commits nothing, so the seal it carries stays the head's |
| The pull request shows the seal with the commit it is bound to, and the seal check passes on that head commit | The body's seal section, between `<!-- owlery:seal -->` and `<!-- /owlery:seal -->`, copies the newest verdict block of `guarantee.md`, whose `target:` names the sealed commit. The check posts `Owlery seal` on the pull request's head commit, passed and titled "Sealed at" with the sealed commit where no arm of the check refuses anything |
| The verdict is a check. Owlery posts no approving review and merges nothing | The daemon calls `gh pr list`, `create`, `edit` and `view` and nothing else; the cases' stand-in for `gh` fails any other call. The check is a check run the workflow's job posts with the run's token |
| A person without the app opens the pull request and reads the same verdict there, written down from a run | The check's title and summary and the body's seal section say the verdict without the app. No run on GitHub has been made: every case pushed to a bare repository on the same Mac and posted to a server on the same Mac (`frame/questions.md` Q2) |
| The app tells the repository's administrator how to make the seal check required, and the README says the same | The dialog "Records and check" says how to require `Owlery seal` and what a required check does to a fork's pull request. `README.md` and `README.ko.md` gain a section on the check |
| The daemon waits for the pull request's checks without keeping an agent running, and the work item's line shows their result | While a window is connected, the daemon reads each open pull request with one `gh pr view` call: at a hello, 30 seconds after the stage, every 30 seconds while a check is pending, every 5 minutes otherwise. No process is kept between two reads, and the reads do not keep the Mac awake. The line's second row and the view under the seal's place show the checks |
| A chain that ends without a seal opens no pull request | The stage is owed only at the step `sealed`. A withheld or undecided verdict, a failed gate, and `stop before the pull request` open none |
| Where the pull request's head has no seal, the check's result and text leave room for the hotfix exception that #64 adds later | The check's outcomes are one function's, and a draft that would be refused already ends `neutral`, the result #64 needs |

The decisions the build took without asking are recorded with their grounds in `seal/threads/1795395059-pull-request-and-seal-check/trail/phases/` and `frame/questions.md`. Two of them:

- The screenshot run reaches the pull request stage with a stand-in for `gh` first on the login shell's `PATH`, not with a stored pull request, since a stored open pull request would have the watch call the person's real `gh` (`frame/questions.md` Q4).
- The check posts `Owlery seal` from the `pull_request` workflow, so a fork's pull request gets the job's result and no posted check (`frame/questions.md` Q1, open for the owner).

### Screenshots

The finished work item's view, with its pull request under the seal's place, and the inbox:

![Night watch dark, the finished work item's view](../blob/b443394549eb5e8f46ebfce379ade54faf601c00/seal/threads/1795395059-pull-request-and-seal-check/screenshots/night-watch-dark-finished.png?raw=true)
![Night watch light, the finished work item's view](../blob/b443394549eb5e8f46ebfce379ade54faf601c00/seal/threads/1795395059-pull-request-and-seal-check/screenshots/night-watch-light-finished.png?raw=true)
![Register dark, the finished work item's view](../blob/b443394549eb5e8f46ebfce379ade54faf601c00/seal/threads/1795395059-pull-request-and-seal-check/screenshots/register-dark-finished.png?raw=true)
![Register light, the finished work item's view](../blob/b443394549eb5e8f46ebfce379ade54faf601c00/seal/threads/1795395059-pull-request-and-seal-check/screenshots/register-light-finished.png?raw=true)
![Desk dark, the finished work item's view](../blob/b443394549eb5e8f46ebfce379ade54faf601c00/seal/threads/1795395059-pull-request-and-seal-check/screenshots/desk-dark-finished.png?raw=true)
![Desk light, the finished work item's view](../blob/b443394549eb5e8f46ebfce379ade54faf601c00/seal/threads/1795395059-pull-request-and-seal-check/screenshots/desk-light-finished.png?raw=true)
![Night watch dark, the inbox](../blob/b443394549eb5e8f46ebfce379ade54faf601c00/seal/threads/1795395059-pull-request-and-seal-check/screenshots/night-watch-dark-inbox.png?raw=true)
![Night watch light, the inbox](../blob/b443394549eb5e8f46ebfce379ade54faf601c00/seal/threads/1795395059-pull-request-and-seal-check/screenshots/night-watch-light-inbox.png?raw=true)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
