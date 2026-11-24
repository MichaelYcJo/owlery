# Phase 6: 1795497826-pane-carries-the-chain

## What this phase found

### The screenshots

**The first run's shot of the chain dialog showed a defect of phase 5, and the phase fixed it.** The dialog drew no mark beside "The owl chain" and "The AgenticSeal plugin" in either appearance, so a person could not see which of the two was chosen. `apps/desktop/src/renderer/index.html` gave a dialog's box its size and took the field's form off it, and gave a dialog's round mark neither. A round mark in a dialog then took the form of a field and shrank to no width beside its words. The rule now names both, and the chosen round mark is in `--ink-strong`, as an option of a question is. The two choices of the chain dialog are the only round marks in a dialog (`grep` for `type="radio"` over `apps/desktop/src/renderer/`, which lists every one the page holds and every one its code makes). Decision: fix it in this phase and not hand it to a round. Grounds: the defect is this work item's own, the judgment that gave this phase the screenshots was made to read this form, and a round would have found it from the committed shots and cost a fix pass. Judged against `frame/plan.md` *Judgments of the run*, the row on the two views, and `docs/design.md` *A pull request that changes the window carries its screenshots*.

**`pnpm run screenshots` therefore ran twice.** `frame/plan.md` and the spawn give this phase one run. The first, at `48d705a`, passed and wrote twenty files. The fix changed what the dialog draws, so the committed files had to come from a run after it. The second run, at `d631f34`, passed and wrote twenty files, and the committed twelve are from it. Each run started the app once, with `OWLERY_BACKGROUND=1`.

**How the run reaches the two views.** The run's repository now holds Owlery's workflow, so it is on the owl chain, and the app is given a Claude Code config folder of the run's own that enables a stand-in for the AgenticSeal plugin. The run stores the answer "the AgenticSeal plugin" with the repository before the app starts. So no pane of the scene is asked about, and each is launched with the command it had before this phase. The view `settings` saves the answer "the owl chain" in the repository's settings and opens them again. The view `chain` takes the answer away, presses "+ Claude Code" in the work item's view and cancels the dialog after the shot. Neither launches a pane. The run now writes ten views in each appearance, twenty files for Night watch.

**Twelve files are committed, under `screenshots/` of this directory.** They are the six views this work item changed, in the dark and the light appearance: `view`, `parked`, `finished` and `broken`, whose foot lost its button, and `chain` and `settings`. The commit that holds them is `d936ad2`. They were made before `release/v0.0.3` was merged into this branch, and that branch holds #189, which changed Night watch's marks of a state. `gaps.md` *Not verified* names it.

### The hand check

`pnpm run pane:run` ran on 2026-11-24 with Claude Code 2.1.331, on the person's own login. It started three real sessions, each a pane in a temporary repository the case made and removed.

| Session | Started as | Turns | What it showed |
|---|---|---|---|
| 1 | The first case: a pane on the owl chain with no choice, with the settings file every pane shares | 2 | The case passed. The session listed `owlery:crafter`, `owlery:orchestrator`, `owlery:proofer` and `owlery:sealer` and the bundle's seven skills, `owlery:seal` among them, and quoted the head. Its call of `AskUserQuestion` was refused by the bundle's hook, and the tool's result held the reason the built command wrote for the routing that `start --automation yes` had made. Its conversation records the hook of the AgenticSeal plugin at the session's start: the plugin is enabled at user scope on this machine, and this case launches the pane as the daemon does where it finds no such plugin |
| 2 | The second case: a pane under the choice "the owl chain", with a settings file of its own, `claude-pane-1.json` | 1 | The case failed on its own assertion. The session's lists held the four `owlery:` agents, the seven `owlery:` skills and no agent or skill under `agentic:`. After the lists the session added that the person's global instructions ask for a skill of the plugin which the lists do not hold, and named that skill. The case read the whole answer for the plugin's name and found it in that sentence. The pane's settings file held `enabledPlugins` as the case expects. The conversation records no hook of the plugin |
| 3 | The second case again, after `1ef9e92` | 1 | The case passed: the settings file, the bundle's names among the names the session listed, no listed name of the plugin, and no recorded hook of the plugin |

