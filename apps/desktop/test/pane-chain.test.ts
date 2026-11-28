import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { HEAD_FILE, LAUNCHER_FILE, RUNNER_FILE, carriedIn, paneHead, writePaneChain, writeRunner } from "../src/daemon/pane-chain";

const dirs: string[] = [];
function scratch(): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "owlery-pane-chain-")));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A script that prints the arguments it was given and what its environment holds of the variable that makes Electron run as Node. */
function printing(dir: string): string {
  const script = join(dir, "prints.js");
  writeFileSync(script, "process.stdout.write(JSON.stringify({ args: process.argv.slice(2), asNode: process.env.ELECTRON_RUN_AS_NODE ?? null }));\n");
  return script;
}

describe("paneHead", () => {
  it("says the three things a pane's session is told and names the document that holds the rules: the session carries the owl chain, a branch takes its inspection from it before its pull request or its end, and the bundle's document and the pane's environment say how", () => {
    const head = paneHead();
    expect(head.split("\n")[0]).toBe("# Owlery: this session carries the Owl Chain");
    expect(head).toContain("so it carries the Owl Chain: the roles of Owlery's role bundle, which is loaded as the plugin `owlery` for this session alone.");
    expect(head).toContain("A branch is cleared by the Owl Chain's inspection before its pull request is opened or the work is called done.");
    expect(head).toContain("The bundle's document `skills/inspection/SKILL.md`, listed as the skill `owlery:inspection`, says how. The chain command is the program this pane's environment names in `OWLERY_CHAIN`.");
    // The head states no step of the chain: the document it names does.
    for (const word of ["owed", "round", "gate", "--base"]) expect(head, word).not.toContain(word);
  });
});

describe("writePaneChain", () => {
  it("writes the head and the launcher into the run folder, readable by the user alone, and names both with the bundle", () => {
    const dir = join(scratch(), "run");
    const chain = writePaneChain(dir, { node: process.execPath, script: "/app/dist/chain.js", bundleDir: "/app/dist/bundle" });
    expect(chain).toEqual({ bundleDir: "/app/dist/bundle", headFile: join(dir, HEAD_FILE), launcher: join(dir, LAUNCHER_FILE) });
    expect(readFileSync(chain.headFile, "utf8")).toBe(paneHead());
    expect(statSync(dir).mode & 0o777).toBe(0o700);
    expect(statSync(chain.headFile).mode & 0o777).toBe(0o600);
    expect(statSync(chain.launcher).mode & 0o777).toBe(0o700);
  });

  it("writes a launcher that runs the chain command's script with the Node it was given, as Node for that one process, and hands it every argument as it was typed, from a folder whose name holds a space and a quote", () => {
    const dir = join(scratch(), "a run's folder");
    mkdirSync(dir);
    const { launcher } = writePaneChain(dir, { node: process.execPath, script: printing(dir), bundleDir: join(dir, "bundle") });
    // The pane's own environment holds no such variable: the daemon's pane drops it (`pty.ts#terminalEnv`).
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const printed = execFileSync(launcher, ["inspect", "an answer.md", "--inspected-by", "it's"], { encoding: "utf8", env });
    expect(JSON.parse(printed)).toEqual({ args: ["inspect", "an answer.md", "--inspected-by", "it's"], asNode: "1" });
  });

  it("writes over the files an earlier daemon left, and names the launcher apart from the folder the chain command keeps its files in", () => {
    const dir = scratch();
    writeFileSync(join(dir, HEAD_FILE), "an earlier build's head\n");
    writeFileSync(join(dir, LAUNCHER_FILE), "#!/bin/sh\nexit 9\n", { mode: 0o644 });
    const { launcher, headFile } = writePaneChain(dir, { node: process.execPath, script: printing(dir), bundleDir: join(dir, "bundle") });
    expect(readFileSync(headFile, "utf8")).toBe(paneHead());
    expect(statSync(launcher).mode & 0o777).toBe(0o700);
    expect(JSON.parse(execFileSync(launcher, ["owed"], { encoding: "utf8" })).args).toEqual(["owed"]);
    // The command writes each stage's prompt under `chain/<work item>/` of the run folder (`chain-command.ts#stageFolder`), so a launcher named `chain` would stand where that folder goes.
    mkdirSync(join(dir, "chain", "1-a-work-item"), { recursive: true });
  });
});

describe("writeRunner", () => {
  it("writes the runner's launcher into the run folder, readable by the user alone and over what an earlier daemon left, which runs the chain command's `run` with the Node it was given, as Node, with the run folder in OWLERY_RUN_DIR and every argument as it was typed, from a folder whose name holds a space and a quote", () => {
    const dir = join(scratch(), "a run's folder");
    mkdirSync(dir);
    writeFileSync(join(dir, RUNNER_FILE), "#!/bin/sh\nexit 9\n", { mode: 0o644 });
    const script = join(dir, "prints.js");
    writeFileSync(script, "process.stdout.write(JSON.stringify({ args: process.argv.slice(2), asNode: process.env.ELECTRON_RUN_AS_NODE ?? null, runDir: process.env.OWLERY_RUN_DIR ?? null }));\n");
    const runner = writeRunner(dir, { node: process.execPath, script });
    expect(runner).toBe(join(dir, RUNNER_FILE));
    expect(statSync(runner).mode & 0o777).toBe(0o700);
    // A session outside a pane holds neither variable, and the launcher sets both for its one process.
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    delete env.OWLERY_RUN_DIR;
    const printed = execFileSync(runner, ["test", "--", "test/a view.test.ts", "it's"], { encoding: "utf8", env });
    expect(JSON.parse(printed)).toEqual({ args: ["run", "test", "--", "test/a view.test.ts", "it's"], asNode: "1", runDir: dir });
  });
});

describe("carriedIn", () => {
  const chain = { bundleDir: "/app/dist/bundle", headFile: "/run/pane-head.md", launcher: "/run/owl-chain" };

  /** A start of a pane in a folder, under System default. */
  const start = (folder: string) => ({ continueLatest: false, folder, base: "main", accountDir: null });

  it("gives the chain for a folder whose installed check is Owlery's, read at each call, and nothing for any other folder or where the daemon holds no chain to give", () => {
    const folder = scratch();
    const carries = carriedIn(chain);
    expect(carries(start(folder))).toBeNull();
    mkdirSync(join(folder, ".github", "workflows"), { recursive: true });
    writeFileSync(join(folder, ".github", "workflows", "owlery-inspection.yml"), "name: inspection\n");
    // Nothing of the folder is kept between two launches.
    expect(carries(start(folder))).toEqual(chain);
    expect(carries(start(join(folder, "absent")))).toBeNull();
    expect(carriedIn(undefined)(start(folder))).toBeNull();
  });

  it("gives the chain in a folder on the owl chain whatever plugins the person's Claude Code enables there, under any account, and reads none of their settings", () => {
    const folder = scratch();
    mkdirSync(join(folder, ".github", "workflows"), { recursive: true });
    writeFileSync(join(folder, ".github", "workflows", "owlery-inspection.yml"), "name: inspection\n");
    // The folder's own settings enable the AgenticSeal plugin, as a project's may.
    mkdirSync(join(folder, ".claude"));
    for (const file of ["settings.json", "settings.local.json"]) writeFileSync(join(folder, ".claude", file), `${JSON.stringify({ enabledPlugins: { "agentic@agenticseal": true } })}\n`);
    const carries = carriedIn(chain);
    expect(carries(start(folder))).toEqual(chain);
    expect(carries({ ...start(folder), accountDir: "/accounts/handed" })).toEqual(chain);
  });
});
