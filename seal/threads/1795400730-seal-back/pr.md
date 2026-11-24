Part of #47. The issue closes when `release/v0.0.2` reaches `main`.

Before this work a seal said that the work held, and nothing of what the review caught or what the review cost. The round records kept each finding and the daemon's ledger kept each stage's cost, but nothing set the two side by side. So a person could not tell from their own numbers whether a seal was worth what it cost.

| Done when | What holds now |
|---|---|
| A sealed work item opens to the back of its seal: the defects each review round caught and the fix pass that fixed each, at file and line level, beside the cost of each stage | A work item's view gains a tab, "Back of the seal", before the panes' tabs, and a work item with a seal opens with it in front. Each round lists its findings with the symptom, the severity, each place as `path:line`, and "Fixed in" with the commit, "Rejected", "Deferred to" or "Open". Under each round stand the stages that ran for it: the round, its fix pass and the orchestrator's judgment or ruling, each with its time, tokens, cache and cost. The broad gate and the sealer follow the rounds |
| The defects are read from the committed round records and the costs from the daemon's ledger, and a cost under a subscription login carries its "converted" label | The findings, the seal's record and the refused calls are read as the branch's newest commit holds them; a record not committed says nothing on the back. The costs are read from the ledger, whose entries now name the chain's stage and round they ran for. A converted cost carries the word "converted", and the sums keep converted and charged costs apart |
| A work item whose rounds caught nothing shows that plainly, with its cost | The back says "The review rounds caught nothing." and still lists each stage's cost. A defect caught and fixed is a finding closed as fixed that no later round reopened |
| The seal's record (tree, base, item, gate, rounds, and who judged) is shown with the back | Under the large seal stands its record: the tree and its branch, the base, the item, the broad gate's commit, the count of rounds, who built, who judged, the model and the rules |
| The back of a broken seal stays readable and says which commit broke it | A broken seal's back stays whole, and "Broken by" names the oldest commit on the branch's own line after the sealed commit that changes a file outside the closing records, with its subject. A chain stopped before its seal shows its back under "No seal yet", with what it has cost so far |
| The pull request body carries the same numbers for a person without the app, or the issue records why they stay in the app until the ledger is published in milestone 5 | The body carries the back below the seal section, between `<!-- owlery:back -->` and `<!-- /owlery:back -->`: the counts, each round's findings, one table of the stages with their costs, and the sums. Each seal sent to an open pull request rewrites that section, and the earlier part "Review rounds" is gone from the body. At GitHub's 65,536-character limit the findings give way, the last round first, to a line naming that round's record, and the table of costs stays. The seal check reads no line of the back |

Every reader of a pull request now sees each stage's cost. Whether the body should carry costs at all is the owner's to decide (`frame/questions.md` Q1, open). So is where the back stands in the view (Q2, the default is a tab) and what counts as a defect caught (Q3). Whether the back's seal drawn beside the view's own seal stays is also left to the owner, to be read on the screenshots below.

No real chain has drawn a back yet, and no pull request on GitHub carries one. The first pull request of Owlery's own that Owlery seals measures both (#48).

The view's foot and the approval line still show a broken seal's sentence with its backticks, where the back sets the code in the fixed-width face. #44 left them so on purpose, and the owner has since chosen to draw them as the back does, in #176, a work item of its own. This work leaves them.

### Screenshots

The finished work item, sealed after two rounds and a fix pass, and the broken work item, each opened to the back of its seal:

![Night watch dark, the sealed work item's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/night-watch-dark-finished.png?raw=true)
![Night watch dark, the broken seal's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/night-watch-dark-broken.png?raw=true)
![Night watch light, the sealed work item's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/night-watch-light-finished.png?raw=true)
![Night watch light, the broken seal's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/night-watch-light-broken.png?raw=true)
![Register dark, the sealed work item's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/register-dark-finished.png?raw=true)
![Register dark, the broken seal's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/register-dark-broken.png?raw=true)
![Register light, the sealed work item's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/register-light-finished.png?raw=true)
![Register light, the broken seal's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/register-light-broken.png?raw=true)
![Desk dark, the sealed work item's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/desk-dark-finished.png?raw=true)
![Desk dark, the broken seal's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/desk-dark-broken.png?raw=true)
![Desk light, the sealed work item's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/desk-light-finished.png?raw=true)
![Desk light, the broken seal's back](../blob/39991c38a8d61c172f37c73e44357913778d8fcd/seal/threads/1795400730-seal-back/screenshots/desk-light-broken.png?raw=true)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
