// The broad gate's run: one command handed to `/bin/sh -c` with no terminal,
// what it printed, and the end of its process group at a stop. Every command
// is a stand-in the case writes, run in a temporary folder: no case runs a
// repository's own check, and none asks the person's own login shell.
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Daemon } from "../src/daemon/daemon";
import { GATE_KILL_AFTER_MS, GATE_LIMIT_MS, GATE_OUTPUT_CHARS, PATH_SCRIPT, gateEnvironment, loginPath, outputCut, startGate } from "../src/daemon/gate";
import { paneCommands, setupPaneCommand } from "../src/daemon/hooks";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { MARKER } from "../src/daemon/records-place";
import { alive, untilGone } from "./built-app";
import { type Cleanups, NOW, TOKEN, clean, client, commitAll, roles, standing, write } from "./chain-run";
import { git, temporaryRepository } from "./repositories";

const folders: string[] = [];
const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

/** A temporary folder, by its real path, which `pwd -P` prints. */
function folder(): string {
  const made = realpathSync(mkdtempSync(join(tmpdir(), "owlery-gate-")));
  folders.push(made);
  return made;
}

const ENV = { PATH: "/usr/bin:/bin" };

/** A file's text once the file stands with a line in it. */
async function written(file: string): Promise<string> {
  const end = Date.now() + 10_000;
  while (!(existsSync(file) && readFileSync(file, "utf8").includes("\n"))) {
    if (Date.now() > end) throw new Error(`${file} was not written`);
    await new Promise((r) => setTimeout(r, 20));
  }
  return readFileSync(file, "utf8");
}

