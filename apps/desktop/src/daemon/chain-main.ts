// The entry the build bundles into `dist/chain.js`: the chain command, run in
// the folder it is started in, with the arguments after the script's name.
// A pane's session starts it through the launcher `OWLERY_CHAIN` names, with
// Electron's Node. The role bundle is the folder the build put beside this
// script, as the daemon finds it beside its own. The command's input is read
// where a subcommand asks for it, which `ask` alone does, so no other
// subcommand waits on a terminal, and `run` hands it whole to the command it
// runs. A line the command says while it runs, as a wait for the machine,
// reaches the error output at once.
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
  say: (line) => process.stderr.write(`${line}\n`),
  input: async () => {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString("utf8");
  },
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
