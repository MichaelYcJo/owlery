# Changelog: the brand outside the window

Issue #21. The app showed Electron's icon in the Dock, and both READMEs said there was no code. Nothing outside the window told a person what Owlery is or how to start it.

- **The app's icon is Owlery's emblem.** On macOS the Dock shows a warm white owl on a black rounded square once the app is ready. The emblem has no red and no wax: the owl on the red wax seal stays the mark of a guarantee, and the window draws it at a seal's place alone.
- **Both READMEs open with the emblem and one line:** "Answer once, and come back to a pull request sealed by a party that did not build it."
- **The READMEs say how to run the app.** A new section, "Run it", says what release 0.0.1 runs, what a person needs (macOS, Node.js and pnpm 10.33.0) and the two commands: `pnpm install`, then `pnpm --filter @owlery/desktop start`. The first start downloads Electron's binary.
- **The READMEs no longer say there is no code.**
- **The emblem's drawings are in the tree,** under `apps/desktop/assets/icon/`, and `TRADEMARKS.md` lists each. They are not under the Apache License 2.0.
- **Not yet:** the app is not packaged. Until the app is ready the Dock shows Electron's icon, and the system calls the app "Electron". A simpler drawing for 32 pixels and under is in the tree, and nothing shows it until the app is packaged (issue #78).
