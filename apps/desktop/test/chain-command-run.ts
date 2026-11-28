// What the cases of the chain command share: a temporary repository whose
// `main` holds the records root, checked out on a branch that holds one
// commit, as a pane's session built it, and the command run in it in the
// case's own process, with a run folder of the case's own and the role bundle
// of the tree. No case starts an agent: a role's answer is a file the case
// writes, as a pane's session writes what its subagent answered, and a hook's
// event is a text the case hands the command as its input.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type CommandEnd, chainCommand } from "../src/daemon/chain-command";
import { MARKER } from "../src/daemon/records-place";
import { type Cleanups, NOW, VERSION, clean, commitAll, givenRound, givenInspection, runSection, write } from "./chain-run";
import { git, temporaryRepository } from "./repositories";

/** The branch the cases' session built. */
export const BRANCH = "feat/greet";

/** The role bundle of the tree, which the build copies beside the command's script. */
export const BUNDLE = join(__dirname, "..", "role-bundle");

/** A copy of the tree's role bundle in a temporary folder, removed with the case's other cleanups. */
export function bundleCopy(cleanups: Cleanups): string {
  const folder = realpathSync(mkdtempSync(join(tmpdir(), "owlery-bundle-")));
  cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
  const bundle = join(folder, "bundle");
  cpSync(BUNDLE, bundle, { recursive: true });
  return bundle;
}

/** What `owed` prints, as the cases read it. */
export interface Owed {
  step: string;
  round?: number;
  run?: number;
  target?: string;
  commit?: string;
  head?: string;
  open?: number[];
  ceiling?: number;
  agent?: string;
  model?: string | null;
  prompt?: string;
  rules?: string;
}

/**
 * A repository on the branch `BRANCH`, which holds one commit after `main`,
 * and the command in it. `gate` is the broad gate command its `config.json`
 * names, `true` where none is given. The pane's environment names `main` as
 * the base, and `env` adds to it or replaces of it. `roundsCeiling` is the
 * round the command stops at, its own ceiling where none is given, and
 * `bundleDir` the role bundle beside the command, the tree's where none is
 * given.
 */
export function commandOn(cleanups: Cleanups, options: { gate?: string; env?: Record<string, string | undefined>; roundsCeiling?: number; bundleDir?: string } = {}) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const { repo, base: folder } = made;
  write(repo, "iadd/README.md", `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
  write(repo, "iadd/config.json", `${JSON.stringify({ "Commit and pull request language": "English", "Record language": "English", "Broad gate": options.gate ?? "true" }, null, 2)}\n`);
  const main = commitAll(repo, "chore: add the place for work records");
  git(repo, "checkout", "--quiet", "-b", BRANCH);
  write(repo, "feature.txt", "A greeting\n");
  const built = commitAll(repo, "feat: greet");
  const runDir = join(folder, "run");
  mkdirSync(runDir);
  /** Each line a run of the command said on its error output while it ran, in the order said. */
  const told: string[] = [];
  /** Runs the command in the repository. `input` is what its input holds, which `ask` alone reads, and `cwd` another folder to run it in. */
  const run = (args: string[], env: Record<string, string | undefined> = {}, input = "", cwd = repo): Promise<CommandEnd> =>
    chainCommand(args, { cwd, env: { PATH: process.env.PATH, HOME: folder, OWLERY_RUN_DIR: runDir, OWLERY_BASE: "main", ...options.env, ...env }, bundleDir: options.bundleDir ?? BUNDLE, version: VERSION, now: () => NOW, roundsCeiling: options.roundsCeiling, input: () => Promise.resolve(input), say: (line) => told.push(line) });
  /** What a subcommand printed as its JSON object. It throws the command's sentence where it was refused. */
  const said = async <T = Owed>(args: string[], env?: Record<string, string | undefined>): Promise<T> => {
    const end = await run(args, env);
    if (end.code !== 0) throw new Error(`${args.join(" ")} was refused: ${end.err}`);
    return JSON.parse(end.out.split("\n")[0] ?? "") as T;
  };
  /** Writes a role's answer to a file outside the worktree, and gives its path. */
  const answer = (name: string, text: string): string => {
    const file = join(folder, name);
    writeFileSync(file, text);
    return file;
  };
  return { repo, folder, main, built, runDir, run, said, answer, told };
}

/**
 * Runs a chain to an inspection through the command, in the order `owed` names: the
 * routing, round 1 with no finding, the broad gate and the inspection, with the
 * answers a proofer and an inspector that find nothing give. Gives the cleared
 * commit.
 */
export async function inspectThrough(on: ReturnType<typeof commandOn>, inspectedBy = "agent-inspector"): Promise<string> {
  await on.said(["start"]);
  const round = await on.said(["owed"]);
  await on.said(["round", on.answer("round-1.md", clean(givenRound(readFileSync(round.prompt ?? "", "utf8"))))]);
  await on.said(["gate"]);
  const inspection = await on.said(["owed"]);
  await on.said(["inspect", on.answer("inspection-1.md", runSection(givenInspection(readFileSync(inspection.prompt ?? "", "utf8")))), "--inspected-by", inspectedBy, "--model", "owl-large"]);
  return inspection.commit ?? "";
}
