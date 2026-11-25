// The chain command: what a pane's session calls to run the owl chain on the
// branch it built. It is Owlery's code, built from the daemon's own modules
// into `dist/chain.js`: it reads the worktree it is run in, says which stage
// the records owe (`chain.ts#stepOwed`), hands the session that stage's
// prompt, and turns each role's answer into a committed record through the
// module the daemon's chain writes its records with (`stage-records.ts`). So
// the order stays code, a judging role writes no record, and a gate is an
// exit code Owlery's code read, in a pane as in the daemon's chain
// (docs/architecture.md, "Code runs the order, the orchestrator judges"). It
// asks the daemon for one thing, a turn on the machine (`turn-socket.ts`),
// before `gate` runs the broad gate and before `run` runs a heavy command,
// and runs the command at once where no daemon answers.
//
// Each subcommand but `ask` and `run` prints one JSON object on its first
// line and exits with 0, or writes a sentence to its error output and exits
// with 1, with nothing committed. The session runs each role as a subagent of
// the bundle and judges what the daemon asks its orchestrator agent: this
// command starts no session and judges nothing. `ask` is the subcommand the
// bundle's hook on `AskUserQuestion` runs (role-bundle/hooks/hooks.json): it
// prints no JSON, and its exit code tells Claude Code whether the call goes
// through. `run` is the runner of heavy commands, which the launcher
// `OWLERY_RUN` names starts (`pane-chain.ts#writeRunner`): it prints no JSON,
// and exits with the command's exit code.
import { execFile, spawn } from "node:child_process";
import { constants } from "node:os";
import { mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import type { RoleStage } from "../shared/protocol";
import { composeBack } from "../shared/seal-back";
import { agentOf, rulesFileName, rulesText } from "./adapters/claude-roles";
import { BASE_RECORDED, type ChainBase, ChainStop, type StagePrompt, type Standing, type Step, baseOf, chainStoppedSays, earlierRunSays, endedWith, gateNotRunSays, inFolder, promptText, recordedBase, roundNumber, stageName, standingOf, stepOwed, stoppedSays, twiceFailedWhy, whyNoBase } from "./chain";
import { ROUTING_FILE, routingAnswer, workItemDirectories } from "./decision-record";
import { GATE_LIMIT_MS, gateEnvironment, startGate } from "./gate";
import { backSection, bodyRecords, sealSection } from "./github";
import { shellQuote } from "./hooks";
import { BROAD_GATE_NAME, type TurnPlace } from "./machine-turns";
import { ROUND_BASE, THE_SESSION, isSessionId, listed } from "./record-blocks";
import { readHeavyCommands, readRecordsPlace, rootOf } from "./records-place";
import { repositoryFileText } from "./repository-file";
import { sealRecords } from "./seal-back-records";
import { watchMemory } from "./heavy-runs";
import { type Ran, type RunEnd, TURN_SOCKET, type TurnRequest, takeTurn } from "./turn-socket";
import { type Place, declaredDirectory, fixPassStage, gateOwed, recordFixPass, recordGate, recordRound, recordVerdict, roundStage, sealStage } from "./stage-records";
import { writeWholeFile } from "./whole-file";
import { baseRef, commitNamed, newCommits, sharedCommit, uncommittedPaths, whyNoCommit, worktreeHead } from "./worktrees";

/** What a run of the command is given: the folder it is run in, its environment, the bundle the build put beside its script, the version the build wrote into it, and its clock. */
export interface CommandContext {
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  /** The role bundle's folder, or undefined where the command stands beside none. */
  bundleDir: string | undefined;
  /** The app's version, which a verdict's `rules:` line names, or undefined where the build gave none. */
  version: string | undefined;
  now: () => number;
  /** How long the broad gate's command may run; `GATE_LIMIT_MS` of `gate.ts` when absent. */
  gateLimitMs?: number;
  /** What the command's input holds, to its end. `ask` alone reads it, and a run given none reads an empty input. */
  input?: () => Promise<string>;
  /** Writes one line to the command's error output at once, while the command still runs, as a wait for the machine is said. */
  say: (line: string) => void;
  /** Called with each reading of the memory of the command `run` runs, once the reading is kept. A case waits on it, so no reading's time decides what it reads. */
  memoryRead?: (bytes: number) => void;
}

/** How a run of the command ended: its exit code, and what it prints on each stream. */
export interface CommandEnd {
  code: number;
  out: string;
  err: string;
}

/** The subcommands, in the order the usage names them. */
export const SUBCOMMANDS = ["owed", "start", "round", "fix-pass", "gate", "seal", "body", "ask", "run"] as const;

/** The usage, which a run with no subcommand or an unknown one is refused with. */
export const USAGE = [
  "Usage, in a work item's worktree:",
  "  owed [--base <base>]                                  the step the records owe, with the stage's prompt",
  "  start [--base <base>] [--automation <yes or no>]      declare the work item's routing",
  "  round <answer-file> [--base <base>]                   record a proofer's answer",
  "  fix-pass --by <session>                               record a fix pass's close blocks",
  "  gate                                                  run the broad gate and record a pass",
  "  seal <answer-file> --judged-by <id> --model <name>    record a sealer's answer",
  "  body                                                  write the pull request body's sections",
  "  ask                                                   answer the bundle's hook on an AskUserQuestion call",
  "  run <name> [-- <words>]                               run a heavy command the repository names, in its turn on the machine",
  "",
].join("\n");

/** How another base is named for the chain command, before round 1's record stands: the sentence that ends `chain.ts#whyNoBase`'s reason there. */
export const BASE_OPTION = "Name another with `--base <branch or commit>`.";

/** The answers `start` takes on `--automation`, which are the ones the pull request check reads in a routing's `Automation` row (`pr-check/lib/routing.py`). */
const AUTOMATION_ANSWERS = ["yes", "no"] as const;

/** The words a question opens with to pass `ask` under `Automation` `yes`, with the reason after them. It is the one form `ask` reads. */
export const NO_DEFAULT = "No default can be taken: ";

/** A refusal of the command: its message is the whole sentence the command prints. */
class Refusal extends Error {}

/** The roles a pane's session runs as subagents, by the step that owes each. */
const ROLE_OF: Record<"round" | "fix-pass" | "seal", RoleStage> = {
  round: { role: "proofer", stage: "round" },
  "fix-pass": { role: "crafter", stage: "fix-pass" },
  seal: { role: "sealer", stage: "seal" },
};

function gitSays(cwd: string, args: readonly string[]): Promise<string | null> {
  return new Promise((done) => {
    execFile("git", [...args], { cwd, encoding: "utf8" }, (error, stdout) => done(error === null ? stdout.trim() : null));
  });
}

/** The arguments as the positional ones and the options, each option a `--name` with the value after it. It throws a `Refusal` for an option the subcommand does not take and for one with no value. */
function parsed(args: readonly string[], takes: readonly string[]): { positional: string[]; options: Map<string, string> } {
  const positional: string[] = [];
  const options = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const value = args[index + 1];
    if (!takes.includes(arg)) throw new Refusal(`The subcommand takes no option ${arg}.\n${USAGE}`);
    if (value === undefined) throw new Refusal(`The option ${arg} names nothing.\n${USAGE}`);
    options.set(arg, value);
    index += 1;
  }
  return { positional, options };
}

