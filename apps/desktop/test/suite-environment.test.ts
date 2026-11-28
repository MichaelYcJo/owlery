// layer: process
// The environment the launcher `scripts/test-in-electron.mjs` starts vitest
// with: the real git first on `PATH` where the `git` on it is Apple's shim,
// and a git that reads no person's configuration. And the identity a
// repository of the suite's helpers holds in its own configuration, which
// costs no process.
import { execFileSync, spawnSync } from "node:child_process";
import { accessSync, chmodSync, constants, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { suiteEnvironment, writeGitHome } from "../scripts/test-in-electron.mjs";
import { git, temporaryClone, temporaryRepository } from "./repositories";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function folder(): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "owlery-suite-environment-")));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A stand-in for `xcrun -f git` that counts its calls and answers with `answer`. */
function realGitGiving(answer: string | null): { realGit: () => string | null; calls: () => number } {
  let calls = 0;
  return { realGit: () => (calls++, answer), calls: () => calls };
}

/** The first `git` a search of `PATH` finds, as a shell's would. */
function firstGit(path: string): string | undefined {
  return path
    .split(":")
    .map((dir) => join(dir, "git"))
    .find((candidate) => {
      try {
        accessSync(candidate, constants.X_OK);
        return true;
      } catch {
        return false;
      }
    });
}

const XCODE_GIT = "/Library/Developer/CommandLineTools/usr/bin/git";

describe("the launcher's PATH", () => {
  it.runIf(process.platform === "darwin")("puts on macOS the folder of the git `xcrun -f git` names first, where the first git on PATH is /usr/bin/git", () => {
    const given = realGitGiving(XCODE_GIT);
    const env = suiteEnvironment({ PATH: "/usr/bin:/bin:/usr/sbin" }, "darwin", given.realGit, folder());
    expect(env.PATH).toBe("/Library/Developer/CommandLineTools/usr/bin:/usr/bin:/bin:/usr/sbin");
    expect(given.calls()).toBe(1);
  });

  it("leaves PATH as it is, and asks no xcrun, where the first git on it is another, where the platform is not macOS, or where xcrun names none", () => {
    const own = folder();
    writeFileSync(join(own, "git"), "#!/bin/sh\n");
    chmodSync(join(own, "git"), 0o755);
    // A file named git that cannot run is no git a search finds.
    const unrunnable = folder();
    writeFileSync(join(unrunnable, "git"), "");
    const another = realGitGiving(XCODE_GIT);
    expect(suiteEnvironment({ PATH: `${unrunnable}:${own}:/usr/bin` }, "darwin", another.realGit, folder()).PATH).toBe(`${unrunnable}:${own}:/usr/bin`);
    expect(another.calls()).toBe(0);
    const linux = realGitGiving(XCODE_GIT);
    expect(suiteEnvironment({ PATH: "/usr/bin:/bin" }, "linux", linux.realGit, folder()).PATH).toBe("/usr/bin:/bin");
    expect(linux.calls()).toBe(0);
    for (const answer of [null, "", "/usr/bin/git"]) expect(suiteEnvironment({ PATH: "/usr/bin:/bin" }, "darwin", realGitGiving(answer).realGit, folder()).PATH).toBe("/usr/bin:/bin");
  });

  it.runIf(process.platform === "darwin")("gives this run a PATH whose first git is no longer the shim, where xcrun names a git", () => {
    const named = spawnSync("xcrun", ["-f", "git"], { encoding: "utf8" });
    if (named.status !== 0) return;
    expect(firstGit(process.env.PATH ?? "")).not.toBe("/usr/bin/git");
  });
});

describe("the suite's git", () => {
  it("is given a global configuration of the run's own, no system configuration, and an empty template folder, beside the caller's environment", () => {
    const home = folder();
    const env = suiteEnvironment({ PATH: "/bin", HOME: "/Users/someone", GIT_CONFIG_GLOBAL: "/Users/someone/.gitconfig" }, "linux", () => null, home);
    expect(env).toEqual({ PATH: "/bin", HOME: "/Users/someone", ELECTRON_RUN_AS_NODE: "1", GIT_CONFIG_GLOBAL: join(home, "gitconfig"), GIT_CONFIG_NOSYSTEM: "1", GIT_TEMPLATE_DIR: join(home, "template") });
  });

  it("reads from that configuration the identity, no signing, `main` for a new repository and no maintenance, and from the template folder nothing", () => {
    const home = folder();
    writeGitHome(home);
    const listed = execFileSync("git", ["config", "--file", join(home, "gitconfig"), "--list"], { encoding: "utf8" });
    expect(listed.split("\n").filter((line) => line !== "")).toEqual(["user.name=Owlery Test", "user.email=test@owlery.invalid", "commit.gpgsign=false", "init.defaultbranch=main", "maintenance.auto=false", "gc.auto=0"]);
    expect(readdirSync(join(home, "template"))).toEqual([]);
  });

  it("is what this run's git reads", () => {
    expect(process.env.GIT_CONFIG_NOSYSTEM).toBe("1");
    expect(readFileSync(process.env.GIT_CONFIG_GLOBAL ?? "", "utf8")).toContain("name = Owlery Test");
    expect(existsSync(process.env.GIT_TEMPLATE_DIR ?? "")).toBe(true);
  });
});

describe("a repository's identity", () => {
  it("stands in the repository's own configuration, made with no `git config` process, so a command given an environment of its own commits under it", () => {
    const childProcess = createRequire(import.meta.url)("node:child_process") as { execFileSync: (...args: unknown[]) => unknown };
    const real = childProcess.execFileSync;
    const configs: unknown[][] = [];
    childProcess.execFileSync = (...args: unknown[]) => {
      if (Array.isArray(args[1]) && args[1][0] === "config") configs.push(args[1]);
      return real(...args);
    };
    syncBuiltinESMExports();
    let made!: ReturnType<typeof temporaryClone>;
    let repository!: ReturnType<typeof temporaryRepository>;
    try {
      repository = temporaryRepository();
      made = temporaryClone();
    } finally {
      childProcess.execFileSync = real;
      syncBuiltinESMExports();
    }
    cleanups.push(repository.remove, made.remove);
    expect(configs).toEqual([]);
    const empty = folder();
    mkdirSync(join(empty, "home"));
    const own = { PATH: process.env.PATH ?? "", HOME: join(empty, "home"), GIT_CONFIG_NOSYSTEM: "1" };
    for (const repo of [repository.repo, made.repo]) {
      expect(git(repo, "config", "--local", "--get-regexp", "^(user|commit)\\.").split("\n").filter((line) => line !== "")).toEqual(["user.name Owlery Test", "user.email test@owlery.invalid", "commit.gpgsign false"]);
      writeFileSync(join(repo, "more.txt"), "more\n");
      execFileSync("git", ["add", "more.txt"], { cwd: repo, env: own });
      execFileSync("git", ["commit", "--quiet", "-m", "more"], { cwd: repo, env: own });
      expect(execFileSync("git", ["log", "-1", "--format=%an <%ae>"], { cwd: repo, env: own, encoding: "utf8" })).toBe("Owlery Test <test@owlery.invalid>\n");
    }
  });
});
