# Changelog: Owlery's definition of IADD follows the IADD specification 0.1.0

Issue #353. Owlery and the AgenticSeal plugin each wrote a definition of IADD, and on 2026-11-28 the owner merged the two into one specification, in MichaelYcJo/iadd-workflows at `v0.1.0`.

- **`docs/iadd.md` follows the IADD specification 0.1.0.** The specification now states the concept, the principles, the names, the names set aside and the record forms, and `docs/iadd.md` no longer restates them. The document gives Owlery's answer to each choice the specification leaves to a product. It names the documents and code that hold each of the eleven principles and the seven invariants. It also lists what Owlery adds to the record forms, among them `decisions.md`, `trail/refusals.md`, the verdict block's added lines and `IADD-Built-By:`, and each place where Owlery's code departs from the specification.
- **The Korean documents name an inspection's states 합격, 효력을 잃음 and 합격 아님**, the specification's names, in place of 검수 통과, 검수 실효 and 검수 없음.
- **Three sentences that still named the check `seal`, or left out what #354's move changed, are fixed (#362).**
- **The version is 0.2.1.**
