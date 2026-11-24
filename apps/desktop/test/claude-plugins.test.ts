import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { claudeConfigDir, readPlugins } from "../src/daemon/claude-plugins";

const dirs: string[] = [];
function scratch(): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "owlery-claude-plugins-")));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function write(file: string, text: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

const KEY = "agentic@agenticseal";
const OTHER = "notes@somewhere";

/**
 * A Claude Code config folder, a main checkout and a worktree of the case's
 * own. The config folder's list of installed plugins names two: `KEY`, whose
 * install folder holds the script AgenticSeal's check runs, and `OTHER`,
 * whose install folder holds none.
 */
function places(): { config: string; checkout: string; folder: string; enable: (file: string, plugins: unknown) => void; user: string; project: string; local: string } {
  const base = scratch();
  const config = join(base, "config");
  const checkout = join(base, "checkout");
  const folder = join(base, "worktree");
  const seal = join(base, "cache", "agenticseal", "agentic", "1.0.0");
  const notes = join(base, "cache", "somewhere", "notes", "2.0.0");
  write(join(seal, "skills", "code-review", "scripts", "chain_check.py"), "# the check\n");
  write(join(notes, "skills", "notes", "SKILL.md"), "# notes\n");
  write(join(config, "plugins", "installed_plugins.json"), JSON.stringify({ version: 2, plugins: { [KEY]: [{ scope: "user", installPath: seal, version: "1.0.0" }], [OTHER]: [{ scope: "user", installPath: notes, version: "2.0.0" }] } }));
  mkdirSync(checkout);
  mkdirSync(folder);
  return { config, checkout, folder, enable: (file, plugins) => write(file, JSON.stringify({ model: "opus", enabledPlugins: plugins })), user: join(config, "settings.json"), project: join(folder, ".claude", "settings.json"), local: join(checkout, ".claude", "settings.local.json") };
}

describe("readPlugins", () => {
  it("answers enabled for a plugin a settings file enables whose install folder holds the script AgenticSeal's check runs, at user scope and at project scope, and not enabled once the local file of the main checkout disables it again", () => {
    const at = places();
    const read = () => readPlugins(at.folder, at.checkout, at.config);
    // No settings file stands yet.
    expect(read()).toEqual({ enabled: {}, agenticSeal: [] });
    at.enable(at.user, { [KEY]: true });
    expect(read()).toEqual({ enabled: { [KEY]: true }, agenticSeal: [KEY] });
    // The project's file wins over the user's for the one key, and enables it where the user's disables it.
    at.enable(at.user, { [KEY]: false, [OTHER]: true });
    expect(read()).toEqual({ enabled: { [KEY]: false, [OTHER]: true }, agenticSeal: [] });
    at.enable(at.project, { [KEY]: true });
    expect(read()).toEqual({ enabled: { [KEY]: true, [OTHER]: true }, agenticSeal: [KEY] });
    // The local file wins over both. It is the main checkout's: one in the worktree's own folder is not read.
    at.enable(join(at.folder, ".claude", "settings.local.json"), { [KEY]: false });
    expect(read().agenticSeal).toEqual([KEY]);
    at.enable(at.local, { [KEY]: false });
    expect(read()).toEqual({ enabled: { [KEY]: false, [OTHER]: true }, agenticSeal: [] });
  });

  it("answers not enabled for an enabled plugin whose install folder holds no such script, for one the list of installed plugins does not name, and where that list does not stand or is no JSON", () => {
    const at = places();
    at.enable(at.user, { [OTHER]: true, "absent@nowhere": true });
    expect(readPlugins(at.folder, at.checkout, at.config)).toEqual({ enabled: { [OTHER]: true, "absent@nowhere": true }, agenticSeal: [] });
    at.enable(at.user, { [KEY]: true });
    const list = join(at.config, "plugins", "installed_plugins.json");
    const held = readFileSync(list, "utf8");
    writeFileSync(list, "not json");
    expect(readPlugins(at.folder, at.checkout, at.config).agenticSeal).toEqual([]);
    rmSync(list);
    expect(readPlugins(at.folder, at.checkout, at.config)).toEqual({ enabled: { [KEY]: true }, agenticSeal: [] });
    // An entry of the list that names no install folder gives none, and the one that names it is enough.
    writeFileSync(list, JSON.stringify({ version: 2, plugins: { [KEY]: [{ scope: "project" }, ...(JSON.parse(held) as { plugins: Record<string, unknown[]> }).plugins[KEY]!] } }));
    expect(readPlugins(at.folder, at.checkout, at.config).agenticSeal).toEqual([KEY]);
  });

  it("keeps each key's value as the person's file states it, reads a key as enabled unless its value is false, and reads a settings file that is no JSON, or whose enabledPlugins is no object, as one that states no key", () => {
    const at = places();
    at.enable(at.user, { [KEY]: ["1.0.0"], [OTHER]: false });
    expect(readPlugins(at.folder, at.checkout, at.config)).toEqual({ enabled: { [KEY]: ["1.0.0"], [OTHER]: false }, agenticSeal: [KEY] });
    write(at.project, "{ not json");
    at.enable(at.local, [KEY]);
    expect(readPlugins(at.folder, at.checkout, at.config).enabled).toEqual({ [KEY]: ["1.0.0"], [OTHER]: false });
  });

  it("writes nothing: every file of the config folder, of the checkout and of the worktree holds the bytes it held", () => {
    const at = places();
    at.enable(at.user, { [KEY]: true });
    at.enable(at.project, { [OTHER]: true });
    at.enable(at.local, { [OTHER]: false });
    const held = (): unknown[] =>
      [at.config, at.checkout, at.folder].flatMap((root) =>
        (readdirSync(root, { recursive: true, withFileTypes: true }) as { name: string; parentPath: string; isFile(): boolean }[]).map((entry) => [join(entry.parentPath, entry.name), entry.isFile() ? readFileSync(join(entry.parentPath, entry.name), "base64") : null]).sort(),
      );
    const before = held();
    expect(readPlugins(at.folder, at.checkout, at.config).agenticSeal).toEqual([KEY]);
    expect(held()).toEqual(before);
  });
});

describe("readPlugins and the config folder it is given", () => {
  it("reads the folder of the daemon's environment where it is given null, which is what it reads while the login shell's lookup has given no answer, and the person's own through a folder whose settings.json and plugins are links into it (scenario 16)", () => {
    const at = places();
    at.enable(at.user, { [KEY]: true });
    // A folder as Owlery makes one for an account: the person's settings and plugins are links into the person's own folder.
    const account = join(scratch(), "account");
    mkdirSync(account);
    symlinkSync(at.user, join(account, "settings.json"));
    symlinkSync(join(at.config, "plugins"), join(account, "plugins"));
    expect(readPlugins(at.folder, at.checkout, account).agenticSeal).toEqual([KEY]);
    // A folder that holds neither file enables nothing.
    expect(readPlugins(at.folder, at.checkout, scratch()).agenticSeal).toEqual([]);
    const own = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = at.config;
    try {
      expect(readPlugins(at.folder, at.checkout, null).agenticSeal).toEqual([KEY]);
    } finally {
      if (own === undefined) delete process.env.CLAUDE_CONFIG_DIR;
      else process.env.CLAUDE_CONFIG_DIR = own;
    }
  });
});

describe("claudeConfigDir", () => {
  it("is the folder CLAUDE_CONFIG_DIR names where the environment holds one, and .claude of the person's home otherwise", () => {
    expect(claudeConfigDir({ CLAUDE_CONFIG_DIR: "/accounts/work", HOME: "/Users/person" })).toBe("/accounts/work");
    expect(claudeConfigDir({ HOME: "/Users/person" })).toBe("/Users/person/.claude");
    expect(claudeConfigDir({ CLAUDE_CONFIG_DIR: "", HOME: "/Users/person" })).toBe("/Users/person/.claude");
  });
});
