// What the cases of a work item's chain share: a daemon on a temporary
// repository with the records root, a client, the round records a fake
// proofer answers with, the fix a fake crafter makes, the blocks a fake
// orchestrator answers with and the section a fake sealer answers with. No case starts an agent: every stage runs on
// the fake adapter. The repository's broad gate is a stand-in command the
// case names, `true` where it names none, and it runs with the suite's own
// `PATH`, so no case runs a repository's check or asks a login shell. The
// repository's remote is a bare repository in the case's temporary folder,
// and `gh` is a stand-in the case writes, so no case reaches GitHub.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import WebSocket from "ws";
import type { RoleAdapter } from "../src/daemon/adapters/adapter";
import { type FakeAdapterOptions, fakeAdapter } from "../src/daemon/adapters/fake";
import { Daemon, type DaemonOptions } from "../src/daemon/daemon";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { MARKER } from "../src/daemon/records-place";
import { createWorktree } from "../src/daemon/worktrees";
import type { Chain, ClientMessage, RoleStage, ServerMessage, WorkItem } from "../src/shared/protocol";
import { git, temporaryRepository } from "./repositories";

/** The token the cases' daemons take. */
export const TOKEN = "t".repeat(64);

/** The daemon's clock in the cases: a directory the daemon makes is named `1795388700-<slug>`. */
export const NOW = 1_795_388_700_000;

/** The day of the daemon's clock in the cases, as the machine's own time zone has it, which a routing the daemon writes is answered on. */
export const TODAY = ((at: Date): string => `${String(at.getFullYear())}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`)(new Date(NOW));

/** The version the cases' daemons are given, which a verdict block's `rules:` line names. */
export const VERSION = "0.0.2";

/** How long a case waits for a chain to come to a state: a chain is some tens of git commands, and the suite runs beside others. */
const WAIT_MS = 20_000;

export type Cleanups = (() => Promise<void> | void)[];

/** A client that keeps every message it receives. */
export async function client(url: string, cleanups: Cleanups) {
  const socket = new WebSocket(url);
  const messages: ServerMessage[] = [];
  socket.on("message", (raw) => messages.push(JSON.parse(String(raw)) as ServerMessage));
  await new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
  socket.send(JSON.stringify({ type: "hello", token: TOKEN }));
  cleanups.push(() => socket.close());
  const until = async <T>(find: () => T | undefined, ms = WAIT_MS): Promise<T> => {
    const end = Date.now() + ms;
    for (;;) {
      const found = find();
      if (found !== undefined) return found;
      if (Date.now() > end) throw new Error(`timed out; got ${JSON.stringify(messages.filter((m) => m.type !== "headless")).slice(-3000)}`);
      await new Promise((r) => setTimeout(r, 20));
    }
  };
  /** The work item as the newest `inbox` or `ready` lists it. */
  const workItem = (id: number): WorkItem | undefined => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.type === "inbox" || message?.type === "ready") return [...message.workItems, ...message.archived].find((item) => item.id === id);
    }
    return undefined;
  };
  return {
    socket,
    messages,
    send: (message: object) => socket.send(JSON.stringify(message)),
    until,
    workItem,
    message: <K extends ServerMessage["type"]>(type: K, where: (m: Extract<ServerMessage, { type: K }>) => boolean = () => true) =>
      until(() => messages.find((m): m is Extract<ServerMessage, { type: K }> => m.type === type && where(m as Extract<ServerMessage, { type: K }>))),
    /** The work item's chain once it is in the state, as the newest lists carry it. */
    chain: (id: number, state: Chain["state"]) =>
      until(() => {
        const chain = workItem(id)?.chain;
        return chain?.state === state ? chain : undefined;
      }),
    /** The first message that answers a request: the one the daemon sends with the request's id. */
    asked: async (message: Extract<ClientMessage, { requestId: number }>): Promise<Extract<ServerMessage, { requestId: number }>> => {
      socket.send(JSON.stringify(message));
      return until(() => messages.find((m): m is Extract<ServerMessage, { requestId: number }> => "requestId" in m && m.requestId === message.requestId));
    },
    /** The answer to a `getSeal` of the work item: `done`, or the error's sentence. */
    getSeal: async (id: number, requestId: number): Promise<string> => {
      socket.send(JSON.stringify({ type: "getSeal", requestId, workItemId: id }));
      const answer = await until(() => messages.find((m) => (m.type === "done" || m.type === "error") && m.requestId === requestId));
      return answer.type === "error" ? answer.message : "done";
    },
  };
}

