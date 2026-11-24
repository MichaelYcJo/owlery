// The entry the build bundles into `dist/chain.js`: the chain command, run in
// the folder it is started in, with the arguments after the script's name.
// A pane's session starts it through the launcher `OWLERY_CHAIN` names, with
// Electron's Node. The role bundle is the folder the build put beside this
// script, as the daemon finds it beside its own.
import { dirname, join } from "node:path";
import { chainCommand } from "./chain-command";

/** The version `package.json` holds, which the build writes in place of this name (build.mjs). */
declare const OWLERY_VERSION: string;

chainCommand(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  bundleDir: process.argv[1] === undefined ? undefined : join(dirname(process.argv[1]), "bundle"),
  version: OWLERY_VERSION,
  now: Date.now,
}).then(
  (end) => {
    process.stdout.write(end.out);
    process.stderr.write(end.err);
    process.exitCode = end.code;
  },
  (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  },
);