**The second case's failure was the case's, and the phase rewrote it.** A session may name the plugin in a sentence that says the plugin is not there. The case now reads the names the session wrote as the items of its lists (`itemsOf`), and its prompt asks for each name as an item on a line of its own. The bundle's names are read through the same reader, so an answer in a form the reader does not take fails the case and does not pass it. Judged against contract rule 18: a check that refuses correct behaviour is fixed.

**The case now reads the hooks, which is a departure from the frame.** `frame/design.md` scenario 16 and `frame/plan.md` phase 5 say that `pane:run` does not read which hooks ran. Phase 5 could not learn the form of that record without a real session. This phase's sessions showed it. Claude Code keeps a hook's run in the conversation file as an entry of the type `attachment`, whose own type is `hook_success`, with the hook's `command` and its `hookName`. It keeps an entry only for a hook that printed something: session 1 holds the plugin's hook at the session's start and holds no entry of the plugin's hooks at `Stop` and at `PreToolUse`, nor of Owlery's own relay hooks, which print nothing. The second case reads those entries and holds that none carries a command of the plugin's `hooks/hooks.json`, which it reads from the install folder the person's list of installed plugins names. Decision: add the reading. Grounds: it replaces part of what only a person's eye held, at no session more than the rerun the first rewrite needed. What it does not reach is a row of `gaps.md` *Not verified*.

**The person's settings files held their bytes.** `shasum -a 256` of `~/.claude/settings.json`, `settings.local.json`, `plugins/installed_plugins.json`, `plugins/known_marketplaces.json`, `CLAUDE.md` and `keybindings.json` printed the same six lines before session 1 and after session 3. `cmp` of each file against a copy made before session 1 found no difference. Each case also compares the first four files before and after its session. Claude Code itself keeps each session's conversation and its answer to the question of trust for the temporary folders in its own files, as phase 4 found.

**No process was left.** The list of the `claude` processes on the machine was the same before session 1, after session 2 and after session 3. The system's temporary folder holds no repository and no user data folder of these runs.

### Where the tree contradicted the frame

**The Korean editions named the button in Korean, which scenario 9's search cannot see.** *Removes* row 6 lists `docs/roadmap.md` with no Korean edition, and the search's patterns are the English names. `docs/product.ko.md` named the button on three lines, `docs/roadmap.ko.md` on three and `docs/architecture.ko.md` on two, as "인장 받기" and "다시 인장 받기". Each is rewritten. `docs/roadmap.ko.md` keeps "2. 인장 받기" as the milestone's name, as the English edition keeps "2. Get a seal".

**Scope item 16 does not name rule 4 of `docs/architecture.md` *Rules that keep it portable*.** The rule said that the AgenticSeal process runs separately from the user's session, and the second row of the table in *What each session loads* cited it. The decision reverses it for a pane. The rule now says that the chain's code stands apart from the agent that runs a session, that the daemon's chain runs separately from the user's session, and that a pane's chain rides on the user's Claude Code session.

**Scope item 16 names two rows of the table in *What changes because Owlery is not a plugin*, and four more stated the daemon alone.** The rows on a role's tools, on passing the rules, on measuring cost and on asking the person each gained one sentence on a pane.

**Scope item 15 does not name two sentences of `docs/product.md` that the decision changes.** *Foundation* said that the AgenticSeal process does not run in a terminal, which now holds for a handed-over issue alone. *The seal* item 3 did not say what the back shows where the stages ran outside the daemon, which scope item 14 built in phase 1.

**`docs/roadmap.md` said a release branch is cut when its `release:` milestone opens.** The milestones of releases 0.0.4 to 0.0.7 opened on 2026-11-24, and the remote holds `release/v0.0.3` alone of them. The bullet now says that the branch is cut when the work on the release starts, after the release before it has merged into `main`.