/** What every subcommand reads first: the worktree the command is run in, its branch and its head. */
interface Here {
  worktree: string;
  branch: string;
  head: string;
  /** The work item's directory, or null where none names the branch. */
  directory: string | null;
}

/** Why the command refuses a worktree whose HEAD names no branch: a work item's branch is made at its first commit, from a read the daemon makes only while a window is connected. */
export const NO_BRANCH_HERE = "The worktree's HEAD names no branch yet. Owlery makes the work item's branch at its first commit, within a few seconds while Owlery's window is open; run the command again once it has.";

/**
 * Reads where the command is run: the worktree's top, the branch its HEAD
 * names, and the work item's directory. It throws a `Refusal` where the
 * folder is in no worktree, where HEAD names no branch, where the worktree
 * cannot take a commit (`worktrees.ts#whyNoCommit`), where it holds no
 * records root, and where two directories name the branch, as the daemon
 * refuses a start of its chain for each.
 */
async function here(context: CommandContext): Promise<Here> {
  const worktree = await gitSays(context.cwd, ["rev-parse", "--show-toplevel"]);
  if (worktree === null || worktree === "") throw new Refusal(`${context.cwd} is in no worktree of a repository, and the chain command runs in a work item's worktree.`);
  const branch = await gitSays(worktree, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (branch === null || branch === "") throw new Refusal(NO_BRANCH_HERE);
  const why = await whyNoCommit(worktree, branch);
  if (why !== null) throw new Refusal(`Owlery cannot commit a record in the worktree now: ${why}.`);
  const root = rootOf(worktree);
  if (root === null) throw new Refusal("The worktree holds no place for work records, so a round's record has nowhere to stand. Set up the records in the repository, and bring them onto this branch.");
  const directories = workItemDirectories(worktree, branch);
  if (directories.length > 1) throw new Refusal(`Two directories of the worktree's records name the branch ${branch}: ${directories.map((directory) => relative(worktree, directory)).join(" and ")}. Owlery cannot tell which is the work item's.`);
  return { worktree, branch, head: await worktreeHead(worktree), directory: directories[0] ?? null };
}

/**
 * The base the chain reads the branch against: the one round 1's record
 * names where the head holds that record, and otherwise the one the
 * `--base` option names, or the pane's environment in `OWLERY_BASE`. A base
 * that is a branch is read from where the branch and the head last shared a
 * commit, and a base that is a commit is that commit. It throws a `Refusal`
 * where no record stands and nothing names a base, where the name given
 * names no commit, and where the branch left the base
 * (`chain.ts#whyNoBase`).
 */
async function baseHere(context: CommandContext, at: Here, option: string | undefined): Promise<ChainBase> {
  const { worktree, head } = at;
  const recorded = at.directory === null ? null : await recordedBase(worktree, at.directory, head);
  const given = option ?? context.env.OWLERY_BASE ?? null;
  let stated: ChainBase;
  if (given === null || given === "") {
    if (recorded === null) throw new Refusal(`Nothing names the base the branch is read against: the pane's environment holds no OWLERY_BASE. ${BASE_OPTION.replace("another", "it")}`);
    stated = { named: recorded, commit: null, reads: head, branch: null };
  } else {
    const commit = await commitNamed(worktree, given);
    if (commit === null) {
      if (recorded === null) throw new Refusal(`The repository holds no branch and no commit named ${given}, so a round has no base to read the branch against. ${BASE_OPTION}`);
      stated = { named: recorded, commit: null, reads: head, branch: null };
    } else {
      const branch = (await baseRef(worktree, given)) === null ? null : given;
      // A name the round block's `target:` line does not take is named by its commit, as the daemon names one (`chain.ts#roundBase`).
      stated = { named: ROUND_BASE.test(given) ? given : commit, commit: branch === null ? commit : await sharedCommit(worktree, given, head), reads: given, branch };
    }
  }
  const base = await baseOf(worktree, head, recorded, stated);
  const left = await whyNoBase(worktree, head, base, recorded === null ? BASE_OPTION : BASE_RECORDED);
  if (left !== null) throw new Refusal(left);
  return base;
}

/** The folder of Owlery's run folder the command writes a stage's prompt and rules into, readable by the user alone: the run folder is the one `OWLERY_RUN_DIR` names, as a pane's environment holds it from the daemon, and otherwise the folder of the launcher `OWLERY_CHAIN` names. */
function stageFolder(context: CommandContext, workItem: string): string {
  const run = context.env.OWLERY_RUN_DIR || (context.env.OWLERY_CHAIN ? dirname(context.env.OWLERY_CHAIN) : "");
  if (run === "") throw new Refusal("The environment names no run folder of Owlery, in OWLERY_RUN_DIR or by the launcher in OWLERY_CHAIN, so the stage's prompt has nowhere to stand. Run the command in a pane Owlery opened.");
  const folder = join(run, "chain", workItem);
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  return folder;
}

/** Writes a stage's prompt and its role's rules file, with the head of a pane's subagent (`claude-roles.ts#rulesHead`), into the run folder, and gives what the session starts the role with: the bundle agent's name and the two paths. */
function handed(context: CommandContext, workItem: string, step: "round" | "fix-pass" | "seal", name: string, prompt: StagePrompt): { agent: string; prompt: string; rules: string } {
  if (context.bundleDir === undefined) throw new Refusal("The chain command stands beside no role bundle, so it has no rules to hand the role.");
  const role = ROLE_OF[step];
  const folder = stageFolder(context, workItem);
  const promptFile = join(folder, `${name}.prompt.md`);
  const rulesFile = join(folder, rulesFileName(role));
  writeWholeFile(promptFile, promptText(prompt));
  writeWholeFile(rulesFile, rulesText(context.bundleDir, role, "pane"));
  return { agent: agentOf(role), prompt: promptFile, rules: rulesFile };
}

/** The order's reading of the work item at the head, as a run of a chain reads it. */
async function standingHere(at: Here & { directory: string }, base: ChainBase): Promise<Standing> {
  return standingOf(at.worktree, at.directory, at.head, base.named, "worktree");
}

/** The step a subcommand records, which the records must owe. It throws a `Refusal` that names the step they owe where it is another. */
function owes<K extends Step["is"]>(step: Step, is: K, subcommand: string): Extract<Step, { is: K }> {
  if (step.is === is) return step as Extract<Step, { is: K }>;
  const owed = step.is === "parked" ? "the answers to the work item's open questions" : step.is === "sealed" ? "nothing more: the branch is sealed" : stageName(step.is, step.round).replace(/^[A-Z]/u, (letter) => letter.toLowerCase());
  throw new Refusal(`The records owe ${owed}, and \`${subcommand}\` records ${is === "fix-pass" ? "a fix pass" : is === "round" ? "a review round" : is === "gate" ? "the broad gate" : "the seal"}. Ask \`owed\` for the step.`);
}

/** The text of the file a subcommand is handed, by its path from the folder the command is run in. */
function answerOf(context: CommandContext, file: string | undefined, subcommand: string): string {
  if (file === undefined) throw new Refusal(`\`${subcommand}\` takes the file that holds the role's answer.\n${USAGE}`);
  try {
    return readFileSync(isAbsolute(file) ? file : resolve(context.cwd, file), "utf8");
  } catch (error) {
    throw new Refusal(`The answer's file ${file} cannot be read: ${error instanceof Error ? error.message : String(error)}.`);
  }
}

/** The work item's directory, which every subcommand but `owed` and `start` needs. */
function declared(at: Here): Here & { directory: string } {
  if (at.directory === null) throw new Refusal(`No directory of the worktree's records names the branch ${at.branch}. \`start\` declares the work item's routing.`);
  return { ...at, directory: at.directory };
}

const placeOf = (at: Here & { directory: string }): Place => ({ worktree: at.worktree, branch: at.branch, directory: at.directory });

async function owed(context: CommandContext, args: readonly string[]): Promise<object> {
  const { options } = parsed(args, ["--base"]);
  const found = await here(context);
  if (found.directory === null) return { step: "start" };
  const at = declared(found);
  const base = await baseHere(context, at, options.get("--base"));
  const standing = await standingHere(at, base);
  const step = stepOwed(standing);
  const workItem = basename(at.directory);
  if (step.is === "parked") return { step: "parked" };
  if (step.is === "sealed") return { step: "sealed", round: step.round, commit: step.at };
  if (step.is === "gate") return { step: "gate", round: step.round, head: step.head };
  if (step.is === "round") return { step: "round", round: step.round, target: step.target, ...handed(context, workItem, "round", `round-${String(step.round)}`, await roundStage(placeOf(at), standing, step, base)) };
  if (step.is === "fix-pass") return { step: "fix-pass", round: step.round, open: step.open, reversals: step.reversals.map(({ id }) => id), ...handed(context, workItem, "fix-pass", `fix-pass-${String(step.round)}`, (await fixPassStage(placeOf(at), standing, step)).prompt) };
  const { prompt, target } = await sealStage(placeOf(at), standing, step, base);
  return { step: "seal", round: step.round, run: step.run, commit: step.commit, target, ...handed(context, workItem, "seal", `seal-${String(step.run)}`, prompt) };
}

/**
 * Declares the work item's routing where no directory names the branch, as
 * the daemon's chain does at its first start. With `--automation` the
 * routing holds the `Automation` row with that answer, which `ask` reads,
 * and with no such option it holds no such row. It refuses, with nothing
 * written, what the daemon refuses a start for: a records root whose
 * `config.json` names no broad gate, a change no commit holds, a branch
 * that left its base, and a branch that holds no commit after its base. It
 * also refuses an answer other than `yes` and `no`, and an answer that a
 * routing which stands does not hold, since it writes no routing that
 * stands.
 */
async function start(context: CommandContext, args: readonly string[]): Promise<object> {
  const { options } = parsed(args, ["--base", "--automation"]);
  const given = options.get("--automation");
  const automation = AUTOMATION_ANSWERS.find((answer) => answer === given) ?? null;
  if (given !== undefined && automation === null) throw new Refusal("`start` takes `--automation` with `yes` or `no`: whether the run goes on without stopping for a question.");
  const at = await here(context);
  const { worktree, branch, head } = at;
  const root = rootOf(worktree) ?? "";
  if ((readRecordsPlace(worktree).broadGate ?? "").trim() === "") throw new Refusal(`${root}/config.json of the worktree names no command under "Broad gate", so no broad gate can run on this branch and no seal can be given. Name the repository's check there, and commit it.`);
  const inside = at.directory === null ? null : relative(worktree, at.directory);
  if (at.directory !== null && inside !== null && automation !== null) {
    const stands = routingAnswer(repositoryFileText(join(at.directory, ROUTING_FILE)) ?? "", "Automation");
    if (stands !== automation) throw new Refusal(`${inside}/${ROUTING_FILE} stands and ${stands === null ? "holds no \`Automation\` row" : `answers \`Automation\` \`${stands}\``}, and \`start\` writes a routing only where none names the branch. Change the row in that file and commit it.`);
  }
  const loose = (await uncommittedPaths(worktree)).filter((path) => inside === null || !inFolder(path, inside));
  if (loose.length > 0) throw new Refusal(`The worktree holds a change no commit holds, at ${loose[0] ?? ""}${loose.length > 1 ? ` and ${String(loose.length - 1)} more` : ""}. A round reads a committed tree: commit the change or remove it first.`);
  const base = await baseHere(context, at, options.get("--base"));
  if (base.commit !== null && (await newCommits(worktree, branch, base.commit)) === 0) throw new Refusal("The branch holds no commit after its base, so a round has nothing to read.");
  const directory = await declaredDirectory(worktree, branch, context.now(), undefined, automation);
  return { step: "start", directory: relative(worktree, directory), declared: at.directory === null, head: at.directory === null ? await worktreeHead(worktree) : head };
}

