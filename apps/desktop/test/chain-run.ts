// What the cases of a work item's chain share: a daemon on a temporary
// repository with the records root, a client, the round records a fake
// proofer answers with and the fix a fake crafter makes. No case starts an
// agent: every stage runs on the fake adapter.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import WebSocket from "ws";
import type { RoleAdapter } from "../src/daemon/adapters/adapter";
import { type FakeAdapterOptions, fakeAdapter } from "../src/daemon/adapters/fake";
import { Daemon, type DaemonOptions } from "../src/daemon/daemon";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { MARKER } from "../src/daemon/records-place";
import { createWorktree } from "../src/daemon/worktrees";
import type { Chain, RoleStage, ServerMessage, WorkItem } from "../src/shared/protocol";
import { git, temporaryRepository } from "./repositories";

const TOKEN = "t".repeat(64);

/** The daemon's clock in the cases: a directory the daemon makes is named `1795388700-<slug>`. */
export const NOW = 1_795_388_700_000;

/** The day of the daemon's clock in the cases, as the machine's own time zone has it, which a routing the daemon writes is answered on. */
export const TODAY = ((at: Date): string => `${String(at.getFullYear())}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`)(new Date(NOW));

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
 * holds no records root.
 */
export async function standing(cleanups: Cleanups, titles: string[], options: Partial<DaemonOptions> & { root?: boolean } = {}) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const { root = true, ...daemonOptions } = options;
  if (root) {
    write(made.repo, "seal/README.md", `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
    write(made.repo, "seal/config.json", `${JSON.stringify({ "Commit and pull request language": "English", "Record language": "English", "Broad gate": "true" }, null, 2)}\n`);
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
  const start = async (more: Partial<DaemonOptions> = {}) => {
    const d = new Daemon({
      token: TOKEN,
      paneKinds: PANE_KINDS,
      roleAdapter: fakeAdapter(),
      commandFor: () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }),
      runDir,
      worktreesRoot: made.root,
      now: () => NOW,
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
  return { made, runDir, d, url, c, workItems, start };
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

/** What each fake role of a chain does: the proofer's answer for a round, and the crafter's work in the worktree. */
export interface Roles {
  /** The proofer's answer to a round's prompt. Absent, round 1 holds finding 1 and each later round confirms the findings of the round before it. */
  proofer?: (given: { round: number; heading: string; target: string }, prompt: string) => string;
  /** The crafter's work in the worktree. Absent, it commits a fix and closes each open finding. */
  crafter?: (cwd: string, prompt: string) => void | Promise<void>;
}

/** The answer of the proofer that does its part: round 1 holds finding 1, and each later round confirms finding 1 of the round before it. */
export function proofs(given: { round: number; heading: string; target: string }): string {
  return given.round === 1 ? roundRecord(given.heading, given.target, [1]) : roundRecord(given.heading, given.target, [], [`round-${String(given.round - 1)}#1`]);
}

/** A fake adapter whose proofer and crafter act as the roles given, with every other option of the fake adapter. */
export function roles(given: Roles = {}, options: FakeAdapterOptions = {}): RoleAdapter {
  return fakeAdapter({
    pieces: (prompt, role) => (role?.role === "proofer" ? [(given.proofer ?? proofs)(givenRound(prompt), prompt)] : ["The fix pass is done."]),
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
