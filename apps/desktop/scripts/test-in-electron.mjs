// Runs vitest inside Electron's Node, the Node the daemon ships on, so the
// suite loads node-pty as the daemon does. Its git is the real binary where
// the `git` on PATH is Apple's shim, and it reads no person's configuration.
import { accessSync, constants, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The global configuration the suite's git reads, in the folder `writeGitHome` makes. */
const GIT_CONFIG = "[user]\n\tname = Owlery Test\n\temail = test@owlery.invalid\n[commit]\n\tgpgsign = false\n[init]\n\tdefaultBranch = main\n[maintenance]\n\tauto = false\n[gc]\n\tauto = 0\n";

/** The first file named `git` that can run, in the folders of `path` in their order. */
function firstGit(/** @type {string} */ path) {
  for (const folder of path.split(":")) {
    const candidate = join(folder, "git");
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // No git that runs stands in this folder.
    }
  }
  return null;
}

/** The git binary `xcrun -f git` names, which Apple's shim at /usr/bin/git runs, or null where it names none. */
function xcrunGit() {
  try {
    return execFileSync("xcrun", ["-f", "git"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

/**
 * The environment vitest starts with: `env`, run as Node, with the git
 * configuration `writeGitHome` writes in `home`, no system configuration and
 * an empty template folder. On macOS, where the first git on PATH is
 * /usr/bin/git, the folder of the binary `realGit` names is put first on
 * PATH, since every start of the shim costs about 10 ms more.
 */
export function suiteEnvironment(/** @type {NodeJS.ProcessEnv} */ env, /** @type {string} */ platform, /** @type {() => string | null} */ realGit, /** @type {string} */ home) {
  const path = env.PATH ?? "";
  const real = platform === "darwin" && firstGit(path) === "/usr/bin/git" ? realGit() : null;
  const realFolder = real ? dirname(real) : null;
  return {
    ...env,
    ...(realFolder !== null && realFolder !== "/usr/bin" ? { PATH: `${realFolder}:${path}` } : {}),
    ELECTRON_RUN_AS_NODE: "1",
    GIT_CONFIG_GLOBAL: join(home, "gitconfig"),
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TEMPLATE_DIR: join(home, "template"),
  };
}

/** Writes in `home` the configuration and the empty template folder `suiteEnvironment` names. */
export function writeGitHome(/** @type {string} */ home) {
  writeFileSync(join(home, "gitconfig"), GIT_CONFIG);
  mkdirSync(join(home, "template"));
}

function main() {
  const electron = createRequire(import.meta.url)("electron");
  // vitest does not export its CLI entry, so it is reached by path.
  const vitest = join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "vitest", "vitest.mjs");
  // The run's own folder, removed when vitest exits. An interrupt from the terminal reaches vitest too, so this process waits for it.
  const home = mkdtempSync(join(tmpdir(), "owlery-suite-git-"));
  process.on("SIGINT", () => {});
  let status = 1;
  try {
    writeGitHome(home);
    status = spawnSync(electron, [vitest, "run", ...process.argv.slice(2)], { stdio: "inherit", env: suiteEnvironment(process.env, process.platform, xcrunGit, home) }).status ?? 1;
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
  process.exit(status);
}

// A test file imports this module for `suiteEnvironment`, and only a run of the script itself starts vitest.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