/**
 * Puts a `git` before the real one on the path the daemon runs git from: a
 * command `when` holds for, a test of the shell over git's arguments, waits
 * until `release`, and every other runs at once. The case's own git goes
 * through it too, until `release`. `waiting` says whether a held command has
 * arrived.
 */
export function heldGit(cleanups: Cleanups, base: string, when: string): { release: () => void; waiting: () => boolean } {
  const bin = join(base, `held-bin-${String(cleanups.length)}`);
  const released = join(bin, "released");
  const arrived = join(bin, "arrived");
  const path = process.env.PATH ?? "";
  mkdirSync(bin);
  // A held command also ends its wait once this script is gone, with the temporary folder of a case that failed before its release.
  writeFileSync(join(bin, "git"), `#!/bin/sh\nif ${when}; then touch '${arrived}'; while [ ! -e '${released}' ] && [ -e "$0" ]; do sleep 0.02; done; fi\nPATH='${path}' exec git "$@"\n`, { mode: 0o755 });
  process.env.PATH = `${bin}:${path}`;
  const release = (): void => {
    writeFileSync(released, "");
    process.env.PATH = path;
  };
  cleanups.push(release);
  return { release, waiting: () => existsSync(arrived) };
}

/** What the stand-in for `gh` answers one kind of call with: what it prints on each stream and its exit code, or that it never exits, and with `stubborn` that it also ignores the signal to end. */
export interface GhAnswer {
  out?: string;
  err?: string;
  exit?: number;
  hangs?: boolean;
  stubborn?: boolean;
}

/** The four calls Owlery makes of `gh`, each a `pr` subcommand. */
export const GH_CALLS = ["list", "create", "edit", "view"] as const;

/** A stand-in for the person's `gh`, as `ghStandIn` makes one. */
export interface GhStandIn {
  /** The command a daemon's `gh` option names. */
  gh: [string];
  /** Each call's arguments, in the order the calls came. It throws where a call was none of `pr list`, `pr create`, `pr edit` and `pr view`. */
  calls: () => string[][];
  /** The text of the file each call's `--body-file` named, read when the call came, and null for a call that named none. */
  bodies: () => (string | null)[];
  /** The values of `GH_PROMPT_DISABLED` and `NO_COLOR` each call ran with, joined by a space. */
  environments: () => string[];
  /** Has every later call of the kind answer so. */
  answer: (call: (typeof GH_CALLS)[number], answer: GhAnswer) => void;
}

/** The address the stand-in for `gh` gives the pull request it opens or views where the case set no answer. */
export const PULL_REQUEST_URL = "https://github.com/owner/project/pull/1";

/**
 * A stand-in for the person's `gh`, in a folder under `base`: a shell script
 * that notes each call's arguments and the text of the file its
 * `--body-file` names, and answers from the files `answer` writes. Where the
 * case set no answer, `pr list` lists no pull request, `pr create` and `pr
 * edit` print the address `PULL_REQUEST_URL`, and `pr view` answers that
 * pull request open, with the worktree's head as its head and no check. A
 * call that is none of the four is answered with exit 97 and noted, and the
 * case's cleanup then fails: Owlery writes no review and merges nothing.
 */
