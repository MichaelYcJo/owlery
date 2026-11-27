# Changelog: the held session is held again

Issue #321. Since release 0.1.0 took #127, a case of the desktop suite that counts the panes and agents a stopping daemon records failed on the hosted runner and on a Mac, and it passed only where the machine was slow enough. Each failure blocked a pull request until its check ran again.

- **The case that counts a stopping daemon's working agents reads two, however fast the machine is.** Owlery's behaviour is unchanged: the case's stand-in for Claude Code held its proofer session only where the prompt was "Held" alone, and since #127 a proofer's prompt carries a paragraph that names its scratch folder, so the session finished at once.
- **For a contributor:** a case whose fake adapter picks a role session by its prompt matches the prompt with that paragraph, through `withScratch` or `startedWith` in `daemon.test.ts`, since the daemon gives a proofer's and a sealer's session that paragraph (`withScratch` in `daemon.ts`).