async function round(context: CommandContext, args: readonly string[]): Promise<object> {
  const { positional, options } = parsed(args, ["--base"]);
  const answer = answerOf(context, positional[0], "round");
  const at = declared(await here(context));
  const base = await baseHere(context, at, options.get("--base"));
  const standing = await standingHere(at, base);
  const step = owes(stepOwed(standing), "round", "round");
  try {
    const asks = await recordRound(placeOf(at), standing, step, answer);
    return { recorded: "round", round: step.round, commit: await worktreeHead(at.worktree), asks };
  } catch (error) {
    if (!(error instanceof ChainStop)) throw error;
    throw new Refusal(stoppedSays("round", step.round, error.message));
  }
}

async function fixPass(context: CommandContext, args: readonly string[]): Promise<object> {
  const { options } = parsed(args, ["--by"]);
  const by = options.get("--by");
  if (by === undefined || (by !== THE_SESSION && !isSessionId(by))) throw new Refusal(`\`fix-pass\` takes \`--by\` with the id of the subagent that made the pass, one word that holds no comma, or \`${THE_SESSION}\` where the session fixed it itself.`);
  const at = declared(await here(context));
  const base = await baseHere(context, at, undefined);
  const standing = await standingHere(at, base);
  const step = owes(stepOwed(standing), "fix-pass", "fix-pass");
  try {
    const place = placeOf(at);
    const { committed } = await fixPassStage(place, standing, step);
    const { open } = await recordFixPass(place, standing, step, { committed, answer: "", builtBy: by });
    return { recorded: "fix-pass", round: step.round, commit: await worktreeHead(at.worktree), open };
  } catch (error) {
    if (!(error instanceof ChainStop)) throw error;
    throw new Refusal(stoppedSays("fix-pass", step.round, error.message));
  }
}