describe("a broad gate's command", { timeout: 30_000 }, () => {
  it("runs through /bin/sh in the folder given, with no terminal on its input or on either output stream, an input that reads as ended, and the environment given and no other", async () => {
    const cwd = folder();
    const command = 'pwd -P; for fd in 0 1 2; do if [ -t $fd ]; then echo "$fd terminal"; else echo "$fd none"; fi; done; cat; echo "read ended"; env | grep -E "^(GIVEN|HOME|TERM)="';
    const end = await startGate({ command, cwd, env: { ...ENV, GIVEN: "given" } }).ended;
    expect(end).toEqual({ exitCode: 0, signal: null, error: null, output: `${cwd}\n0 none\n1 none\n2 none\nread ended\nGIVEN=given\n` });
  });

  it("hands the whole line to the shell, gives the code the line exits with, and keeps what it printed on both streams", async () => {
    const end = await startGate({ command: "echo out && echo err >&2 && false || exit 3", cwd: folder(), env: ENV }).ended;
    expect(end).toEqual({ exitCode: 3, signal: null, error: null, output: "out\nerr\n" });
  });

  it("leads a process group of its own, which is not the group of the process that started it", async () => {
    const end = await startGate({ command: "echo $$; ps -o pgid= -p $$", cwd: folder(), env: ENV }).ended;
    const [pid, group] = end.output.trim().split(/\s+/u).map(Number);
    expect(end.exitCode).toBe(0);
    expect(group).toBe(pid);
    expect(pid).not.toBe(process.pid);
  });

  it("keeps the last characters of a longer output, as many as the bound, and all of a shorter one, and a kept text is cut where it is as long as the bound", async () => {
    const long = await startGate({ command: "printf 'abcdefghij'; sleep 0.2; printf 'klmno' >&2", cwd: folder(), env: ENV, outputChars: 8 }).ended;
    expect(long.output).toBe("hijklmno");
    expect(outputCut(long.output, 8)).toBe(true);
    const short = await startGate({ command: "printf 'abcdefg'", cwd: folder(), env: ENV, outputChars: 8 }).ended;
    expect(short.output).toBe("abcdefg");
    expect(outputCut(short.output, 8)).toBe(false);
    expect([outputCut("x".repeat(GATE_OUTPUT_CHARS - 1)), outputCut("x".repeat(GATE_OUTPUT_CHARS))]).toEqual([false, true]);
    expect(GATE_OUTPUT_CHARS).toBe(262_144);
  });

  it("ends the command's process group at a stop: the shell and the process it started have both exited, and the end names the signal", async () => {
    const cwd = folder();
    const gate = startGate({ command: "sleep 30 & echo $! > child; echo $$ > shell; wait", cwd, env: ENV });
    const pids = [Number(await written(join(cwd, "child"))), Number(await written(join(cwd, "shell")))];
    expect(pids.map(alive)).toEqual([true, true]);
    await gate.stop();
    expect(await gate.ended).toMatchObject({ exitCode: null, signal: "SIGTERM", error: null });
    expect(await untilGone(pids, 5_000)).toEqual([]);
    // A stop of a command that has ended signals nothing and settles.
    await gate.stop();
  });

  it("kills the group where the command has not exited once the wait after the signal is over", async () => {
    const cwd = folder();
    // An ignored signal stays ignored in what the shell starts.
    const gate = startGate({ command: "trap '' TERM; sleep 30 & echo $! > child; echo $$ > shell; wait", cwd, env: ENV, killAfterMs: 200 });
    const pids = [Number(await written(join(cwd, "child"))), Number(await written(join(cwd, "shell")))];
    const before = Date.now();
    await gate.stop();
    // The wait is the one the caller gave, and not the two seconds of a daemon's stop.
    expect(Date.now() - before).toBeGreaterThanOrEqual(190);
    expect(Date.now() - before).toBeLessThan(1_500);
    expect(await gate.ended).toMatchObject({ exitCode: null, signal: "SIGKILL" });
    expect(await untilGone(pids, 5_000)).toEqual([]);
    expect([GATE_KILL_AFTER_MS, GATE_LIMIT_MS]).toEqual([2000, 60 * 60_000]);
  });

  it("ends once the shell has exited, whatever a process it left behind holds of the streams, and keeps nothing that process prints later", async () => {
    const cwd = folder();
    const before = Date.now();
    const end = await startGate({ command: "(sleep 2; echo late) & echo $! > child; echo done", cwd, env: ENV }).ended;
    expect(Date.now() - before).toBeLessThan(1_500);
    expect(end).toEqual({ exitCode: 0, signal: null, error: null, output: "done\n" });
    await untilGone([Number(await written(join(cwd, "child")))], 5_000);
  });

  it("ends with why no process started where the folder does not stand, and a stop of it settles", async () => {
    const gate = startGate({ command: "true", cwd: join(folder(), "gone"), env: ENV });
    const end = await gate.ended;
    expect(end).toMatchObject({ exitCode: null, signal: null, output: "" });
    expect(end.error).toMatch(/ENOENT/u);
    await gate.stop();
  });
});

/** A stand-in for the login shell: a script the case writes. */
function shell(body: string): string {
  const path = join(folder(), "shell");
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
  return path;
}

