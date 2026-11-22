# Phase 1: 1795330500-no-question-holds-the-run

## What this phase found

**The frame holds for this phase.** Each `from` that `frame/design.md` *Data & interfaces*, the policy documents' text, quotes stood once in its document at `c595581`, at lines 148, 163 and 192 of `docs/architecture.md` and of `docs/architecture.ko.md`, and the five sections the entries name stood under the headings the entries give. `executed`: `grep -n` of each quoted text and of each heading in the worktree. `apps/desktop/test/daemon.test.ts` and `apps/desktop/test/view.test.ts`, which the check lines name, both stand (`executed`: `ls`).

**Where each `add` landed.** The frame's rule is "at the end of the section's own text, before the section's first sub-heading", and none of the three sections has a sub-heading, so each paragraph is the last text of its section. Judged against `frame/design.md` *Data & interfaces*, the paragraph that opens "The policy documents' text".

- `docs/product.md` *What we promise*: after the paragraph that opens "A person answers the questions about one issue once".
- `docs/product.md` *Foundation*: after "Both paths end in the same seal". The paragraph therefore follows the two paths to a seal, and does not stand beside the section's first paragraph on the inbox line, which is the text it extends. The entry's own words decide the place, so it stands where they put it.
- `docs/architecture.md` *Code runs the order, the orchestrator judges*: the two rows are the last rows of the section's table, in the order of their entries, and the paragraph follows "We do not make a separate skill".

Each Korean edition takes the same places. The Korean text is the frame's, written as given. It was read against the Korean sentence rules of the plugin's `skills/writing-style/SKILL.md` and no sentence was changed.

**The documents now state what phases 2 to 4 build.** The paragraphs say in the present tense that the daemon parks a work item, keeps a decision and sends it with its work item, and no code does so until those phases close. Each check line names a test file that stands and that holds no case of the rule until then. `frame/plan.md` *Phases* chose this order ("Phase 1 writes the rule into `docs/` before any code"), so it is no departure, and `gaps.md` holds it as not verified until the cases exist. The pull request must not merge with phase 1 alone.

**How scenario 19 was read.** `read`: each of the sixteen entries against the diff of `fcd727f`, with its section. `executed`, once: a probe in the phase's scratch directory, `test_tmp_entries.py`, which takes the entries out of `frame/design.md` and looks for each `to` in the section its entry names. It found fourteen as their entries place them: each `add` once, as a whole line, the last text of its section or a row of the table, with its check line directly under a paragraph. It reported the two `change` entries of *State lives in three places* as failing, and the fault was the probe's: it compared how often the `from` and the `to` stand, which is only right where the `to` contains the `from`. Those two were settled by `grep -c` of each `from`, which printed 0 in both editions, and `grep -n` of each `to`, which printed line 163 in both. `grep -c` of the three other old cells, with the closing ` |` that ends a cell, printed 0 in each edition.

**The counts the broad gate compares.** `executed`: `grep -c '^#'` printed 15 and 15 for `docs/product.md` and its Korean edition and 26 and 26 for `docs/architecture.md` and its Korean edition, and `grep -c '^|'` printed 36 and 36, and 110 and 110. `git grep -n -e '도장' -- docs README.md README.ko.md` printed nothing and exited 1. The broad gate itself was not run.

**No case and no mutation run.** The phase changes prose in four Markdown files and nothing parses them, so by the table in the plugin's `skills/verify/SKILL.md` *The narrow command still has to be able to fail* there is no command that could fail on the change. No test was run.

**Other statements of the rule, as a sample.** `git grep` on "batch", "one set", "questions and answers", "question screen" and their Korean words over `docs/`, `README.md` and `README.ko.md` found these, and each stands:

- `docs/product.md` line 9 and its Korean line, "A person answers the questions about one issue once and walks away": the default of `frame/questions.md` Q2 keeps the promise's own text, and the new paragraph states the request of several work items beside it.
- `docs/product.md` line 28, `docs/roadmap.md` line 23 and their Korean lines name the question batch and say nothing the rule changes.
- `docs/architecture.md` line 150 and its Korean line say the daemon's state is "(progress, the cost ledger, questions and answers)". The list is shorter than the row of *State lives in three places* that this phase extended, as it was before the phase. The frame names no change there, so it was left, and `gaps.md` *Not done* holds it.

The search was by wording, so a statement in other words was not reached. The proofer's read of the two documents is where that part stands.

**Questions for the owner.** None arose in this phase. Q1 and Q2 of `frame/questions.md` stand open at their defaults, and the text written here is the text of those defaults: an answer to either changes these paragraphs and no code.

**For the next phase.** The lines of `docs/architecture.md` keep their numbers up to line 192. The table of *Code runs the order, the orchestrator judges* gained two rows and the section three lines after its last paragraph, so the paragraph "We do not make a separate skill" is at line 196, and every line from the next heading on moved down by five. In `docs/product.md` the lines after *What we promise* moved down by three, and those after *Foundation* by six. The commit of this phase carries the trailer `Co-Authored-By: Claude Fable 5.2`, the model that built it, where the spawn asked for another model's name.