/**
 * Runs the repository's broad gate at the head, with no terminal, as the
 * daemon's chain starts it (`gate.ts#startGate`), with the pane's
 * environment less what says a terminal stands, and reads its exit. It
 * first takes a turn on the machine in the place of a broad gate
 * (`inTurn`), and reads the records and the head it runs at once the turn
 * has come, so a wait does not run a gate the records no longer owe; the
 * turn ends when the command does, and the command tells the daemon how it
 * ended. Where the daemon reads the run as over the machine's load and the
 * command ended with a code or a signal, the gate runs once more, alone, as
 * the daemon's chain does (`daemon.ts#runGate`). A pass commits one run
 * block, below the sentence of the earlier run where there was one. Every
 * other end is refused with what the last run printed after the sentence,
 * which names both runs where there were two, and commits nothing.
 */
async function gate(context: CommandContext, args: readonly string[]): Promise<object> {
  parsed(args, []);
  const at = declared(await here(context));
  const base = await baseHere(context, at, undefined);
  const standing = await standingHere(at, base);
  const step = owes(stepOwed(standing), "gate", "gate");
  const place = placeOf(at);
  const first = await gateRun(context, at.worktree, place, standing, base, false);
  let passed = first;
  let earlier: string | null = null;
  if (first.failure !== null) {
    if (first.again === null) throw new Refusal(`${stoppedSays("gate", step.round, first.failure)}\n${first.output}`);
    earlier = first.again;
    const second = await gateRun(context, at.worktree, place, standing, base, true);
    if (second.failure !== null) throw new Refusal(`${stoppedSays("gate", step.round, twiceFailedWhy(first.failure, second.failure))}\n${second.output}`);
    passed = second;
  }
  try {
    await recordGate(place, { head: passed.run.head, base: passed.run.base, earlier });
  } catch (error) {
    if (!(error instanceof ChainStop)) throw error;
    throw new Refusal(stoppedSays("gate", step.round, error.message));
  }
  return { recorded: "gate", round: step.round, commit: passed.run.head };
}

