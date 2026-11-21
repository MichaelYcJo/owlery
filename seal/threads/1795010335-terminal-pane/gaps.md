# Closing memo: 1795010335-terminal-pane

## Not verified

| Item | Who must answer |
|---|---|
| closed Codex CLI running in the pane, which issue #3's first done-when line names: `codex` is not installed on this machine (executed: `which codex` printed `codex not found`) | a measurement no record asks for, closed at the settle of release 0.0.1: milestone 1's row of `docs/roadmap.md` asks for Claude Code or Codex, and the owner's hand check of 2026-11-21 in the app started by `pnpm --filter @owlery/desktop start` at `5bd94bf`, written on #24, saw a real Claude Code session at work in a pane; Codex would decide only a second CLI no open issue asks the pane to run. No open issue, failed run or other rule rests on the answer, so nothing is opened |
| closed The pane on another macOS machine, a Retina external display, or with the GPU context lost; only the WebGL renderer on this machine was seen | a measurement no record asks for, closed at the settle of release 0.0.1: the answer would decide only how the pane draws on another display or after a lost GPU context, where `work-item-view.ts` disposes the WebGL addon and the DOM renderer stays (`apps/desktop/src/renderer/work-item-view.ts`, `onContextLoss`). No open issue, failed run or other rule rests on the answer, so nothing is opened |
| closed The person's Korean input in the pane, in the shell and in Claude Code | seen on screen by the owner on 2026-11-18: `echo 안녕하세요` printed the word as typed, `printf '%s' "한글 조합 테스트" \| xxd` printed `ed95 9cea b880 20ec a1b0 ed95 a920 ed85 8cec 8aa4 ed8a b8`, the UTF-8 of the string, and Korean typed at Claude Code's prompt showed as typed |

## Not done

- **The main process owns the terminals, not the daemon.** Issue #5 moves them into the daemon that outlives the app; building it here would have taken that issue's scope.
- **The pane opens in the user's home folder.** Work items give it a worktree in issue #6.
- **No font setting.** The pane lists common Nerd Fonts first so shell prompt icons draw, which the owner's prompt needed (seen on screen 2026-11-18); a setting comes with the app's settings, which no issue holds yet.
- **CI does not run the desktop tests.** `.github/workflows/hygiene.yml` runs the plugin's checks only, and the tests need Electron and a native rebuild on the runner; the broad gate runs them locally.
