# Routing: 1795855409-353-owlerys-iadd-follows-the-specification

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | the session |
| Implementation | the session |
| Automation | yes |
| Branch | docs/353-owlerys-iadd-follows-the-specification |

Answered 2026-11-28 by the orchestrator, before the first edit, on the route the owner set.

## Why this way

Issue #353 compared Owlery's and AgenticSeal's definitions of IADD, and the owner decided each difference on 2026-11-28 ([step A](https://github.com/MichaelYcJo/owlery/issues/353#issuecomment-7236479163)). The merged definition is the specification in MichaelYcJo/iadd-workflows, tagged `v0.1.0`. This work item writes Owlery's side: `docs/iadd.md` and its twin name that version, state where Owlery holds each principle and invariant, list what Owlery adds to the record forms and where it departs, and drop what the specification now states. Owlery's Korean documents take the specification's Korean names (row C7: 합격, 효력을 잃음, 합격 아님). It also fixes the three sentences of #362, and, as the first pull request of release 0.2.1, moves the version.

The owner set the route on 2026-11-28, before the comparison started: "반영은 작업 기록으로 하되 framer 없이 리뷰 1회만 거치고, broad gate는 문서 검사만, sealer는 생략." and "#362의 문장 세 개도 같이 고쳐." The version came from the owner the same day: "0.2.1로 진행해".

- **Planning and implementation, the session.** No framer, by the owner's word. The decisions are the ground, so the change writes them and designs nothing.
- **Review, one independent round.** One proofer round, by the owner's word, and the orchestrator closes its findings.
- **Broad gate, its documents leg alone.** The change touches documents and one version line. CI runs the suite once on the pull request. The leg is the part of `Broad gate` in `agentory/config.json` after `pnpm -r run check &&`.
- **No inspector, by the owner's word.** The owner's decisions are the ground. So the pull request's check `inspection` reads not cleared, and the owner merges past it.
- **Branch:** cut from `origin/release/v0.2.1`, which was cut from `main` at `e472b841` on 2026-11-28.