/**
 * One run of the broad gate in its turn on the machine, alone where it is
 * the second: why it failed, or null where it passed, with what it printed,
 * and, where a first run's command ended with a code or a signal while the
 * daemon read the machine as over its load, the sentence of that earlier
 * run, so it runs once more. A run with no daemon to ask runs once.
 */
async function gateRun(context: CommandContext, worktree: string, place: Place, standing: Standing, base: ChainBase, alone: boolean): Promise<{ run: { command: string; head: string; base: string }; failure: string | null; output: string; again: string | null }> {
  const turn = await inTurn(context, { folder: worktree, name: BROAD_GATE_NAME, place: "gate", alone });
  let run: { command: string; head: string; base: string };
  let end: Awaited<ReturnType<typeof startGate>["ended"]>;
  let late = false;
  let ran: Ran | null = null;
  let told = false;
  try {
    try {
      run = await gateOwed(place, standing, base);
    } catch (error) {
      throw new Refusal(gateNotRunSays(error instanceof Error ? error.message : String(error)));
    }
    const started = startGate({ command: run.command, cwd: worktree, env: gateEnvironment(context.env as NodeJS.ProcessEnv, null) });
    const memory = watchMemory(started.pid);
    const limit = setTimeout(() => {
      late = true;
      void started.stop();
    }, context.gateLimitMs ?? GATE_LIMIT_MS);
    end = await started.ended;
    clearTimeout(limit);
    told = true;
    ran = await turn.end({ exitCode: end.exitCode, peakMemory: memory.stop() });
  } finally {
    if (!told) await turn.end();
  }
  const failure = late ? "the command reached its time limit and was stopped" : end.error !== null ? `the command did not start: ${end.error}` : end.signal !== null ? `the signal ${end.signal} ended the command` : end.exitCode !== 0 ? `the command exited with code ${String(end.exitCode)}` : null;
  const ended = !alone && ran?.over === true ? endedWith(end, late) : null;
  const again = ended === null || ran === null ? null : earlierRunSays({ commit: run.head, ended, load: turn.load, cores: ran.cores, beside: ran.beside });
  return { run, failure, output: end.output, again };
}