describe("a broad gate's environment", { timeout: 30_000 }, () => {
  it("is a pane's without the two variables that say a terminal stands, with the path given, and with the daemon's own path where none is given", () => {
    const base = { PATH: "/own/bin:/project/node_modules/.bin", HOME: "/home/me", TERM: "xterm", COLORTERM: "truecolor", CLAUDECODE: "1", npm_config_prefix: "/x" };
    expect(gateEnvironment(base, "/login/bin:/usr/bin")).toEqual({ PATH: "/login/bin:/usr/bin", HOME: "/home/me", LANG: "en_US.UTF-8" });
    expect(gateEnvironment(base, null)).toEqual({ PATH: "/own/bin", HOME: "/home/me", LANG: "en_US.UTF-8" });
  });

  it("holds none of the chain's variables of the pane it was started from, and keeps the run folder and every other variable of Owlery's", () => {
    const pane = { PATH: "/own/bin", HOME: "/home/me", OWLERY_CHAIN: "/run/owl-chain", OWLERY_BASE: "release/v0.0.4", OWLERY_PANE_ID: "19", OWLERY_HOOK_SOCKET: "/run/hooks.sock", OWLERY_RUN_DIR: "/run", OWLERY_BACKGROUND: "1" };
    expect(gateEnvironment(pane, null)).toEqual({ PATH: "/own/bin", HOME: "/home/me", OWLERY_RUN_DIR: "/run", OWLERY_BACKGROUND: "1", LANG: "en_US.UTF-8" });
  });

  it("holds none of the pane variables that the command of a shell, of a Claude Code pane on the owl chain or off it, or of a worktree setup pane sets for that pane, the runner of heavy commands among them", () => {
    // Every key these pane commands set, read off what they return. Their starts name no account folder, so no command here sets `CLAUDE_CONFIG_DIR`, which the frame keeps out of the cut. The set is pinned below, so a variable a later change adds to a pane's command fails this case there, and that change decides whether the variable is a pane variable.
    const chain = { bundleDir: "/app/dist/bundle", headFile: "/run/pane-head.md", launcher: "/run/owl-chain" };
    const commandFor = paneCommands({ SHELL: "/bin/zsh" }, "/run/hooks.json", "/run/hooks.sock", ({ folder }) => (folder === "/w/owl" ? { chain, enabledPlugins: null } : null), "/run/owl-run");
    const start = { continueLatest: false, base: "release/v0.0.4", checkout: "/r/project", chosen: null, accountDir: null, configDir: null };
    const panes = [commandFor("shell", 1, { ...start, folder: "/w/other" }), commandFor("claude", 2, { ...start, folder: "/w/other" }), commandFor("claude", 3, { ...start, folder: "/w/owl" }), setupPaneCommand({ SHELL: "/bin/zsh" }, "pnpm install", 4, "/run/owl-run")];
    const set = panes.flatMap((pane) => Object.keys(pane.env));
    expect(new Set(set)).toEqual(new Set(["OWLERY_PANE_ID", "OWLERY_HOOK_SOCKET", "OWLERY_RUN", "OWLERY_CHAIN", "OWLERY_BASE"]));
    for (const pane of panes) {
      const env = gateEnvironment({ PATH: "/own/bin", OWLERY_RUN_DIR: "/run", ...pane.env }, null);
      expect(Object.keys(env).filter((name) => set.includes(name))).toEqual([]);
      expect(env.OWLERY_RUN_DIR).toBe("/run");
    }
  });


  it("asks the login shell for its path as an interactive login shell, with the script that prints it, and reads the marked line whatever else the profile prints and whatever the shell exits with", async () => {
    const asked = shell(`echo "a profile's greeting"; printf '%s\\n' "$1 $2 $3" "\${CLAUDECODE:-unset} \${TERM:-unset}" "$4" > "$0.asked"; printf '\\n__owlery_path=%s\\n' '/login/bin:/usr/bin'; exit 7`);
    expect(await loginPath({ SHELL: asked, PATH: "/usr/bin:/bin", CLAUDECODE: "1" })).toBe("/login/bin:/usr/bin");
    // The shell is started as a pane's is: with a terminal's type, and without what the process that started the app gave it.
    expect(readFileSync(`${asked}.asked`, "utf8")).toBe(`-l -i -c\nunset xterm-256color\n${PATH_SCRIPT}\n`);
    // The script itself, run by a shell, prints the shell's own path on the marked line.
    expect(await loginPath({ SHELL: shell(`PATH=/from/profile:/usr/bin:/bin; shift 3; eval "$1"`), PATH: "/usr/bin:/bin" })).toBe("/from/profile:/usr/bin:/bin");
  });

  it("gives no path where the shell prints no marked line, where the line is empty, and where the shell does not answer within the wait", async () => {
    expect(await loginPath({ SHELL: shell("echo nothing marked"), PATH: "/usr/bin:/bin" })).toBeNull();
    expect(await loginPath({ SHELL: shell("printf '\\n__owlery_path=\\n'"), PATH: "/usr/bin:/bin" })).toBeNull();
    const before = Date.now();
    expect(await loginPath({ SHELL: shell("exec sleep 5"), PATH: "/usr/bin:/bin" }, 200)).toBeNull();
    expect(Date.now() - before).toBeLessThan(3_000);
  });
});