export function ghStandIn(cleanups: Cleanups, base: string): GhStandIn {
  const folder = join(base, `gh-${String(cleanups.length)}`);
  mkdirSync(folder);
  const script = join(folder, "gh");
  const view = `{"number":1,"url":"${PULL_REQUEST_URL}","state":"OPEN","isDraft":false,"headRefOid":"%s","mergedAt":null,"statusCheckRollup":[]}`;
  writeFileSync(
    script,
    [
      "#!/bin/sh",
      `d='${folder}'`,
      'n=$(($(cat "$d/count" 2>/dev/null || echo 0) + 1))',
      'echo "$n" > "$d/count"',
      'printf \'%s\\n\' "$@" > "$d/call-$n"',
      'printf \'%s %s\' "$GH_PROMPT_DISABLED" "$NO_COLOR" > "$d/env-$n"',
      'prev=""',
      'for arg in "$@"; do if [ "$prev" = "--body-file" ]; then cat "$arg" > "$d/body-$n"; fi; prev=$arg; done',
      'case "$1 $2" in "pr list"|"pr create"|"pr edit"|"pr view") ;; *) exit 97 ;; esac',
      'a="$d/answer-$2"',
      'if [ -e "$a.stubborn" ]; then trap "" TERM; exec sleep 30; fi',
      'if [ -e "$a.hangs" ]; then exec sleep 30; fi',
      'if [ -e "$a.err" ]; then cat "$a.err" >&2; fi',
      'if [ -e "$a.out" ]; then cat "$a.out"',
      'elif [ "$2" = list ]; then echo "[]"',
      `elif [ "$2" = view ]; then printf '${view}\\n' "$(git rev-parse HEAD)"`,
      `else echo '${PULL_REQUEST_URL}'`,
      "fi",
      'exit "$(cat "$a.exit" 2>/dev/null || echo 0)"',
      "",
    ].join("\n"),
    { mode: 0o755 },
  );
  const count = (): number => (existsSync(join(folder, "count")) ? Number(readFileSync(join(folder, "count"), "utf8").trim()) : 0);
  const noted = (): string[][] => Array.from({ length: count() }, (_, index) => readFileSync(join(folder, `call-${String(index + 1)}`), "utf8").replace(/\n$/u, "").split("\n"));
  const calls = (): string[][] => {
    const all = noted();
    const other = all.find(([pr, call]) => pr !== "pr" || !(GH_CALLS as readonly string[]).includes(call ?? ""));
    if (other !== undefined) throw new Error(`gh was called with ${other.join(" ")}, which is none of pr list, pr create, pr edit and pr view`);
    return all;
  };
  cleanups.push(() => void calls());
  return {
    gh: [script],
    calls,
    environments: () => Array.from({ length: count() }, (_, index) => readFileSync(join(folder, `env-${String(index + 1)}`), "utf8")),
    bodies: () => Array.from({ length: count() }, (_, index) => (existsSync(join(folder, `body-${String(index + 1)}`)) ? readFileSync(join(folder, `body-${String(index + 1)}`), "utf8") : null)),
    answer: (call, answer) => {
      const at = join(folder, `answer-${call}`);
      for (const end of ["out", "err", "exit", "hangs", "stubborn"]) rmSync(`${at}.${end}`, { force: true });
      if (answer.out !== undefined) writeFileSync(`${at}.out`, answer.out);
      if (answer.err !== undefined) writeFileSync(`${at}.err`, answer.err);
      if (answer.exit !== undefined) writeFileSync(`${at}.exit`, String(answer.exit));
      if (answer.hangs === true) writeFileSync(`${at}.hangs`, "");
      if (answer.stubborn === true) writeFileSync(`${at}.stubborn`, "");
    },
  };
}

/** Makes a bare repository in the folder `base` and adds it to the repository as the remote of the name given, `origin` where none is. Gives the bare repository's folder. */
export function bareRemote(base: string, repo: string, name = "origin"): string {
  const bare = join(base, `${name}.git`);
  git(base, "init", "--quiet", "--bare", bare);
  git(repo, "remote", "add", name, bare);
  return bare;
}