async function seal(context: CommandContext, args: readonly string[]): Promise<object> {
  const { positional, options } = parsed(args, ["--judged-by", "--model"]);
  const answer = answerOf(context, positional[0], "seal");
  const judgedBy = options.get("--judged-by");
  const model = options.get("--model");
  if (judgedBy === undefined || model === undefined) throw new Refusal(`\`seal\` takes \`--judged-by\` with the id of the sealer's subagent and \`--model\` with the model that judged.\n${USAGE}`);
  if (context.version === undefined) throw new Refusal("This build of the chain command holds no version of Owlery, and a verdict names the version of the rules it was judged under.");
  const at = declared(await here(context));
  const base = await baseHere(context, at, undefined);
  const standing = await standingHere(at, base);
  const step = owes(stepOwed(standing), "seal", "seal");
  try {
    const place = placeOf(at);
    const { target } = await sealStage(place, standing, step, base);
    const verdict = await recordVerdict(place, standing, step, base, { answer, target, judgedBy, model, version: context.version });
    return { recorded: "seal", run: step.run, verdict: verdict.is, says: verdict.says, commit: step.commit };
  } catch (error) {
    if (!(error instanceof ChainStop)) throw error;
    throw new Refusal(stoppedSays("seal", step.round, error.message));
  }
}

/**
 * Writes the two sections of a pull request's body the records give at the
 * head, the seal section and the back's, each between its marker lines
 * (`github.ts#sealSection`, `#backSection`), into a file of the run folder,
 * and gives the file's path, for the session to hand to `gh`. The back is
 * composed with no entry of the ledger, since no stage of a pane's chain
 * runs in the daemon, so it says that the stages ran outside the daemon.
 */
async function body(context: CommandContext, args: readonly string[]): Promise<object> {
  parsed(args, []);
  const at = declared(await here(context));
  let records: Awaited<ReturnType<typeof bodyRecords>>;
  try {
    records = await bodyRecords(at.worktree, at.head, relative(at.worktree, at.directory));
  } catch (error) {
    throw new Refusal(`${(error instanceof Error ? error.message : String(error)).replace(/\.+$/u, "")}, so the body has no seal to carry.`);
  }
  const back = composeBack(await sealRecords(at.worktree, at.directory, at.head, null), [], 0);
  const file = join(stageFolder(context, basename(at.directory)), "pull-request-body.md");
  writeWholeFile(file, `${sealSection(records)}\n\n${backSection(back, records.directory)}\n`);
  return { body: file, head: at.head };
}

/** The text of each question an `AskUserQuestion` call asks, from the JSON a `PreToolUse` hook's command is handed on its input, or null where the input is no such event: no JSON object, one whose `tool_input.questions` is no list, or a list with an entry that holds no text under `question`. */
function questionsAsked(input: string): string[] | null {
  let event: unknown;
  try {
    event = JSON.parse(input);
  } catch {
    return null;
  }
  const questions = (event as { tool_input?: { questions?: unknown } } | null)?.tool_input?.questions;
  if (!Array.isArray(questions)) return null;
  const texts = questions.map((entry) => (entry as { question?: unknown } | null)?.question);
  return texts.every((text): text is string => typeof text === "string") ? texts : null;
}

/**
 * Answers the bundle's hook on an `AskUserQuestion` call, by its exit code
 * as Claude Code reads a hook's command: 0 lets the call through, and 2
 * refuses it and hands the session what the command wrote to its error
 * output. It refuses where the `routing.md` of the one directory that names
 * the worktree's branch answers `Automation` `yes`, unless a question of the
 * call opens with `NO_DEFAULT` and a reason. It lets every other call
 * through: outside a worktree, where HEAD names no branch, where no
 * directory or more than one names the branch, and where the routing holds
 * no such row or another answer. An input it cannot read as the call's event
 * is named as not read, with exit code 1, which refuses nothing. It does not
 * judge whether a question is the person's to answer: the form makes the
 * session write why no default can be taken.
 */
