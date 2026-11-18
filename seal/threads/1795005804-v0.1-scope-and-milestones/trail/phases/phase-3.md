# Phase 3: 1795005804-v0.1-scope-and-milestones

## What this phase found

**The frame holds for this phase.** At `cca5832` the English to translate stands where phase 2's record says: `docs/roadmap.md` whole, and in `docs/architecture.md` the paragraph at line 57, *Build order* at lines 225 to 231, and the rows of *Open decisions* at lines 328, 337 and 338. `docs/architecture.ko.md` still held the old text at lines 57, 225 to 237, 334, 343 and 344. Every Korean heading the translation links to exists in `docs/architecture.ko.md` and `docs/product.ko.md`.

The phase changes prose only, so it wrote no case, showed nothing red and ran no mutation. `skills/verify/SKILL.md` *The narrow command still has to be able to fail*, the row for prose only, is the ground. The one thing that parses these files is the `Broad gate` command of `seal/config.json`, and *Searches and counts* below holds its run.

No English file changed in this phase.

### The words chosen for Q2

`frame/questions.md` Q2 hands the choice to this phase. Each word was judged against `frame/design.md` C4 and against `skills/writing-style/SKILL.md` *용어는 실물을 확인하고 고른다*.

| English | Korean | Grounds |
|---|---|---|
| milestone | 마일스톤 | Q2's default. GitHub's own Korean word for the tracker object is the same, and the document uses one word for both, as the English does |
| done criteria | 완료 기준 | Q2's default |
| Done when (the column) | 끝났다고 보는 기준 | The stage table that `docs/architecture.ko.md` held until this phase used it for the same column |
| roadmap | 로드맵 | The common word |
| release, tracker, issue tracker | 릴리스, 트래커, 이슈 트래커 | 릴리스 is in the existing editions |
| the Korean input regression test | 한글 입력 회귀 테스트 | `docs/architecture.ko.md` says 한글 입력 for Korean input |
| the depth judgment | 깊이 판단 | No existing edition holds it. The cell defines it where it first appears, as the English does |
| setup script | 설정 스크립트 | |
| archive, restore | 보관, 복원 | |
| staging, hunk | 스테이징, hunk | hunk stays in English with its parenthesis, as worktree does in `docs/product.ko.md` |
| line comment | 줄 코멘트 | `docs/product.ko.md` says 줄 for a line of code |
| merge button | 머지 단추 | `docs/architecture.ko.md` says 단추 for a button |
| while the seal holds | 인장이 깨지지 않은 동안 | The existing editions name the seal's two states by 깨짐, so the holding state is said as not broken |
| approving review, required check | 승인 리뷰, 필수 검사 | 검사 is the existing word for a GitHub check |
| telemetry | 텔레메트리 | |
| the trial on other people's PRs | 남의 PR로 하는 시험 | 시험 is the existing word for a trial, and 남의 for another party's project |
| outside contributor | 외부 기여자 | `docs/architecture.ko.md` *라이선스와 다른 프로젝트의 코드* |
| the owner, the owner's private notes | 저장소 소유자, 저장소 소유자의 비공개 메모 | 만드는 사람 in `docs/architecture.ko.md` translates another phrase, the person who builds the app |
| scheduled runs | 예약 실행 | |
| Later versions (the heading) | 이후 버전 | |

Terms the existing editions already hold were reused as they stand: 작업함, 작업, 전체 검사, 인장의 뒷면, 역할 묶음, 역할 세션, 껍데기, 터미널 칸, 가짜 어댑터, 승인 줄, 질문 묶음, 질문 화면, 장부, 자원 상한, 사용 한도, "인장 받기", "다시 인장 받기", 결정을 남겨 둔 것, 선택지, 판단 기준, and the four inbox states of `docs/product.ko.md`.

**The Status cell of Q2 is not written by this phase.** `agents/crafter.md` *Job* lists the crafter's writes, and `frame/questions.md` is not among them. The hand-back carries the cell's text for the orchestrator.

### Decisions and departures

Each was judged against `frame/design.md` *Scope* item 2 and C4, and against `skills/writing-style/SKILL.md` *영어를 옮길 때는 구조를 버리고 뜻만 가져온다*.