**Issue #73 reads a usage limit, and no cost.** `frame/design.md` *Out of scope* and the spawn name #73 for a pane's cost or usage. The issue's body asks for the subscription's usage limit, read through a status line command in the sessions Owlery launches in a terminal. The roadmap says that Owlery reads no cost of a pane's stages, and that the first reading of what a pane's session used is #73's, of the usage limit.

**`docs/design.md` gave a dialog's choice no form.** The fix of the chain dialog changes what a person sees, so the row "A dialog" of *Components and their states* now states the form of a choice, in both editions.

### Decisions made while building

**The roadmap states the releases as a table.** Scope item 17 asks for each release with the purpose its GitHub milestone states. The table has a row for each of the eight releases, with what it is and its purpose, read from the milestones' descriptions on 2026-11-24. A paragraph after it says what the owl chain in a pane covers in release 0.0.3 and what comes in releases 0.0.5 and 0.1.0.

**The Korean editions call the chain "owl 체인".** The window's own words are English, and the Korean editions keep the names of the roles in English, so the chain's name is kept as the owner coined it.

**The new paragraphs of `docs/architecture.md` end with a `check:` line.** The launch of a pane, the choice, the chain command, the hook and the base each name the files of their cases. Three paragraphs that now also state a pane gained `apps/desktop/test/chain-command.test.ts` on their line. No case opens a document under `docs/`, so nothing parses these lines, and review reads them.

**The changelog fragment carries no `### Process changes` table.** `gaps.md` *Not done* holds the grounds.

**No phase boundary run was made after the last code commit.** `apps/desktop/test/screenshots.test.ts` ran without the app at `48d705a` and as the screenshot run at `d631f34`, `chain-choice.test.ts` ran whole on the tree of `d631f34`, and the second case of `pane-session.test.ts` ran at `1ef9e92`. The commits after them change documents and records, which no case opens. `tsc --noEmit` ran on the tree of `1ef9e92`.

### What was seen red

- The case of `apps/desktop/test/screenshots.test.ts` that names one file for each view failed against the eight views before `VIEWS` gained the two: "expected [ …(16) ] to deeply equal [ …(20) ]". `seal mutate` then broke `VIEWS` two ways, the last view taken out and the last two in the other order, and both read `red`.
- The new assertion of `apps/desktop/test/chain-choice.test.ts`, that each choice's mark is as wide as the form's box, failed against the dialog as phase 5 left it: "expected [ +0, +0 ] to deeply equal [ 16, 16 ]". With the round mark taken out of the fixed rule again, `seal mutate` read `red` on the same line. The file's first run of this phase was made before the assertion stood, by mistake, and passed.
- The two readers of `apps/desktop/test/pane-session.test.ts` live in a file that runs only with a real session, so a probe ran them once over the conversation files of sessions 1 and 2, as that file writes them. Over session 2 they found the bundle's eleven names among the listed items, no item under `agentic:` though the answer names the plugin in a sentence, and no hook of the plugin. Over session 1, where the plugin was on, they found one hook of the plugin, so the assertion on the hooks fails where the plugin runs. A list that holds an item `agentic:proofer` gave that item, so the assertion on the names fails where the plugin's agent is offered. The probe is `test_tmp_pane_reads.mjs` in the phase's scratch directory.
- The built-app views `chain` and `settings` of the screenshot run have no mutant: each mutant is a build and a start of the app, and the run's own waits hold each view before its shot, the dialog open on the owl chain and the settings' field shown with the answer.

### What comes after this phase

- **The party that merges `release/v0.0.3` into this branch.** That branch holds #189 and #190. #189 changed `docs/design.md` and its Korean edition, which this phase also changed, in other rows. #190 added cases to `apps/desktop/test/chain.test.ts`, and the branch still names the button in the files this work item rewrote, so scenario 9's search runs again after the merge, as `frame/plan.md` *Overlap with the release* says. The changelog fragment of #190 says that a chain can start in the work item once a session stops working, and after this work item nothing in the window starts one.
- **The orchestrator, for the pull request's body.** The twelve files are at `seal/threads/1795497826-pane-carries-the-chain/screenshots/night-watch-<appearance>-<view>.png`, in the commit `d936ad2`.