async function ask(context: CommandContext, args: readonly string[]): Promise<CommandEnd> {
  parsed(args, []);
  const through: CommandEnd = { code: 0, out: "", err: "" };
  const worktree = await gitSays(context.cwd, ["rev-parse", "--show-toplevel"]);
  if (worktree === null || worktree === "") return through;
  const branch = await gitSays(worktree, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (branch === null || branch === "") return through;
  const directories = workItemDirectories(worktree, branch);
  const [directory] = directories;
  if (directory === undefined || directories.length > 1) return through;
  if (routingAnswer(repositoryFileText(join(directory, ROUTING_FILE)) ?? "", "Automation") !== "yes") return through;
  const questions = questionsAsked(context.input === undefined ? "" : await context.input());
  if (questions === null) return { code: 1, out: "", err: "The input of `ask` is not the event of an `AskUserQuestion` call, a JSON object whose `tool_input.questions` holds each question's text, so `ask` decides nothing on it.\n" };
  if (questions.some((question) => question.startsWith(NO_DEFAULT) && question.slice(NO_DEFAULT.length).trim() !== "")) return through;
  const inside = relative(worktree, directory);
  return {
    code: 2,
    out: "",
    err: `${inside}/${ROUTING_FILE} answers \`Automation\` \`yes\`, so this run does not stop for a question. Go on with the question's default, and write the question with that default as a row of ${inside}/frame/questions.md. Where no default can be taken, ask again with the question opening \`${NO_DEFAULT}\` and the reason after those words.\n`,
  };
}

/** The exit code of a refusal of the runner's, which runs no command: a run with no name, words not after `--`, a folder in no worktree, and a name the repository does not hold. 64 is the code of a usage error, so it is told apart from a command's own failure. */
export const RUN_REFUSED = 64;

/** What the runner and `gate` say while a command waits for its turn on the machine. */
export function waitingSays(name: string, ahead: number): string {
  return `${name} waits for the machine (${String(ahead)} ahead).`;
}

/** What the runner and `gate` say where no daemon answers the ask for a turn. */
export function noDaemonSays(name: string): string {
  return `No daemon of Owlery answered, so ${name} runs now without waiting its turn on the machine.`;
}

/** What the runner and `gate` say where the daemon ended while the command waited for its turn. */
export function daemonEndedSays(name: string): string {
  return `Owlery's daemon ended while ${name} waited, so it runs now without waiting its turn on the machine.`;
}

/** The daemon's turn socket in the run folder the environment names: in `OWLERY_RUN_DIR`, or by the launcher of the runner in `OWLERY_RUN` or of the chain command in `OWLERY_CHAIN`. Null where it names none. */
function turnSocket(context: CommandContext): string | null {
  const launcher = context.env.OWLERY_RUN || context.env.OWLERY_CHAIN || "";
  const run = context.env.OWLERY_RUN_DIR || (launcher === "" ? "" : dirname(launcher));
  return run === "" ? null : join(run, TURN_SOCKET);
}

/**
 * Takes a turn on the machine for a command, saying how many go before it
 * each time the daemon says so, and gives what ends the turn. Where no
 * daemon answers, and where the daemon ends before the turn comes, it says
 * so in one sentence and gives a turn of nothing: the command runs at once.
 */
async function inTurn(context: CommandContext, request: TurnRequest): Promise<{ load: number | null; end: (run?: RunEnd) => Promise<Ran | null> }> {
  const taken = await takeTurn(turnSocket(context), request, (ahead) => context.say(waitingSays(request.name, ahead)));
  if (taken.held) return taken;
  context.say(taken.why === "no daemon" ? noDaemonSays(request.name) : daemonEndedSays(request.name));
  return { load: null, end: () => Promise.resolve(null) };
}

/**
 * The place a command of the worktree waits in, as its committed records
 * give it: `review` where the one directory that names the branch holds a
 * review round's record at HEAD, `build` where it holds none, and
 * `outside` where HEAD names no branch, or no directory or more than one
 * names it.
 */
async function turnPlace(worktree: string): Promise<TurnPlace> {
  const branch = await gitSays(worktree, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (branch === null || branch === "") return "outside";
  const directories = workItemDirectories(worktree, branch);
  const [directory] = directories;
  if (directory === undefined || directories.length > 1) return "outside";
  const rounds = await gitSays(worktree, ["ls-tree", "--name-only", "HEAD", "--", `${relative(worktree, directory)}/trail/rounds/`]);
  return (rounds ?? "").split("\n").some((path) => roundNumber(basename(path)) !== null) ? "review" : "build";
}

/** Runs a command line with `/bin/sh -c` in the folder, with this process's input and output, and gives its exit code, 128 and the signal's number where a signal ended it, and 127 where it did not start, with the peak memory of its process and its descendants (`heavy-runs.ts#watchMemory`). */
function runLine(command: string, cwd: string, env: NodeJS.ProcessEnv, memoryRead?: (bytes: number) => void): Promise<{ code: number; peakMemory: number | null }> {
  return new Promise((done) => {
    const child = spawn("/bin/sh", ["-c", command], { cwd, env, stdio: "inherit" });
    const memory = watchMemory(child.pid, undefined, memoryRead);
    child.once("error", () => done({ code: 127, peakMemory: memory.stop() }));
    child.once("close", (code, signal) => done({ code: code ?? 128 + (signal === null ? 0 : constants.signals[signal]), peakMemory: memory.stop() }));
  });
}

/**
 * The runner of heavy commands: `run <name> [-- <words>]`. It looks the name
 * up in the worktree's `Heavy commands` (`records-place.ts#readHeavyCommands`),
 * takes a turn on the machine in the place the worktree's committed records
 * give (`turnPlace`), and runs the command line at the worktree's top, with
 * each word after `--` added as one word, with the session's own input and
 * output. It exits with the command's exit code, and with `RUN_REFUSED` and a
 * sentence, running nothing, for a run it refuses.
 */
async function run(context: CommandContext, args: readonly string[]): Promise<CommandEnd> {
  const refused = (why: string): CommandEnd => ({ code: RUN_REFUSED, out: "", err: `${why.replace(/\n+$/u, "")}\n` });
  const [name = "", next, ...words] = args;
  if (name === "") return refused(`\`run\` takes the name of a heavy command the repository names.\n${USAGE}`);
  if (next !== undefined && next !== "--") return refused(`\`run\` takes the words it adds to the command after \`--\`.\n${USAGE}`);
  const worktree = await gitSays(context.cwd, ["rev-parse", "--show-toplevel"]);
  if (worktree === null || worktree === "") return refused(`${context.cwd} is in no worktree of a repository, and a heavy command runs at the top of the worktree whose records name it.`);
  const commands = readHeavyCommands(worktree);
  const line = commands[name];
  const names = Object.keys(commands);
  if (line === undefined) return refused(`The repository names no heavy command "${name}" under "Heavy commands" of ${rootOf(worktree) ?? "seal"}/config.json. It names ${names.length === 0 ? "none" : listed(names)}.`);
  const turn = await inTurn(context, { folder: worktree, name, place: await turnPlace(worktree), alone: false });
  // The launcher sets ELECTRON_RUN_AS_NODE for the Node it runs this script with (`pane-chain.ts`). The command runs in the session's environment, which a pane gives without it (`pty.ts#terminalEnv`), so an Electron program it starts runs as Electron.
  const env: NodeJS.ProcessEnv = { ...context.env };
  delete env.ELECTRON_RUN_AS_NODE;
  let ran: { code: number; peakMemory: number | null } | undefined;
  try {
    ran = await runLine([line, ...words.map(shellQuote)].join(" "), worktree, env, context.memoryRead);
    return { code: ran.code, out: "", err: "" };
  } finally {
    await turn.end(ran === undefined ? undefined : { exitCode: ran.code, peakMemory: ran.peakMemory });
  }
}

const RUNS: Record<Exclude<(typeof SUBCOMMANDS)[number], "ask" | "run">, (context: CommandContext, args: readonly string[]) => Promise<object>> = { owed, start, round, "fix-pass": fixPass, gate, seal, body };

/** The subcommands that end in their own way, each as its own comment says. */
const OWN_ENDS: Record<"ask" | "run", (context: CommandContext, args: readonly string[]) => Promise<CommandEnd>> = { ask, run };

/**
 * Runs one subcommand. Each but `ask` and `run` answers with exit code 0 and
 * one JSON object on the first line of its output, or with exit code 1 and
 * a sentence on its error output: a refusal's, or, for what a reader or git
 * threw, the chain's sentence of a stop. `ask` and `run` answer as their own
 * comments say. A line said while the run goes on reaches the error output
 * at once, through `CommandContext.say`.
 */
export async function chainCommand(args: readonly string[], context: CommandContext): Promise<CommandEnd> {
  const [name = "", ...rest] = args;
  const printed = (subcommand: (typeof RUNS)[keyof typeof RUNS]) => async (context: CommandContext, args: readonly string[]): Promise<CommandEnd> => ({ code: 0, out: `${JSON.stringify(await subcommand(context, args))}\n`, err: "" });
  const subcommand = name === "ask" || name === "run" ? OWN_ENDS[name] : (SUBCOMMANDS as readonly string[]).includes(name) ? printed(RUNS[name as keyof typeof RUNS]) : undefined;
  if (subcommand === undefined) return { code: 1, out: "", err: `${name === "" ? "The chain command takes a subcommand." : `The chain command has no subcommand ${name}.`}\n${USAGE}` };
  try {
    return await subcommand(context, rest);
  } catch (error) {
    if (error instanceof Refusal) return { code: 1, out: "", err: `${error.message.replace(/\n+$/u, "")}\n` };
    return { code: 1, out: "", err: `${chainStoppedSays(error instanceof Error ? error.message : String(error))}\n` };
  }
}
