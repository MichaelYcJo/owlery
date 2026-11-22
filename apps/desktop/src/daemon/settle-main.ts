// The entry `scripts/settle.mjs` bundles and runs: the release's settle, run
// in the folder pnpm starts it in, with the flags after the script's name.
import { command } from "./settle";

process.exitCode = command(process.argv.slice(2), process.cwd(), {
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
});
