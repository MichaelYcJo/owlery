# Phase 2: 1795005804-v0.1-scope-and-milestones

## What this phase found

**The frame holds for this phase.** At `fdd7ec8`, `docs/architecture.md` has the paragraph on Anthropic at line 57, *Build order* at lines 225 to 237, and the three rows of *Open decisions* at lines 334, 343 and 344, as `frame/design.md` *Grounding* states for `9aa6d7c`. The three spellings `docs/roadmap.md` depends on are unchanged: the heading *Build order*, the heading *Open decisions*, and the Decision cell "May the user's Claude Code be launched headless".

The phase changes prose only, so it wrote no case, showed nothing red and ran no mutation. `skills/verify/SKILL.md` *The narrow command still has to be able to fail*, the row for prose only, is the ground: nothing in the repository parses these documents.

### Decisions and departures

Each was judged against `frame/design.md`, in the section named.

- **The paragraph under *Authentication of the Claude adapter* also says what each page says, in one sentence each.** *Scope* item 13 lists four statements and not these two. Without them the sentence "judges headless role sessions against these two documents" names a judgment whose inputs the reader cannot see. Both sentences stay inside what the *Grounding* row on the two pages holds.
- **This phase opened both pages on 2026-11-18.** The Agent SDK overview came back as the page's text. The support article came back as a model's answer with its title and its two dated updates quoted. Both agree with the *Grounding* row. `gaps.md` closes its row on that reading and says how each page was read.
- **The Criteria cell of the headless row links to *Authentication of the Claude adapter*** for the titles and the date, and repeats neither. The row stays the home of the decision, as *Grounding* says, and C5 keeps the titles in one place.
- **The Criteria cell of "How to read usage limits" names what the documents are read for:** what they say about another product reading the user's login token. *Scope* item 15 asks only that the cell name the published documents. The second option of that row is reading the token, so the criterion says so.
- **What is built after v0.1 is a bullet, not a table.** *Removes* says the Extend row stays "no longer a numbered stage". A table of one row would keep the form of the stage table. Its last clause now links *Open decisions*, where the old cell said "the decision table".
- **The section's first paragraph says "v0.1 is what this document calls the first version".** `docs/architecture.md` did not use "v0.1" before this phase, and items 9 and 10 put the word into it in three places.
- **The skeleton bullet says "when the AgenticSeal process is built on it"** where the old one said "during the port", and "the first milestone" where it said "the first stage" and "the start". The stage table that gave "the port" its meaning is gone.

### What the reviewer should weigh

`gaps.md` *Not done* holds three things this phase saw and left: a sentence of the old opening paragraph that now has no home, the reason for the skeleton standing in both documents, and the words "the build order" in `README.md`'s row for the architecture document.

The Port row's cell also said the process is optimized "as the tables in this document say", with a link to *What we take from AgenticSeal*. `docs/roadmap.md` milestone 2 links *What each session loads* and not that section. The fact itself still stands in *What we take from AgenticSeal*, so nothing is lost, and the roadmap has one link fewer than the old row.

### Searches

Run over the tree at `73d3850`.

- `git grep -n -e 'check with Anthropic' -e "Anthropic's answer" -- docs README.md` printed nothing and exited 1.
- `git grep -n -e 'port stage' -e 'extension stage' -- docs README.md` printed nothing and exited 1.
- `git grep -n 'Build order' -- docs` printed the heading at `docs/architecture.md` line 225, the citation at `docs/product.md` line 27, and lines 21 and 80 of `docs/roadmap.md`.
- `git grep -n -i 'anthropic' -- docs/architecture.md docs/roadmap.md README.md` printed four lines: lines 57, 328 and 338 of `docs/architecture.md` and line 55 of `docs/roadmap.md`. Each was read, and none says Owlery asks Anthropic or waits for its answer.
- Scenario 6's name search, with a list of 27 names built in this phase's scratch directory, printed nothing over `docs`, the README pair and `seal`, and exited 1.
- Scenario 7's search printed nothing and exited 1.
- A probe read the 59 links of `docs/architecture.md`, `docs/roadmap.md` and `README.md` and compared each anchor with the headings of its target file, by the rule phase 1's probe used. One target is missing, `docs/roadmap.ko.md`, which is phase 3's.

### What phase 3 needs

- **The English text to translate is the diff of `73d3850`:** one paragraph under *Authentication of the Claude adapter*, the whole of *Build order*, three rows of *Open decisions*, and one row of `README.md`'s *Documents* table.
- **No heading and no anchor of `docs/architecture.md` changed.** It still has 26 lines that start with `#`. The Korean edition has 26.
- **The English edition has 108 lines that start with `|`, and the Korean edition has 113** (executed: `grep -c` at `73d3850`). The five are the stage table: its header, its rule and its three rows. The Korean *만드는 순서* drops the same five.
- **`README.md` has 6 lines that start with `|` and `README.ko.md` has 5.** The Korean row links `docs/roadmap.ko.md`.
- **Three links are new in `docs/architecture.md`:** `roadmap.md#milestones` in the first paragraph of *Build order*, `#open-decisions` in its second bullet, and `#authentication-of-the-claude-adapter` in the headless row. The Korean edition points each at the Korean heading, and the first at `roadmap.ko.md`.
- **The titles of the two pages stay in English,** because the paragraph cites them by title. The date read is 2026-11-18.
- **The `Broad gate` command of `seal/config.json` exits 1 at `73d3850`** with `table rows differ: docs/architecture.md docs/architecture.ko.md` (executed, as a narrow check). It reaches the missing `docs/roadmap.ko.md` only after that pair agrees.