- **Cells that end on a noun phrase in English end on a verb in Korean.** The checks of the third, fourth and fifth done criteria and several "What is built" sentences are the cases. The Korean rule refuses a sentence with no predicate, and the content of each cell is the same.
- **The milestone names are 껍데기, 인장 받기, 이슈부터 맡기기, 사람이 직접 손대기, and PR 뒤, 그리고 한도.** The second and third are the names `docs/product.ko.md` *바탕* gives the two paths to a seal.
- **"for v0.2" and "for v0.3" in *Later versions* are short sentences after the link,** and "which are settled before v0.2" is one too. A trailing clause after a link does not read in Korean.
- **The plain words "architecture.md" and "product.md" beside a link read `architecture.ko.md` and `product.ko.md`.** The reader of the Korean edition is sent to the Korean file.
- **The quoted Decision cell is the Korean one,** "사용자의 Claude Code를 헤드리스로 띄워도 되는가", as `docs/architecture.ko.md` *결정을 남겨 둔 것* spells it. It stands twice in `docs/roadmap.ko.md`, and that row's Decision cell must keep this spelling.
- **In `docs/architecture.ko.md` the Criteria cell of the headless row opens with a question,** as the other cells of that column do, where the English opens with a noun phrase.
- **The bullet on the back of the seal left `docs/architecture.ko.md` whole,** with its clause on what other review tools show. `frame/design.md` *Removes* says the clause does not move, and `docs/roadmap.ko.md` ground 1 translates the English ground, which does not hold it.

### What the reviewer should weigh

- **`docs/architecture.md` *Authentication of the Claude adapter* gives two dates for one page.** Line 48 cites the Agent SDK overview as checked on 2026-11-17, and line 57 says both documents were read on 2026-11-18. Both are true readings, and the Korean edition translates both. This phase changes no English file.
- **The three things `gaps.md` *Not done* holds from phase 2 stand in the Korean editions as well,** because the translation follows the English as it stands.

### Searches and counts

Run over the tree at the commit that added the Korean documents.

- `grep -c '^#'` printed 11 for both editions of `roadmap` and 26 for both editions of `architecture`. `grep -c '^|'` printed 26 for both editions of `roadmap` and 108 for both editions of `architecture`. `README.md` and `README.ko.md` each have 6 lines that start with `|`. All six files of the three pairs have equal line counts as well.
- `sed -n 3p docs/roadmap.md` printed `*English · [한국어](./roadmap.ko.md)*`, and `sed -n 3p docs/roadmap.ko.md` printed `*[English](./roadmap.md) · 한국어*`.
- Scenario 5's search printed nothing and exited 1.
- Scenario 6's second command, with a list of 27 names built in this phase's scratch directory by the command the spawn gave, printed nothing over `docs`, the README pair and `seal`, and exited 1.
- Scenario 7's search printed nothing and exited 1.
- Scenario 9: `ls docs/roadmap.md docs/roadmap.ko.md` exited 0, and line 17 of each README holds the row that links its own language's edition.
- Scenario 11's search printed nothing and exited 1. `git grep -n -i 'anthropic' -- docs` printed eight lines: lines 57, 328 and 338 of each architecture edition and line 55 of each roadmap edition. Each was read, and none says Owlery asks Anthropic or waits for its answer.
- The `Broad gate` command of `seal/config.json`, run once as a narrow check, printed nothing and exited 0.
- A search for what the stage names left behind, `git grep -n -e '첫 단계' -e '이식할 때' -e '이식해' -e 'first stage' -e 'the port' -- docs README.md README.ko.md`, printed nothing.
- A probe read every link of the six files and compared each anchor with the headings of its target file, by a rule of its own: lower case, letters, digits and hyphens kept, spaces turned to hyphens. Each pair has the same number of links, 28 in `roadmap`, 23 in `architecture` and 8 in the README, and no target is missing. The only links from a Korean edition to an English file are the three switch lines.

### A template the plugin does not hold

`skills/implement/SKILL.md` and the spawn say `changelog.md` is written from its template. `templates/records/` holds no changelog template (executed: `find templates -type f`). The fragment was written to what `docs/layout/the-record-layout.md` *A fact of a work item has one record* says it holds, what changed for a user. It carries no `### Process changes` table, because the diff changes none of the files *A change writes fragments, never a shared file* names.