/** Writes a file in a folder, with the folders above it. */
export function write(folder: string, path: string, text: string): void {
  mkdirSync(dirname(join(folder, path)), { recursive: true });
  writeFileSync(join(folder, path), text);
}

/** Commits everything in the folder, and gives the commit. */
export function commitAll(folder: string, subject: string): string {
  git(folder, "add", "--all");
  git(folder, "commit", "--quiet", "-m", subject);
  return git(folder, "rev-parse", "HEAD").trim();
}

/** The commits of the folder's branch after `main`, the oldest first: each one's subject, the rest of its message, and the paths it changed. */
export function commitsAfterMain(folder: string): { subject: string; body: string; paths: string[] }[] {
  return git(folder, "log", "--reverse", "--format=%H", "main..HEAD")
    .split("\n")
    .filter((hash) => hash !== "")
    .map((hash) => ({
      subject: git(folder, "log", "-1", "--format=%s", hash).trim(),
      body: git(folder, "log", "-1", "--format=%b", hash).trim(),
      paths: git(folder, "show", "--name-only", "--format=", hash).trim().split("\n"),
    }));
}

export const head = (folder: string): string => git(folder, "rev-parse", "HEAD").trim();

/** What git says of the folder's changes, a line for each path. */
export const status = (folder: string): string[] => git(folder, "status", "--porcelain", "--untracked-files=all").split("\n").filter((line) => line !== "").sort();

/**
 * A daemon on a temporary repository whose `main` holds the records root,
 * with one work item for each title, numbered from 1: its worktree is cut
 * from `main`, and its branch holds one commit after it, which adds
 * `feature.txt`. The work items stand in the run folder before the daemon
 * starts, so no pane is started for them. With `root: false` the repository
 * holds no records root. `gate` is the broad gate command its `config.json`
 * names, `true` where none is given, and null for a `config.json` with no
 * such key. Once the work items stand, the repository gets a bare
 * repository as its remote `origin`, and the daemon is given a stand-in for
 * `gh` (`ghStandIn`), so a chain that ends sealed pushes there and opens its
 * pull request at the stand-in.
 */
export async function standing(cleanups: Cleanups, titles: string[], options: Partial<DaemonOptions> & { root?: boolean; gate?: string | null } = {}) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const { root = true, gate = "true", ...daemonOptions } = options;
  if (root) {
    write(made.repo, "seal/README.md", `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
    write(made.repo, "seal/config.json", `${JSON.stringify({ "Commit and pull request language": "English", "Record language": "English", ...(gate === null ? {} : { "Broad gate": gate }) }, null, 2)}\n`);
    commitAll(made.repo, "chore: add the place for work records");
  }
  const runDir = join(made.base, "run");
  mkdirSync(runDir);
  const workItems = [];
  for (const [index, title] of titles.entries()) {
    const place = await createWorktree({ folder: made.repo, title, root: made.root });
    write(place.worktree, "feature.txt", "A greeting\n");
    commitAll(place.worktree, "feat: greet");
    workItems.push({ id: index + 1, title, createdAt: 1, ...place });
  }
  writeFileSync(join(runDir, "work-items.json"), JSON.stringify(workItems));
  const remote = bareRemote(made.base, made.repo);
  const gh = ghStandIn(cleanups, made.base);
  const start = async (more: Partial<DaemonOptions> = {}) => {
    const d = new Daemon({
      token: TOKEN,
      paneKinds: PANE_KINDS,
      roleAdapter: fakeAdapter(),
      commandFor: () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }),
      runDir,
      worktreesRoot: made.root,
      now: () => NOW,
      gateEnv: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
      version: VERSION,
      gh: gh.gh,
      ...daemonOptions,
      ...more,
    });
    const port = await d.listen(0);
    cleanups.push(() => d.close());
    return { d, url: `ws://127.0.0.1:${port}` };
  };
  const { d, url } = await start();
  const c = await client(url, cleanups);
  await c.message("ready");
  return { made, runDir, d, url, c, workItems, start, remote, gh };
}

