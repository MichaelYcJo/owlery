# Phase 1: 1795005804-v0.1-scope-and-milestones

## What this phase found

**The frame holds for this phase.** Every heading the frame has `docs/roadmap.md` link to exists in `docs/architecture.md` and `docs/product.md` at `7a45bfb`, and `docs/roadmap.md` did not exist before the phase. One cell of the frame is wrong about the tree, and the first departure below records it.

The phase adds no code and no behaviour, so it wrote no case, showed nothing red and ran no mutation. `skills/verify/SKILL.md` *The narrow command still has to be able to fail*, the row for prose only, is the ground: nothing in the repository parses the document.

### Departures from the frame

Each was judged against `frame/design.md`, in the section named.

- **The check of the fourth done criterion does not say the measurement is "taken as *Memory design* states".** `docs/architecture.md` *Memory design* states the target, the app itself under about 500 MB, and four rules. It states no way of measuring. The cell says the published measurement is of the app itself, with the agents' processes counted apart, and links *Memory design* for that target. Judged against *Data & interfaces*, "Done criteria", and the *Grounding* row on the 500 MB target.
- **Ground 3 of *Why this order* does not restate what the judgment on headless launches is made against.** It says the judgment is made again when its grounds change, and names the row of `docs/architecture.md` *Open decisions* as its home. *Scope* item 17 and C5 ask for a link and no restatement. The sentence is also true at this phase's commit, where that row still reads "Anthropic's answer".
- **Milestone 1's "Done when" says the headless session "returns an answer that the person can read".** The frame's wording, "answers the daemon", names nothing a person observes, which scenario 3 refuses.
- **The paragraph on the two checks links the hooks to `docs/architecture.md` *The phone: the terminal session as a chat*.** That section is the one that lists hook names and fields as found and not yet run. *Reading usage limits* lists a status line field and a stream event, which are not hooks, so it is not linked there.
- **Two rows of *Open decisions* say "the owner's private notes", where the frame's rows say "the notes".** A reader of the public document has no other "notes" to resolve the word against, and issue #1 uses the same phrase. The row on outside contributors adds that no committed document decides the matter. No path, file or heading of the notes is named (C6).
- **Milestone 3 says what the depth judgment is,** "how much of the process the work item runs through". No committed document defines the term, and the done-when cell of the same row relies on it.
- **Milestone 1 names what a worktree is, and milestone 4 what a hunk is,** each in one parenthesis, as `docs/product.md` *File explorer and editor* does for the worktree.

### A statement whose source the reviewer should weigh

The paragraph on the trial says it starts before milestone 2 is done, because a weak result changes the direction. The frame fixes that sentence in *Data & interfaces*. Its source is the notes' list of work left, which is not one of the three sources C3 names as decisions. The phase built it as the frame states it. Whether it belongs in *Open decisions* is the proofer's reading under scenario 8.

### What phase 2 needs

- **Until phase 2, two facts have two homes.** At `cf88643`, `docs/architecture.md` *Build order* still holds the stage table and the bullet on the back of the seal, which `docs/roadmap.md` *Milestones* and *Why this order* now hold too.
- **Two sentences of `docs/roadmap.md` run ahead of `docs/architecture.md`.** *Work that runs beside the milestones* says the judgment on headless launches is made against published documents, and no milestone waits on Anthropic. The row it names still reads "Anthropic's answer" until *Scope* item 14 is built.
- **`docs/roadmap.md` cites three things in `docs/architecture.md` by name.** The heading *Build order*, for why the shell is an end-to-end skeleton. The heading *Open decisions*. The Decision cell "May the user's Claude Code be launched headless", quoted twice. Phase 2 keeps all three spellings, or edits `docs/roadmap.md` with them.
- **`docs/roadmap.md` *Later versions* links *Build order* for what is built after v0.1,** so that content has to stay under that heading (*Scope* item 8).

### What phase 3 needs

- **The English edition has 11 lines that start with `#` and 26 that start with `|`** (executed: `grep -c` at `cf88643`). Scenario 2 compares the Korean edition against those two counts.
- **It holds 28 links.** One is the switch line. Three point inside the document, at `#releases-and-the-tracker`, `#done-criteria` and `#later-versions`. The other 24 point at headings of `docs/architecture.md` and `docs/product.md`, and the Korean edition points each at the Korean edition's heading.
- **The switch line's target `docs/roadmap.ko.md` does not exist until phase 3,** and the `Broad gate` command of `seal/config.json` exits 1 with `missing docs/roadmap.ko.md` until then (executed at `cf88643`, as a narrow check).
- **A probe checked the link targets.** It read every link of `docs/roadmap.md` and compared each anchor with the headings of its target file, lower-cased, with punctuation removed and spaces turned to hyphens. It reported 28 links and one missing target, the Korean edition. The probe's rule for an anchor is its own and not GitHub's renderer, so `gaps.md` holds the rendering as not verified.