// The daemon's own run of a gate, on a temporary repository whose command is a stand-in the case names.
describe("the broad gate as the daemon runs it", { timeout: 60_000 }, () => {
  type Client = Awaited<ReturnType<typeof client>>;
  /** What a `readGateOutput` is answered with: the text, or the error's sentence. */
  async function output(c: Client, id: number, requestId: number): Promise<string> {
    const answer = await c.asked({ type: "readGateOutput", requestId, workItemId: id });
    return answer.type === "gateOutput" ? answer.text : answer.type === "error" ? `error: ${answer.message}` : answer.type;
  }
  /** Waits until a file stands. */
  async function stands(file: string): Promise<void> {
    const end = Date.now() + 10_000;
    while (!existsSync(file)) {
      if (Date.now() > end) throw new Error(`${file} does not stand`);
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  /** Has the daemon's own process name the stand-in as the person's shell until the case ends. */
  function asShell(path: string): void {
    const was = process.env.SHELL;
    process.env.SHELL = path;
    cleanups.push(() => {
      if (was === undefined) delete process.env.SHELL;
      else process.env.SHELL = was;
    });
  }

  it("runs the command in the work item's worktree, on the branch's head, with no terminal on its input or its output, and with the environment it was given", async () => {
    const gate = 'pwd -P; git rev-parse HEAD; for fd in 0 1 2; do if [ -t $fd ]; then echo "$fd terminal"; else echo "$fd none"; fi; done; echo "$OWLERY_CASE"';
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate, gateEnv: { PATH: process.env.PATH ?? "/usr/bin:/bin", OWLERY_CASE: "the case's own" }, roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    expect(await c.startChain(a.id)).toBe("done");
    const chain = await c.chain(a.id, "rested");
    expect(chain.stages.at(-3)).toMatchObject({ kind: "gate", state: "finished", gate: { command: gate, exitCode: 0, output: true } });
    // The head the command read is the commit of round 1's record: the run's own record and the sealer's verdict are the two commits after it.
    const ran = git(a.worktree, "rev-parse", "HEAD~2").trim();
    expect(await output(c, a.id, 2)).toBe(`${a.worktree}\n${ran}\n0 none\n1 none\n2 none\nthe case's own\n`);
  });

  it("runs the command with the path the person's login shell prints, which it asks that shell for once in its life, and without the variables that say a terminal stands", async () => {
    const out = folder();
    asShell(shell(`echo asked >> '${out}/asked'; printf '\\n__owlery_path=%s\\n' "/stand-in/bin:$PATH"`));
    const { c, workItems } = await standing(cleanups, ["Sealed work"], { gate: 'echo "$PATH"; env | grep -c -E "^(TERM|COLORTERM)="; true', gateEnv: undefined, roleAdapter: roles({ proofer: clean }) });
    const a = workItems[0]!;
    expect(await c.startChain(a.id)).toBe("done");
    await c.chain(a.id, "rested");
    expect(await output(c, a.id, 2)).toMatch(/^\/stand-in\/bin:.*\n0\n$/u);
    write(a.worktree, "feature.txt", "Another greeting\n");
    commitAll(a.worktree, "feat: greet again");
    c.messages.length = 0;
    expect(await c.startChain(a.id)).toBe("done");
    expect((await c.chain(a.id, "rested")).stages.map(({ kind }) => kind)).toEqual(["round", "gate", "seal", "pull-request", "round", "gate", "seal", "pull-request"]);
    expect(readFileSync(join(out, "asked"), "utf8")).toBe("asked\n");
  });

  it("starts no command in a daemon that closed, nor in a work item that was archived, while the login shell was asked", async () => {
    const slow = (out: string): string => shell(`echo asked >> '${out}/asked'; sleep 1; printf '\\n__owlery_path=%s\\n' "$PATH"`);
    const closing = folder();
    asShell(slow(closing));
    const closed = await standing(cleanups, ["Sealed work"], { gate: `echo ran >> '${closing}/ran'`, gateEnv: undefined, roleAdapter: roles({ proofer: clean }) });
    expect(await closed.c.startChain(closed.workItems[0]!.id)).toBe("done");
    await stands(join(closing, "asked"));
    await closed.d.close();
    expect(existsSync(join(closing, "ran"))).toBe(false);

    const archiving = folder();
    asShell(slow(archiving));
    const archived = await standing(cleanups, ["Sealed work"], { gate: `echo ran >> '${archiving}/ran'`, gateEnv: undefined, roleAdapter: roles({ proofer: clean }) });
    const a = archived.workItems[0]!;
    expect(await archived.c.startChain(a.id)).toBe("done");
    await stands(join(archiving, "asked"));
    expect((await archived.c.asked({ type: "archiveWorkItem", requestId: 2, id: a.id, running: { panes: [], headless: [] } })).type).toBe("done");
    const chain = await archived.c.chain(a.id, "stopped");
    expect(chain.says).toBe(`The chain stopped: work item ${String(a.id)} is archived, restore it first.`);
    expect(chain.stages.map(({ kind }) => kind)).toEqual(["round"]);
    expect(existsSync(join(archiving, "ran"))).toBe(false);
  });

  it("keeps nothing an earlier work item's gate printed under an id that is given to a new work item", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const runDir = join(made.base, "run");
    mkdirSync(join(runDir, "gate-output"), { recursive: true });
    writeFileSync(join(runDir, "gate-output", "1.txt"), "printed for a work item the daemon no longer lists\n");
    const d = new Daemon({ token: TOKEN, paneKinds: PANE_KINDS, roleAdapter: roles(), commandFor: () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }), runDir, worktreesRoot: made.root, now: () => NOW });
    const port = await d.listen(0);
    cleanups.push(() => d.close());
    const c = await client({ url: `ws://127.0.0.1:${String(port)}`, d }, cleanups);
    await c.message("ready");
    const created = await c.asked({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Given the id", kind: "shell", cols: 80, rows: 24 });
    expect(created).toMatchObject({ type: "workItemCreated", workItem: { id: 1 } });
    expect(await output(c, 1, 2)).toBe("error: Owlery keeps no output of a broad gate of work item 1.");
    expect(existsSync(join(runDir, "gate-output", "1.txt"))).toBe(false);
  });

  it("keeps what the command printed in memory where the daemon was given no run folder, and drops it with the work item", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    write(made.repo, "seal/README.md", `${MARKER}\n`);
    write(made.repo, "seal/config.json", '{ "Broad gate": "echo kept; exit 1" }\n');
    commitAll(made.repo, "chore: add the place for work records");
    const d = new Daemon({ token: TOKEN, paneKinds: PANE_KINDS, roleAdapter: roles({ proofer: clean }), commandFor: () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }), worktreesRoot: made.root, now: () => NOW, gateEnv: { PATH: process.env.PATH ?? "/usr/bin:/bin" } });
    const port = await d.listen(0);
    cleanups.push(() => d.close());
    const c = await client({ url: `ws://127.0.0.1:${String(port)}`, d }, cleanups);
    await c.message("ready");
    const created = await c.asked({ type: "createWorkItem", requestId: 1, repo: made.repo, title: "Kept in memory", kind: "shell", cols: 80, rows: 24 });
    if (created.type !== "workItemCreated") throw new Error(`the work item was not created: ${JSON.stringify(created)}`);
    const { id, worktree } = created.workItem;
    // A rename gives the work item its branch, which the chain commits its records on.
    expect((await c.asked({ type: "renameWorkItem", requestId: 2, id, title: "Kept in memory", branch: true })).type).toBe("done");
    write(worktree, "feature.txt", "A greeting\n");
    commitAll(worktree, "feat: greet");
    expect(await c.startChain(id)).toBe("done");
    expect((await c.chain(id, "stopped")).stages.at(-1)).toMatchObject({ kind: "gate", state: "failed", gate: { exitCode: 1, output: true } });
    expect(await output(c, id, 3)).toBe("kept\n");
    const loss = await c.asked({ type: "readLoss", requestId: 4, id });
    const stamp = loss.type === "workItemLoss" ? loss.loss.stamp : "";
    expect((await c.asked({ type: "deleteWorkItem", requestId: 5, id, stamp, force: true, running: { panes: [created.session.id], headless: [] } })).type).toBe("done");
    expect(await output(c, id, 6)).toBe(`error: no work item ${String(id)}`);
  });
});