// ---------------------------------------------------------------------------
// What the fake roles answer with.

/** What a round's prompt gave: the round, the record's heading and its target line's value. */
export function givenRound(prompt: string): { round: number; heading: string; target: string } {
  const [, heading = ""] = /^- Your record's heading: `(.*)`$/mu.exec(prompt) ?? [];
  const [, target = ""] = /^- Your record's target line: `target: (.*)`$/mu.exec(prompt) ?? [];
  return { round: Number(/^# Review round (\d+): /u.exec(heading)?.[1] ?? "0"), heading, target };
}

/** What a fix pass's prompt gave: the round record's path from the worktree's top, and the numbers of its open findings. */
export function givenFix(prompt: string): { record: string; open: number[] } {
  const [, record = ""] = /^- The round record: `(.*)`$/mu.exec(prompt) ?? [];
  const [, open = ""] = /^- Its open findings: (.*)$/mu.exec(prompt) ?? [];
  return { record, open: [...open.matchAll(/\d+/gu)].map(([digits]) => Number(digits)) };
}

/** What a seal's prompt gave: the run, the section's heading and the verdict's target line's value. */
export function givenSeal(prompt: string): { run: number; heading: string; target: string } {
  const [, heading = ""] = /^- Your section's heading: `(.*)`$/mu.exec(prompt) ?? [];
  const [, target = ""] = /^- Your verdict's target line: `target: (.*)`$/mu.exec(prompt) ?? [];
  return { run: Number(/^## Run (\d+)$/u.exec(heading)?.[1] ?? "0"), heading, target };
}

/** The line a finding's section ends with before its close block. */
const why = (finding: number): string => `Why it matters: finding ${String(finding)} leaves a sentence with no end.`;

/** One finding's section of a round record, with no close block. */
export function findingSection(finding: number): string {
  return [`### ${String(finding)}. The greeting of line ${String(finding)} misses its full stop`, "", "```seal", "severity: must", `location: \`feature.txt:${String(finding)}\``, `evidence: read \`feature.txt:${String(finding)}\``, "```", "", why(finding), ""].join("\n");
}

/** A round record as `role-bundle/templates/records/sdd-round.md` shapes it: the heading, the round block, the findings numbered as given, and one `confirms:` block for each reference. */
export function roundRecord(heading: string, target: string, findings: number[] = [], confirms: string[] = []): string {
  return [
    heading,
    "",
    "```seal",
    `target: ${target}`,
    "```",
    "",
    "## Findings",
    "",
    ...findings.map(findingSection),
    ...(confirms.length === 0 ? [] : ["## Confirmations", "", ...confirms.flatMap((reference) => ["```seal", `confirms: ${reference}`, "```", "What holds: the full stop stands at `feature.txt:1`, read.", ""])]),
  ].join("\n");
}

/** The answer of the proofer that finds nothing: a round record with no finding. */
export function clean(given: { heading: string; target: string }): string {
  return roundRecord(given.heading, given.target);
}

/** A gate record as the daemon writes one: the heading, then one run block for each run, the oldest first, each as its head and the base's commit. */
export function gateRecord(workItem: string, runs: readonly (readonly [head: string, base: string])[]): string {
  return [`# Broad gate: ${workItem}\n`, ...runs.map(([at, base]) => ["```seal", `run: ${at} against ${base}`, "```", ""].join("\n"))].join("\n");
}

/** A run's section of a guarantee as `role-bundle/templates/records/sdd-guarantee.md` shapes it: the heading, the two tables, and one verdict block of the target line and the verdict, `sealed` where none is given. */
export function sealSection(given: { heading: string; target: string }, verdict = "sealed"): string {
  return [
    given.heading,
    "",
    "### Claims checked by reading",
    "",
    "| Claim | Source | Read at | Result |",
    "|---|---|---|---|",
    "| The greeting ends with a full stop | `trail/rounds/round-1.md:9` | `feature.txt:1` | holds |",
    "",
    "### The parties",
    "",
    "| Party | Says | Agrees with | Disagrees with |",
    "|---|---|---|---|",
    "| the build | The branch adds a greeting | the last round | none |",
    "",
    "```seal",
    `target: ${given.target}`,
    `Verdict: ${verdict}`,
    "```",
    "",
  ].join("\n");
}

/** A run's section with the daemon's lines in its verdict block, before the closing fence: who built the work, who judged it, the judging model and the rules. */
export function sealedBy(section: string, builtBy: string, judgedBy: string, model = "fake"): string {
  const closer = section.lastIndexOf("```\n");
  return `${section.slice(0, closer)}built-by: ${builtBy}\njudged-by: ${judgedBy}\nmodel: ${model}\nrules: owlery ${VERSION}\n${section.slice(closer)}`;
}

/** A guarantee as the daemon writes one: the heading, then each section given, each below one blank line. */
export function guaranteeRecord(workItem: string, sections: readonly string[]): string {
  return [`# Guarantee: ${workItem}\n`, ...sections].join("\n");
}

/** A close block as a fix pass appends one. */
export function closeBlock(verdict: string): string {
  return ["", "```seal", `verdict: ${verdict}`, "answer: The greeting ends with a full stop.", "```", ""].join("\n");
}

/** Appends a close block under a finding of the record at a path of the folder. */
export function closeFinding(folder: string, record: string, finding: number, verdict: string): void {
  const text = readFileSync(join(folder, record), "utf8");
  if (!text.includes(`${why(finding)}\n`)) throw new Error(`the record holds no finding ${String(finding)}`);
  writeFileSync(join(folder, record), text.replace(`${why(finding)}\n`, `${why(finding)}\n${closeBlock(verdict)}`));
}

/** Commits a fix of `feature.txt` in the folder, that file alone, and gives the commit. */
export function commitFix(folder: string): string {
  writeFileSync(join(folder, "feature.txt"), `${readFileSync(join(folder, "feature.txt"), "utf8").trimEnd()}.\n`);
  git(folder, "add", "feature.txt");
  git(folder, "commit", "--quiet", "-m", "fix: end the greeting");
  return git(folder, "rev-parse", "HEAD").trim();
}

/** The fix pass of a crafter that does its part: it commits a fix and closes each open finding `fixed` with that commit. */
export function fixes(cwd: string, prompt: string): void {
  const { record, open } = givenFix(prompt);
  const commit = commitFix(cwd);
  for (const finding of open) closeFinding(cwd, record, finding, `fixed ${commit}`);
}

/** What each fake role of a chain does: the proofer's answer for a round, the crafter's work in the worktree and its answer, and the orchestrator's answer. */
export interface Roles {
  /** The proofer's answer to a round's prompt. Absent, round 1 holds finding 1 and each later round confirms the findings of the round before it. */
  proofer?: (given: { round: number; heading: string; target: string }, prompt: string) => string;
  /** The crafter's work in the worktree. Absent, it commits a fix and closes each open finding. */
  crafter?: (cwd: string, prompt: string) => void | Promise<void>;
  /** The crafter's answer. Absent, it says that the pass is done. */
  crafterSays?: (prompt: string) => string;
  /** The orchestrator's answer to a judgment's prompt. Absent, the rounds are converging and each question is answered from the tree. */
  orchestrator?: (prompt: string) => string;
  /** The sealer's answer to a seal's prompt. Absent, it is its run's section with the verdict `sealed`. */
  sealer?: (given: { run: number; heading: string; target: string }, prompt: string) => string;
}

/** An `asks:` block as a stage's answer holds one. */
export function askBlock(ask: { asks: string; grounds: string; options?: [label: string, implies: string][]; default?: string }): string {
  return ["```seal", `asks: ${ask.asks}`, `grounds: ${ask.grounds}`, ...(ask.options ?? []).map(([label, implies]) => `option: \`${label}\`${implies === "" ? "" : ` ${implies}`}`), ...(ask.default === undefined ? [] : [`default: \`${ask.default}\``]), "```", ""].join("\n");
}

/** The orchestrator's judgment of convergence, as its answer holds one. */
export function convergenceBlock(converging: "yes" | "no", grounds = "Round 2 confirms the fix of round 1, and its one finding is new."): string {
  return ["```seal", `converging: ${converging}`, `grounds: ${grounds}`, "```", ""].join("\n");
}

/** The orchestrator's ruling on one question, as its answer holds one: a park where nothing was decided. */
export function rulingBlock(question: number, ruling: "default" | "scope" | "answered" | "park", decided: string | null, grounds: string): string {
  return ["```seal", `rules: ${String(question)} ${ruling}`, ...(decided === null ? [] : [`decided: ${decided}`]), `grounds: ${grounds}`, "```", ""].join("\n");
}

/** How many questions a judgment's prompt gives, and none for the judgment of convergence. */
export function givenQuestions(prompt: string): number {
  return [...prompt.matchAll(/^\d+\. /gmu)].length;
}

/** The answer of the orchestrator that sees the rounds converge and finds each question answered in the tree. */
export function judges(prompt: string): string {
  const questions = givenQuestions(prompt);
  if (questions === 0) return `I read the records.\n\n${convergenceBlock("yes")}`;
  return Array.from({ length: questions }, (_, index) => rulingBlock(index + 1, "answered", `The frame answers question ${String(index + 1)}.`, "Read in `frame/design.md`.")).join("\n");
}

/** The answer of the proofer that does its part: round 1 holds finding 1, and each later round confirms finding 1 of the round before it. */
export function proofs(given: { round: number; heading: string; target: string }): string {
  return given.round === 1 ? roundRecord(given.heading, given.target, [1]) : roundRecord(given.heading, given.target, [], [`round-${String(given.round - 1)}#1`]);
}

/** A fake adapter whose proofer, crafter, orchestrator and sealer act as the roles given, with every other option of the fake adapter. */
export function roles(given: Roles = {}, options: FakeAdapterOptions = {}): RoleAdapter {
  return fakeAdapter({
    pieces: (prompt, role) => {
      if (role?.role === "proofer") return [(given.proofer ?? proofs)(givenRound(prompt), prompt)];
      if (role?.role === "orchestrator") return [(given.orchestrator ?? judges)(prompt)];
      if (role?.role === "sealer") return [given.sealer?.(givenSeal(prompt), prompt) ?? sealSection(givenSeal(prompt))];
      return [given.crafterSays?.(prompt) ?? "The fix pass is done."];
    },
    work: (cwd, prompt, role) => (role?.role === "crafter" ? (given.crafter ?? fixes)(cwd, prompt) : undefined),
    ...options,
  });
}

/** An adapter that notes each start, each stop and each exit of the runs of another, in the order they happen, each with its role. */
export function noted(inner: RoleAdapter): { adapter: RoleAdapter; events: string[]; started: { prompt: string; cwd: string; role?: RoleStage }[] } {
  const events: string[] = [];
  const started: { prompt: string; cwd: string; role?: RoleStage }[] = [];
  const adapter: RoleAdapter = {
    name: inner.name,
    features: inner.features,
    notice: inner.notice,
    start: async (options, listener) => {
      const who = `${options.role?.role ?? "none"} ${String(started.length + 1)}`;
      started.push(options);
      events.push(`start ${who}`);
      let exited = false;
      const exit = (): void => {
        if (!exited) events.push(`exit ${who}`);
        exited = true;
      };
      const run = await inner.start(options, (event) => {
        if (event.type === "exit") exit();
        listener(event);
      });
      return {
        ...run,
        stop: async () => {
          if (!exited) events.push(`stop ${who}`);
          await run.stop();
          exit();
        },
      };
    },
  };
  return { adapter, events, started };
}
