# Install size: the .dmg and the installed app

**The `.dmg` a person downloads is 124,928,691 bytes, and the app it installs takes 283,232 KiB on disk.** Issue #75 sets caps on what Owlery takes on a Mac, and these are the first sizes of a package to hold them against. The package is one build for Apple silicon, signed ad hoc, with the app's files as a folder and not as an archive.

## What was measured

| | |
|---|---|
| Date | 2026-11-26 |
| Commit | `12c02961`, with no change in the working tree |
| Machine | MacBook Pro, Apple M3 Pro, 36 GB |
| Versions | macOS 26.5, Node.js 26.13.1, pnpm 10.33.0, Electron 45.3.3, electron-builder 26.18.0 |
| Version of the app | 0.0.5 |

## The commands

Both were run from the repository's root, each once, with no signing variable set.

```
pnpm --filter @owlery/desktop run package
pnpm --filter @owlery/desktop run package:verify
```

`package:verify` copies the app out of the mounted image with `ditto`, as a person's drag into Applications copies it, and prints the size line below once every check has held.

## The sizes

| What | Size | Read with |
|---|---|---|
| `Owlery-arm64.dmg` | 124,928,691 bytes | `statSync(dmg).size` in `package:verify` |
| `Owlery.app`, copied out of the image | 283,232 KiB on disk, 290,029,568 bytes | `du -sk` in `package:verify` |
| `Owlery.app` as the packager left it in `out/mac-arm64/`, the sum of its files' sizes | 288,087,326 bytes | `find Owlery.app -type f -print0 \| xargs -0 stat -f %z`, summed |

The app holds Electron's framework, the app's `dist/`, and the modules the bundles leave out with what they load: `node-pty`, `ws`, `node-addon-api` and `@xterm`. `node-pty` carries its builds for other platforms, which no packaged code loads.
