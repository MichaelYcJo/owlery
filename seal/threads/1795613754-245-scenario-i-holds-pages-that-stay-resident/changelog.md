# Changelog: heavy-run scenario I holds pages that stay resident

Issue #245. A case of `apps/desktop/test/heavy-run.test.ts`, scenario I, starts a child that holds 64 MiB and waits for a resident reading above it. The child held zeroed pages and left them idle, and on a machine under memory pressure macOS compressed them away within a second, so the case timed out with no defect of the runner. It failed the broad gate of #237 twice in a row that way.

- **Scenario I's child fills its 64 MiB with random bytes and writes a byte of each page every 50 ms.** Memory pressure finds them neither compressible nor idle, and the case passes beside a process holding 3 GB, where the zeroed child's resident size fell to about 8 MiB and the case timed out.
- **The desktop app's version is 0.0.5, and this repository's pull requests are checked by Owlery's check at 0.0.5.** `.github/workflows/owlery-seal.yml` fetches the check from the tag `v0.0.5`, or from `release/v0.0.5` until the tag exists.
