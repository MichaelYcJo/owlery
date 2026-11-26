import { chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import type { AccountLogins, RoleAdapter } from "../src/daemon/adapters/adapter";
import { claudeAdapter, claudeEnv } from "../src/daemon/adapters/claude";
import { authArgs, claudeLogins, LINKED_NAMES, linkOwn, loginStatusOf } from "../src/daemon/adapters/claude-accounts";
import { fakeAdapter } from "../src/daemon/adapters/fake";
import { AccountStore } from "../src/daemon/accounts";
import { Daemon, type DaemonOptions, REFRESH_PROMPT } from "../src/daemon/daemon";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { type Account, accountFor, type HeadlessInfo, type ServerMessage, SYSTEM_DEFAULT_ID } from "../src/shared/protocol";
import { temporaryRepository } from "./repositories";

const TOKEN = "t".repeat(64);
const SYSTEM_DEFAULT = { id: 0, name: "System default", made: false, folder: null, signedIn: null, loginEndsAt: null, limits: [], refresh: null };

const cleanups: (() => Promise<void> | void)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** A temporary folder, by its real path, removed after the case. */
function folder(prefix = "owlery-accounts-"): string {
  const made = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  cleanups.push(() => rmSync(made, { recursive: true, force: true }));
  return made;
}

/** A config folder a person hands over: it holds a file of its own, so a case reads whether anything in it changed. */
function handedFolder(): string {
  const made = folder("owlery-handed-");
  writeFileSync(join(made, "settings.json"), "{}\n");
  return made;
}

/** The links a folder holds, each by its name with the path it leads to. */
function linksIn(dir: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(dir)
      .filter((name) => lstatSync(join(dir, name)).isSymbolicLink())
      .map((name) => [name, readlinkSync(join(dir, name))]),
  );
}

/** A person's own config folder: some names of the linked list, and some of a login's own, which no account's folder takes. */
function ownFolder(): string {
  const own = folder("owlery-own-");
  writeFileSync(join(own, "settings.json"), '{"enabledPlugins":{}}\n');
  writeFileSync(join(own, "CLAUDE.md"), "Be brief.\n");
  mkdirSync(join(own, "skills"));
  mkdirSync(join(own, "projects"));
  writeFileSync(join(own, "projects", "a.jsonl"), "{}\n");
  writeFileSync(join(own, "history.jsonl"), "{}\n");
  writeFileSync(join(own, ".claude.json"), "{}\n");
  writeFileSync(join(own, ".credentials.json"), "{}\n");
  mkdirSync(join(own, "statsig"));
  return own;
}

/** A copy of the stand-in for `claude auth` in a folder of its own, and the calls it noted, each as its arguments and the folder `CLAUDE_CONFIG_DIR` named. */
function authStandIn(): { cli: string; here: string; calls: () => string[] } {
  const here = folder("owlery-auth-");
  const cli = join(here, "claude");
  copyFileSync(join(__dirname, "fixtures", "claude-auth-stand-in", "claude"), cli);
  chmodSync(cli, 0o755);
  return { cli, here, calls: () => (existsSync(join(here, "calls")) ? readFileSync(join(here, "calls"), "utf8").trim().split("\n") : []) };
}

/** Claude Code's part of the accounts, with the stand-in as the CLI, the environment a role session is given, and the person's own folder as `own` names it at each call. */
function loginsOf(cli: string, own: () => string | null): AccountLogins {
  return claudeLogins({ locate: () => Promise.resolve({ cli, path: process.env.PATH ?? "/usr/bin:/bin" }), envOf: (path, at) => claudeEnv(process.env, path, at), ownFolder: own });
}

/** Each name a folder holds, with the bytes of each file, so a case reads that nothing was added, removed or written. */
function contents(dir: string): Record<string, string> {
  return Object.fromEntries(readdirSync(dir, { recursive: true, encoding: "utf8" }).map((name) => [name, statSync(join(dir, name)).isFile() ? readFileSync(join(dir, name), "utf8") : "folder"]));
}

describe("the account a new session takes", () => {
  const A = 1;
  const B = 2;
  const C = 3;
  const D = 4;

  it("takes the session's own first, then its work item's, then its repository's, then the default", () => {
    expect(accountFor(C, { accountId: B }, { accountId: A }, D)).toBe(C);
    expect(accountFor(null, { accountId: B }, { accountId: A }, D)).toBe(B);
    expect(accountFor(null, { accountId: null }, { accountId: A }, D)).toBe(A);
    expect(accountFor(null, { accountId: null }, { accountId: null }, D)).toBe(D);
  });

  it("takes System default where it is set nearer, though another stands further out: its id is no absence of a setting", () => {
    expect(accountFor(SYSTEM_DEFAULT_ID, { accountId: B }, { accountId: A }, D)).toBe(SYSTEM_DEFAULT_ID);
    expect(accountFor(null, { accountId: SYSTEM_DEFAULT_ID }, { accountId: A }, D)).toBe(SYSTEM_DEFAULT_ID);
    expect(accountFor(null, { accountId: null }, { accountId: SYSTEM_DEFAULT_ID }, D)).toBe(SYSTEM_DEFAULT_ID);
  });

  it("reads a work item and a repository of a daemon of an earlier build, which send no setting, as nothing set", () => {
    expect(accountFor(null, {}, {}, D)).toBe(D);
    expect(accountFor(null, {}, { accountId: A }, D)).toBe(A);
  });
});

describe("AccountStore", () => {
  it("adds an account the person hands over by its folder, under the next id, and lists System default first, then the accounts in the order they were added", () => {
    const store = new AccountStore(folder());
    const work = handedFolder();
    const home = handedFolder();
    expect(store.addHanded(" Work ", work, "claude")).toEqual({ id: 1, name: "Work", adapter: "claude", folder: work, made: false, signedIn: null, loginEndsAt: null, limits: [] });
    expect(store.addHanded("Home", `${home}/`, "claude")).toEqual({ id: 2, name: "Home", adapter: "claude", folder: home, made: false, signedIn: null, loginEndsAt: null, limits: [] });
    expect(store.listed()).toEqual([SYSTEM_DEFAULT, { id: 1, name: "Work", made: false, folder: work, signedIn: null, loginEndsAt: null, limits: [], refresh: null }, { id: 2, name: "Home", made: false, folder: home, signedIn: null, loginEndsAt: null, limits: [], refresh: null }]);
    expect(store.account(2)?.folder).toBe(home);
    expect(store.account(SYSTEM_DEFAULT_ID)).toBeUndefined();
    expect(store.account(3)).toBeUndefined();
    expect([0, 1, 2, 3].map((id) => store.holds(id))).toEqual([true, true, true, false]);
  });

  it("makes nothing in a folder handed over and changes nothing of it", () => {
    const store = new AccountStore(folder());
    const handed = handedFolder();
    mkdirSync(join(handed, "projects"));
    writeFileSync(join(handed, "projects", "a.jsonl"), "{}\n");
    const before = contents(handed);
    store.addHanded("Work", handed, "claude");
    expect(contents(handed)).toEqual(before);
  });

  it("refuses with a sentence a path that is not absolute, a path where no folder stands, a file, a folder that is already an account's by another spelling, and an empty name, and adds nothing at any of them", () => {
    const store = new AccountStore(folder());
    const handed = handedFolder();
    store.addHanded("Work", handed, "claude");
    const alias = join(folder(), "alias");
    symlinkSync(handed, alias);
    const file = join(handed, "settings.json");
    expect(() => store.addHanded("Relative", "accounts/work", "claude")).toThrow('The folder of an account is an absolute path, and "accounts/work" is not one.');
    expect(() => store.addHanded("Missing", join(handed, "missing"), "claude")).toThrow(`No folder stands at ${join(handed, "missing")}.`);
    expect(() => store.addHanded("File", file, "claude")).toThrow(`No folder stands at ${file}.`);
    expect(() => store.addHanded("Again", handed, "claude")).toThrow(`The folder ${handed} is already the account "Work".`);
    expect(() => store.addHanded("Alias", alias, "claude")).toThrow(`The folder ${alias} is already the account "Work".`);
    expect(() => store.addHanded("  ", handedFolder(), "claude")).toThrow("An account needs a name.");
    expect(store.listed().map((account) => account.id)).toEqual([0, 1]);
  });

  it("names System default the default until another is chosen, refuses an id it keeps no account under, and says whether the default is another than it was", () => {
    const store = new AccountStore(folder());
    expect(store.defaultId()).toBe(SYSTEM_DEFAULT_ID);
    store.addHanded("Work", handedFolder(), "claude");
    expect(store.setDefault(1)).toBe(true);
    expect(store.setDefault(1)).toBe(false);
    expect(store.defaultId()).toBe(1);
    expect(() => store.setDefault(7)).toThrow("No account 7 is kept.");
    expect(store.defaultId()).toBe(1);
    expect(store.setDefault(SYSTEM_DEFAULT_ID)).toBe(true);
    expect(store.defaultId()).toBe(SYSTEM_DEFAULT_ID);
  });

  it("renames an account, keeps the name without the white space at its ends and writes it, says whether it changed, and refuses with a sentence an empty name, System default and an id it keeps no account under, renaming nothing", () => {
    const runDir = folder();
    const store = new AccountStore(runDir);
    const handed = handedFolder();
    store.addHanded("Work", handed, "claude");
    expect(store.rename(1, "  Office  ")).toBe(true);
    expect(store.rename(1, "Office")).toBe(false);
    expect(store.listed()[1]).toEqual({ id: 1, name: "Office", made: false, folder: handed, signedIn: null, loginEndsAt: null, limits: [], refresh: null });
    expect(new AccountStore(runDir).account(1)?.name).toBe("Office");
    expect(() => store.rename(1, " ")).toThrow("An account needs a name.");
    expect(() => store.rename(SYSTEM_DEFAULT_ID, "Mine")).toThrow("System default keeps its name.");
    expect(() => store.rename(7, "Other")).toThrow("No account 7 is kept.");
    expect(store.listed().map((account) => account.name)).toEqual(["System default", "Office"]);
  });

  it("keeps the accounts and the default in accounts.json of the run folder, readable by the user alone, which a second store reads", () => {
    const runDir = folder();
    const handed = handedFolder();
    const store = new AccountStore(runDir);
    store.addHanded("Work", handed, "claude");
    store.setDefault(1);
    expect(statSync(join(runDir, "accounts.json")).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(join(runDir, "accounts.json"), "utf8"))).toEqual({ nextId: 2, defaultId: 1, accounts: [{ id: 1, name: "Work", adapter: "claude", folder: handed, made: false, signedIn: null, loginEndsAt: null, limits: [] }], adding: [], systemLimits: [] });
    const again = new AccountStore(runDir);
    expect(again.listed()).toEqual(store.listed());
    expect(again.defaultId()).toBe(1);
  });

  it("gives no id twice, and reads a file whose next id stands at or below an id it holds or notes under adding as one past the highest", () => {
    const runDir = folder();
    const handed = handedFolder();
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 1, defaultId: 0, accounts: [{ id: 4, name: "Work", adapter: "claude", folder: handed, made: false }] }));
    expect(new AccountStore(runDir).addHanded("Home", handedFolder(), "claude").id).toBe(5);
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 1, defaultId: 0, accounts: [{ id: 4, name: "Work", adapter: "claude", folder: handed, made: false }], adding: [6] }));
    expect(new AccountStore(runDir).addHanded("Home", handedFolder(), "claude").id).toBe(7);
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 9, defaultId: 0, accounts: [] }));
    expect(new AccountStore(runDir).addHanded("Home", handedFolder(), "claude").id).toBe(9);
  });

  it("reads a default that names no account it holds as System default, and a file that is no store, or an account in it that is no account, as no account", () => {
    const runDir = folder();
    const handed = handedFolder();
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 3, defaultId: 2, accounts: [{ id: 1, name: "Work", adapter: "claude", folder: handed, made: false }] }));
    expect(new AccountStore(runDir).defaultId()).toBe(SYSTEM_DEFAULT_ID);
    for (const text of ["not json", "[]", JSON.stringify({ nextId: 2, defaultId: 1, accounts: [{ id: 1, name: "Work", adapter: "claude", folder: 7, made: false }] }), JSON.stringify({ nextId: 2, defaultId: 1, accounts: [{ id: 0, name: "Work", adapter: "claude", folder: handed, made: false }] })]) {
      writeFileSync(join(runDir, "accounts.json"), text);
      const read = new AccountStore(runDir);
      expect(read.listed()).toEqual([SYSTEM_DEFAULT]);
      expect(read.defaultId()).toBe(SYSTEM_DEFAULT_ID);
    }
  });

  it("reads an account as made only where its folder is the one the store makes for its id, so a removal of an account the file calls made with another folder leaves that folder", () => {
    const runDir = folder();
    const handed = handedFolder();
    writeFileSync(join(handed, "settings.json"), "{}\n");
    const made = join(runDir, "accounts", "2");
    mkdirSync(made, { recursive: true });
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 3, defaultId: 0, accounts: [{ id: 1, name: "Edited", adapter: "claude", folder: handed, made: true }, { id: 2, name: "Made", adapter: "claude", folder: made, made: true }] }));
    const store = new AccountStore(runDir);
    expect(store.accounts().map((account) => account.made)).toEqual([false, true]);
    store.remove(1);
    store.remove(2);
    expect([existsSync(join(handed, "settings.json")), existsSync(made)]).toEqual([true, false]);
  });

  it("keeps the accounts in memory alone where it is given no run folder", () => {
    const store = new AccountStore(undefined);
    store.addHanded("Work", handedFolder(), "claude");
    expect(store.listed()).toHaveLength(2);
  });

  it("makes the folder of an account added with none, accounts/<id> of the run folder, empty and readable by the user alone, passes over an id whose folder stands already, and refuses an empty name and a store with no run folder, making nothing (scenario 5's folder)", () => {
    const runDir = folder();
    const store = new AccountStore(runDir);
    expect(store.addMade(" Work ", "claude")).toEqual({ id: 1, name: "Work", adapter: "claude", folder: join(runDir, "accounts", "1"), made: true, signedIn: null, loginEndsAt: null, limits: [] });
    expect(statSync(join(runDir, "accounts")).mode & 0o777).toBe(0o700);
    expect(statSync(join(runDir, "accounts", "1")).mode & 0o777).toBe(0o700);
    expect(readdirSync(join(runDir, "accounts", "1"))).toEqual([]);
    // A folder a lost accounts.json left behind is no account's to take.
    mkdirSync(join(runDir, "accounts", "2"));
    writeFileSync(join(runDir, "accounts", "2", ".claude.json"), "{}\n");
    expect(store.addMade("Home", "claude").folder).toBe(join(runDir, "accounts", "3"));
    expect(readFileSync(join(runDir, "accounts", "2", ".claude.json"), "utf8")).toBe("{}\n");
    expect(store.addHanded("Handed", handedFolder(), "claude").id).toBe(4);
    expect(() => store.addMade(" ", "claude")).toThrow("An account needs a name.");
    expect(() => new AccountStore(undefined).addMade("Work", "claude")).toThrow("This daemon keeps no run folder to make an account's folder in.");
    expect(readdirSync(join(runDir, "accounts")).sort()).toEqual(["1", "2", "3"]);
    expect(new AccountStore(runDir).account(3)).toMatchObject({ made: true, folder: join(runDir, "accounts", "3") });
  });

  it("makes the folder of an account whose first sign-in has not ended, accounts/<id> of the run folder, empty and readable by the user alone, notes its id under adding in accounts.json, which a second store reads, answers for it as no account, gives its id to no other add, passes over an id whose folder stands already, and refuses a store with no run folder, making nothing (scope item 2)", () => {
    const runDir = folder();
    const store = new AccountStore(runDir);
    expect(store.beginMade()).toEqual({ id: 1, folder: join(runDir, "accounts", "1") });
    expect(statSync(join(runDir, "accounts")).mode & 0o777).toBe(0o700);
    expect(statSync(join(runDir, "accounts", "1")).mode & 0o777).toBe(0o700);
    expect(readdirSync(join(runDir, "accounts", "1"))).toEqual([]);
    expect([store.account(1), store.holds(1), store.accounts(), store.listed()]).toEqual([undefined, false, [], [SYSTEM_DEFAULT]]);
    expect(() => store.setDefault(1)).toThrow("No account 1 is kept.");
    expect(() => store.rename(1, "Work")).toThrow("No account 1 is kept.");
    expect(() => store.remove(1)).toThrow("No account 1 is kept.");
    expect(() => store.setLogin(1, { signedIn: true, loginEndsAt: null })).toThrow("No account 1 is kept.");
    expect(JSON.parse(readFileSync(join(runDir, "accounts.json"), "utf8"))).toMatchObject({ nextId: 2, accounts: [], adding: [1] });
    expect(new AccountStore(runDir).adding()).toEqual([{ id: 1, folder: join(runDir, "accounts", "1") }]);
    // The next id passes the noted one, in this store and in a second one that reads the file.
    expect(new AccountStore(runDir).addHanded("Handed", handedFolder(), "claude").id).toBe(2);
    expect(store.addHanded("Handed", handedFolder(), "claude").id).toBe(2);
    // A folder a lost accounts.json left behind is no account's to take.
    mkdirSync(join(runDir, "accounts", "3"));
    expect(store.beginMade().id).toBe(4);
    expect(store.adding().map((noted) => noted.id)).toEqual([1, 4]);
    expect(() => new AccountStore(undefined).beginMade()).toThrow("This daemon keeps no run folder to make an account's folder in.");
    // A file of a build before this list holds no folder whose sign-in has not ended.
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 2, defaultId: 0, accounts: [] }));
    expect(new AccountStore(runDir).adding()).toEqual([]);
  });

  it("turns a folder whose first sign-in has not ended into an account Owlery made, under its id, the name it is given and the login the agent named, in one write a second store reads, and removes another such folder with everything in it, a link in it as a link, adding no account; it refuses an id it noted no folder under, keeping and removing nothing (scope items 2 and 3, the store's part)", () => {
    const runDir = folder();
    const store = new AccountStore(runDir);
    const own = handedFolder();
    store.beginMade();
    const dropped = store.beginMade().folder;
    symlinkSync(join(own, "settings.json"), join(dropped, "settings.json"));
    writeFileSync(join(dropped, ".claude.json"), "{}\n");
    const before = contents(own);
    expect(store.keepMade(1, " person@example.com ", "claude", { signedIn: true, loginEndsAt: 1_800_000_000_000 })).toEqual({ id: 1, name: "person@example.com", adapter: "claude", folder: join(runDir, "accounts", "1"), made: true, signedIn: true, loginEndsAt: 1_800_000_000_000, limits: [] });
    const read = new AccountStore(runDir);
    expect([read.account(1), read.adding().map((noted) => noted.id)]).toEqual([store.account(1), [2]]);
    store.dropMade(2);
    expect(readdirSync(join(runDir, "accounts"))).toEqual(["1"]);
    expect(contents(own)).toEqual(before);
    expect([store.adding(), new AccountStore(runDir).adding(), store.accounts().map((account) => account.id)]).toEqual([[], [], [1]]);
    // An account's id, an id dropped and one never noted take neither act.
    for (const id of [1, 2, 7]) {
      expect(() => store.keepMade(id, "Again", "claude", { signedIn: null, loginEndsAt: null })).toThrow(`No folder ${String(id)} waits on its first sign-in.`);
      expect(() => store.dropMade(id)).toThrow(`No folder ${String(id)} waits on its first sign-in.`);
    }
    expect([readdirSync(join(runDir, "accounts")), store.accounts().map((account) => account.name)]).toEqual([["1"], ["person@example.com"]]);
  });

  it("reads under adding only an id that is a whole number above System default's and no account's, so an edited accounts.json never has the store remove a folder but accounts/<id> of the run folder, nor one an account keeps (scenario H's store)", () => {
    const runDir = folder();
    const handed = handedFolder();
    const made = join(runDir, "accounts", "1");
    mkdirSync(made, { recursive: true });
    writeFileSync(join(made, ".claude.json"), "{}\n");
    mkdirSync(join(runDir, "outside"));
    mkdirSync(join(runDir, "accounts", "refresh"));
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 3, defaultId: 0, accounts: [{ id: 1, name: "Made", adapter: "claude", folder: made, made: true }, { id: 2, name: "Handed", adapter: "claude", folder: handed, made: false }], adding: [1, 2, 0, -1, 1.5, "../outside", "refresh", 3, 3] }));
    const store = new AccountStore(runDir);
    expect(store.adding()).toEqual([{ id: 3, folder: join(runDir, "accounts", "3") }]);
    for (const id of [1, 2, 0, -1, 1.5, "../outside", "refresh"] as number[]) {
      expect(() => store.dropMade(id)).toThrow(`No folder ${String(id)} waits on its first sign-in.`);
      expect(() => store.keepMade(id, "Again", "claude", { signedIn: null, loginEndsAt: null })).toThrow(`No folder ${String(id)} waits on its first sign-in.`);
    }
    expect([readFileSync(join(made, ".claude.json"), "utf8"), existsSync(join(runDir, "outside")), existsSync(join(runDir, "accounts", "refresh")), contents(handed)]).toEqual(["{}\n", true, true, { "settings.json": "{}\n" }]);
    expect(store.accounts().map((account) => [account.id, account.made])).toEqual([
      [1, true],
      [2, false],
    ]);
  });

  it("gives an added account whose name another account holds, System default among them, that name with the first number from 2 in brackets that no account's name holds, and gives none at a rename (scope items 4 and 5, the store's part)", () => {
    const store = new AccountStore(folder());
    expect(store.addHanded("person@example.com", handedFolder(), "claude").name).toBe("person@example.com");
    store.beginMade();
    expect(store.keepMade(2, "person@example.com", "claude", { signedIn: true, loginEndsAt: null }).name).toBe("person@example.com (2)");
    expect(store.addHanded(" person@example.com ", handedFolder(), "claude").name).toBe("person@example.com (3)");
    expect(store.rename(2, "Other")).toBe(true);
    expect(store.addHanded("person@example.com", handedFolder(), "claude").name).toBe("person@example.com (2)");
    expect(store.addHanded("System default", handedFolder(), "claude").name).toBe("System default (2)");
    expect(store.rename(2, "person@example.com")).toBe(true);
    expect(store.listed().map((account) => account.name)).toEqual(["System default", "person@example.com", "person@example.com", "person@example.com (3)", "person@example.com (2)", "System default (2)"]);
  });

  it("keeps the agent's last word on an account's login, writes it, says whether it changed, refuses an id it keeps no account under, and reads a file of a build before sign-in as no word", () => {
    const runDir = folder();
    const store = new AccountStore(runDir);
    const handed = handedFolder();
    store.addHanded("Work", handed, "claude");
    expect(store.setLogin(1, { signedIn: true, loginEndsAt: 1_800_000_000_000 })).toBe(true);
    expect(store.setLogin(1, { signedIn: true, loginEndsAt: 1_800_000_000_000 })).toBe(false);
    expect(new AccountStore(runDir).listed()[1]).toEqual({ id: 1, name: "Work", made: false, folder: handed, signedIn: true, loginEndsAt: 1_800_000_000_000, limits: [], refresh: null });
    expect(store.setLogin(1, { signedIn: false, loginEndsAt: null })).toBe(true);
    expect(new AccountStore(runDir).account(1)).toMatchObject({ signedIn: false, loginEndsAt: null });
    expect(() => store.setLogin(SYSTEM_DEFAULT_ID, { signedIn: true, loginEndsAt: null })).toThrow("No account 0 is kept.");
    expect(() => store.setLogin(7, { signedIn: true, loginEndsAt: null })).toThrow("No account 7 is kept.");
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 2, defaultId: 0, accounts: [{ id: 1, name: "Work", adapter: "claude", folder: handed, made: false }] }));
    expect(new AccountStore(runDir).account(1)).toMatchObject({ signedIn: null, loginEndsAt: null });
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 2, defaultId: 0, accounts: [{ id: 1, name: "Work", adapter: "claude", folder: handed, made: false, signedIn: "yes", loginEndsAt: "soon" }] }));
    expect(new AccountStore(runDir).account(1)).toMatchObject({ signedIn: null, loginEndsAt: null });
  });

  it("keeps the last limit value of each window an account's sessions hand over, System default's among them, with its time, writes them, keeps none for an id it keeps no account under, and reads a file of a build before usage, or a value in it of another form, as none (scenario 15's store)", () => {
    const runDir = folder();
    const store = new AccountStore(runDir);
    const handed = handedFolder();
    store.addHanded("Work", handed, "claude");
    const near = { status: "near", used: 0.8, resetsAt: 1_800_000_000_000, window: "five_hour" } as const;
    const week = { status: "ok", used: null, resetsAt: null, window: "seven_day" } as const;
    const bare = { status: null, used: null, resetsAt: null, window: null } as const;
    expect(store.setLimit(1, near, 10)).toBe(true);
    expect(store.setLimit(1, week, 20)).toBe(true);
    // A later value of a window takes its place, and the window keeps its place among the others.
    expect(store.setLimit(1, { ...near, status: "reached", used: 1 }, 30)).toBe(true);
    expect(store.setLimit(SYSTEM_DEFAULT_ID, bare, 40)).toBe(true);
    expect(store.setLimit(7, near, 50)).toBe(false);
    const read = new AccountStore(runDir).listed();
    expect(read.map((account) => account.limits)).toEqual([
      [{ ...bare, at: 40 }],
      [
        { ...near, status: "reached", used: 1, at: 30 },
        { ...week, at: 20 },
      ],
    ]);
    expect(read.map((account) => account.refresh)).toEqual([null, null]);
    expect(store.listed((id) => (id === 1 ? { state: "running", startedAt: 5 } : null)).map((account) => account.refresh)).toEqual([null, { state: "running", startedAt: 5 }]);
    const work = { id: 1, name: "Work", adapter: "claude", folder: handed, made: false, signedIn: null, loginEndsAt: null };
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 2, defaultId: 0, accounts: [{ ...work, limits: [{ ...bare, status: "soon", at: 1 }, { ...bare, used: "most", at: 2 }, { ...week, at: 3 }, "full"] }], systemLimits: "none" }));
    expect(new AccountStore(runDir).listed().map((account) => account.limits)).toEqual([[], [{ ...week, at: 3 }]]);
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 2, defaultId: 0, accounts: [work] }));
    expect(new AccountStore(runDir).listed().map((account) => account.limits)).toEqual([[], []]);
  });

  it("gives a refresh the folder accounts/refresh of the run folder, empty and readable by the user alone, which no account's folder is, and refuses with a sentence where it keeps no run folder", () => {
    const runDir = folder();
    const store = new AccountStore(runDir);
    const refresh = store.refreshFolder();
    expect(refresh).toBe(join(runDir, "accounts", "refresh"));
    expect(statSync(refresh).mode & 0o777).toBe(0o700);
    expect(readdirSync(refresh)).toEqual([]);
    expect(store.refreshFolder()).toBe(refresh);
    expect(store.addMade("Work", "claude").folder).toBe(join(runDir, "accounts", "1"));
    expect(() => new AccountStore(undefined).refreshFolder()).toThrow("This daemon keeps no run folder to run a refresh in.");
  });

  it("removes an account with the folder it made, a link in it as a link, leaves a folder handed over and every file in it, names System default the default again where the default was removed, and refuses System default and an id it keeps no account under (the store's half of scenarios 7 and 13)", () => {
    const runDir = folder();
    const store = new AccountStore(runDir);
    const own = handedFolder();
    const handed = handedFolder();
    const made = store.addMade("Work", "claude").folder;
    symlinkSync(join(own, "settings.json"), join(made, "settings.json"));
    writeFileSync(join(made, ".claude.json"), "{}\n");
    store.addHanded("Handed", handed, "claude");
    store.setDefault(1);
    const before = { own: contents(own), handed: contents(handed) };
    expect(store.remove(1)).toBe(true);
    expect(statSync(join(runDir, "accounts")).isDirectory()).toBe(true);
    expect(readdirSync(join(runDir, "accounts"))).toEqual([]);
    expect(store.defaultId()).toBe(SYSTEM_DEFAULT_ID);
    expect(store.remove(2)).toBe(false);
    expect({ own: contents(own), handed: contents(handed) }).toEqual(before);
    expect(new AccountStore(runDir).listed()).toEqual([SYSTEM_DEFAULT]);
    expect(() => store.remove(SYSTEM_DEFAULT_ID)).toThrow("System default is never removed.");
    expect(() => store.remove(2)).toThrow("No account 2 is kept.");
  });
});

/** A client of the daemon that keeps every message it receives. */
async function client(url: string) {
  const socket = new WebSocket(url);
  const messages: ServerMessage[] = [];
  socket.on("message", (raw) => messages.push(JSON.parse(String(raw)) as ServerMessage));
  await new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
  socket.send(JSON.stringify({ type: "hello", token: TOKEN }));
  cleanups.push(() => socket.close());
  const until = async <T>(find: () => T | undefined, ms = 5000): Promise<T> => {
    const end = Date.now() + ms;
    for (;;) {
      const found = find();
      if (found !== undefined) return found;
      if (Date.now() > end) throw new Error(`timed out; got ${JSON.stringify(messages)}`);
      await new Promise((r) => setTimeout(r, 20));
    }
  };
  let nextRequest = 1000;
  /** Sends a request and gives the daemon's answer to it: its `done`, its `error` or its `asked`. */
  const request = (message: object) => {
    const requestId = nextRequest++;
    socket.send(JSON.stringify({ ...message, requestId }));
    type Answer = Extract<ServerMessage, { type: "done" | "error" | "asked" | "workItemCreated" }>;
    return until(() => messages.find((m): m is Answer => (m.type === "done" || m.type === "error" || m.type === "asked" || m.type === "workItemCreated") && m.requestId === requestId));
  };
  return {
    messages,
    until,
    request,
    send: (message: object) => socket.send(JSON.stringify(message)),
    message: <K extends ServerMessage["type"]>(type: K, where: (m: Extract<ServerMessage, { type: K }>) => boolean = () => true) =>
      until(() => messages.find((m): m is Extract<ServerMessage, { type: K }> => m.type === type && where(m as Extract<ServerMessage, { type: K }>))),
  };
}

type Client = Awaited<ReturnType<typeof client>>;

/** A daemon on a run folder of its own, with a client that has its `ready`. */
async function daemon(options: Partial<DaemonOptions> = {}) {
  const root = folder("owlery-accounts-root-");
  const runDir = join(root, "run");
  mkdirSync(runDir);
  const d = new Daemon({
    token: TOKEN,
    paneKinds: PANE_KINDS,
    roleAdapter: fakeAdapter(),
    commandFor: () => ({ command: "/bin/sh", args: ["-c", "sleep 30"], env: {} }),
    runDir,
    worktreesRoot: join(root, "worktrees"),
    ...options,
  });
  const port = await d.listen(0);
  cleanups.push(() => d.close());
  const c = await client(`ws://127.0.0.1:${String(port)}`);
  const ready = await c.message("ready");
  return { d, c, ready, runDir: options.runDir ?? runDir, url: `ws://127.0.0.1:${String(port)}` };
}

/** A work item in a repository of its own, and that repository's id. */
async function workItemIn(c: Client): Promise<{ workItemId: number; repositoryId: number }> {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const answer = await c.request({ type: "createWorkItem", repo: made.repo, title: "A work item", kind: "shell", cols: 80, rows: 24 });
  if (answer.type !== "workItemCreated") throw new Error(`no work item: ${JSON.stringify(answer)}`);
  return { workItemId: answer.workItem.id, repositoryId: answer.workItem.repoId };
}

/** Asks a prompt in the work item, with the session's own account where one is given, and gives the session once it has ended. */
async function asked(c: Client, workItemId: number, accountId?: number): Promise<HeadlessInfo> {
  const answer = await c.request({ type: "ask", workItemId, prompt: "Who am I?", ...(accountId === undefined ? {} : { accountId }) });
  if (answer.type !== "asked") throw new Error(`no session: ${JSON.stringify(answer)}`);
  return (await c.message("headless", (m) => m.headless.id === answer.headless.id && m.headless.state !== "working")).headless;
}

/** An adapter that notes the options of each start, and starts the fake adapter's session. */
function noted(inner: RoleAdapter = fakeAdapter()): { adapter: RoleAdapter; started: object[] } {
  const started: object[] = [];
  return { adapter: { ...inner, start: (options, listener) => (started.push(options), inner.start(options, listener)) }, started };
}

describe("the daemon's accounts", () => {
  it("launches each work item's session with the folder of its repository's account, and the session and its entry of the ledger name that account (scenario 1)", async () => {
    const { c } = await daemon();
    const work = handedFolder();
    const home = handedFolder();
    expect(await c.request({ type: "addAccount", name: "Work", folder: work })).toMatchObject({ type: "done" });
    expect(await c.request({ type: "addAccount", name: "Home", folder: home })).toMatchObject({ type: "done" });
    const one = await workItemIn(c);
    const two = await workItemIn(c);
    expect(await c.request({ type: "setRepository", id: one.repositoryId, accountId: 1 })).toMatchObject({ type: "done" });
    expect(await c.request({ type: "setRepository", id: two.repositoryId, accountId: 2 })).toMatchObject({ type: "done" });
    const first = await asked(c, one.workItemId);
    const second = await asked(c, two.workItemId);
    expect([first.accountId, second.accountId]).toEqual([1, 2]);
    expect(first.answer).toBe(`You asked: "Who am I?" under the config folder ${work}`);
    expect(second.answer).toBe(`You asked: "Who am I?" under the config folder ${home}`);
    for (const [workItemId, account] of [
      [one.workItemId, { id: 1, name: "Work" }],
      [two.workItemId, { id: 2, name: "Home" }],
    ] as const) {
      c.send({ type: "readLedger", requestId: workItemId, workItemId });
      const ledger = await c.message("ledger", (m) => m.workItemId === workItemId);
      expect(ledger.entries.map((entry) => entry.account)).toEqual([account]);
    }
    expect(contents(work)).toEqual({ "settings.json": "{}\n" });
    expect(contents(home)).toEqual({ "settings.json": "{}\n" });
  });

  it("takes the session's own account, then the work item's, then the repository's, then the default, and the next one above once a nearer setting is cleared (scenario 2)", async () => {
    const { adapter, started } = noted();
    const { c } = await daemon({ roleAdapter: adapter });
    const folders = [handedFolder(), handedFolder(), handedFolder(), handedFolder()];
    for (const [index, name] of ["A", "B", "C", "D"].entries()) await c.request({ type: "addAccount", name, folder: folders[index] });
    const { workItemId, repositoryId } = await workItemIn(c);
    await c.request({ type: "setDefaultAccount", id: 4 });
    await c.request({ type: "setRepository", id: repositoryId, accountId: 1 });
    await c.request({ type: "setWorkItem", id: workItemId, accountId: 2 });
    const launched = async (own?: number): Promise<number | null | undefined> => (await asked(c, workItemId, own)).accountId;
    expect(await launched(3)).toBe(3);
    expect(await launched()).toBe(2);
    await c.request({ type: "setWorkItem", id: workItemId, accountId: null });
    expect(await launched()).toBe(1);
    await c.request({ type: "setRepository", id: repositoryId, accountId: null });
    expect(await launched()).toBe(4);
    await c.request({ type: "setDefaultAccount", id: SYSTEM_DEFAULT_ID });
    expect(await launched()).toBe(SYSTEM_DEFAULT_ID);
    // System default set nearer wins over an account set further out, and passes no folder.
    await c.request({ type: "setRepository", id: repositoryId, accountId: 1 });
    expect(await launched(SYSTEM_DEFAULT_ID)).toBe(SYSTEM_DEFAULT_ID);
    expect(started.map((options) => (options as { accountDir?: string }).accountDir)).toEqual([folders[2], folders[1], folders[0], folders[3], undefined, undefined]);
    expect(started.slice(-2).every((options) => !("accountDir" in options))).toBe(true);
  });

  it("carries the accounts and the default in `ready`, and sends every client the two in `accounts` after each change, after its `done`, and the settings of a repository and a work item in the lists", async () => {
    const { c, ready, url } = await daemon();
    expect(ready).toMatchObject({ accounts: [SYSTEM_DEFAULT], defaultAccountId: SYSTEM_DEFAULT_ID });
    const work = handedFolder();
    await c.request({ type: "addAccount", name: "Work", folder: work });
    // The daemon sends with each account where it keeps its conversations, and neither folder holds any.
    const listed = [{ ...SYSTEM_DEFAULT, conversations: null }, { id: 1, name: "Work", made: false, folder: work, signedIn: null, loginEndsAt: null, limits: [], refresh: null, conversations: null }];
    expect(await c.message("accounts")).toEqual({ type: "accounts", accounts: listed, defaultAccountId: SYSTEM_DEFAULT_ID, refreshesUsage: true });
    await c.request({ type: "setDefaultAccount", id: 1 });
    expect(await c.message("accounts", (m) => m.defaultAccountId === 1)).toEqual({ type: "accounts", accounts: listed, defaultAccountId: 1, refreshesUsage: true });
    const order = c.messages.flatMap((m) => (m.type === "done" || m.type === "accounts" ? [m.type] : []));
    expect(order).toEqual(["done", "accounts", "done", "accounts"]);
    const { workItemId, repositoryId } = await workItemIn(c);
    expect((await c.message("inbox", (m) => m.workItems.length === 1)).workItems[0]?.accountId).toBeNull();
    await c.request({ type: "setRepository", id: repositoryId, accountId: 1 });
    await c.request({ type: "setWorkItem", id: workItemId, accountId: SYSTEM_DEFAULT_ID });
    const inbox = await c.message("inbox", (m) => m.workItems[0]?.accountId === SYSTEM_DEFAULT_ID);
    expect(inbox.repositories[0]?.accountId).toBe(1);
    const later = await client(url);
    expect(await later.message("ready")).toMatchObject({ accounts: listed, defaultAccountId: 1 });
  });

  it("refuses with a sentence a folder that is not absolute, no folder or already an account's, and an id it keeps no account under at every request that names one, and changes nothing at any of them (the adding half of scenario 7)", async () => {
    const { c, runDir } = await daemon();
    const work = handedFolder();
    await c.request({ type: "addAccount", name: "Work", folder: work });
    const { workItemId, repositoryId } = await workItemIn(c);
    expect(await c.request({ type: "addAccount", name: "Relative", folder: "work" })).toMatchObject({ type: "error", message: 'The folder of an account is an absolute path, and "work" is not one.' });
    expect(await c.request({ type: "addAccount", name: "Missing", folder: join(work, "missing") })).toMatchObject({ type: "error", message: `No folder stands at ${join(work, "missing")}.` });
    expect(await c.request({ type: "addAccount", name: "Again", folder: work })).toMatchObject({ type: "error", message: `The folder ${work} is already the account "Work".` });
    // With no folder the daemon makes one, and this adapter signs no account in.
    expect(await c.request({ type: "addAccount", name: "No folder" })).toMatchObject({ type: "error", message: "This agent signs no account in here, so Owlery makes no folder for one. Use an existing folder." });
    expect(await c.request({ type: "setDefaultAccount", id: 9 })).toMatchObject({ type: "error", message: "No account 9 is kept." });
    expect(await c.request({ type: "setRepository", id: repositoryId, accountId: 9, name: "Renamed" })).toMatchObject({ type: "error", message: "No account 9 is kept." });
    expect(await c.request({ type: "setWorkItem", id: workItemId, accountId: 9, pinned: true })).toMatchObject({ type: "error", message: "No account 9 is kept." });
    expect(await c.request({ type: "setWorkItem", id: workItemId, accountId: "1" })).toMatchObject({ type: "error", message: "An account is named by its id, or null for none." });
    expect(await c.request({ type: "ask", workItemId, prompt: "Q", accountId: 9 })).toMatchObject({ type: "error", message: "No account 9 is kept." });
    expect(JSON.parse(readFileSync(join(runDir, "accounts.json"), "utf8")).accounts).toHaveLength(1);
    const stored = JSON.parse(readFileSync(join(runDir, "repositories.json"), "utf8")).repositories[0];
    expect(stored).toMatchObject({ name: null, accountId: null });
    expect(stored.workItems[0]).toMatchObject({ pinned: false, accountId: null });
    expect(c.messages.some((m) => m.type === "headless")).toBe(false);
  });

  it("gives the folder only to an adapter that declares accounts: one that does not launches the session under none, whatever the nearest setting names, so it carries no account, its ledger entry names none, and its limit values are kept as System default's (scope item 8)", async () => {
    const limit = { status: "ok", used: 0.1, resetsAt: null, window: "five_hour" } as const;
    const { adapter, started } = noted(fakeAdapter({ features: ["role-tools", "permission-requests"], limits: () => [limit] }));
    const { c, runDir } = await daemon({ roleAdapter: adapter, now: () => 1_000_000 });
    await c.request({ type: "addAccount", name: "Work", folder: handedFolder() });
    const { workItemId } = await workItemIn(c);
    await c.request({ type: "setWorkItem", id: workItemId, accountId: 1 });
    const session = await asked(c, workItemId);
    expect([session.answer, session.accountId]).toEqual(['You asked: "Who am I?"', null]);
    expect(started).toHaveLength(1);
    expect("accountDir" in started[0]!).toBe(false);
    c.send({ type: "readLedger", requestId: 78, workItemId });
    expect((await c.message("ledger", (m) => m.workItemId === workItemId)).entries.map((entry) => entry.account)).toEqual([null]);
    expect(new AccountStore(runDir).listed().map((account) => account.limits)).toEqual([[{ ...limit, at: 1_000_000 }], []]);
  });

  it("sends with each account the real path of the folder its agent keeps its conversations in, as the adapter reads it each time the accounts are sent, and null where the folder holds none and for System default while the adapter has found no folder (scenario 9)", async () => {
    const own = folder();
    mkdirSync(join(own, "projects"));
    const linked = handedFolder();
    symlinkSync(join(own, "projects"), join(linked, "projects"));
    const bare = handedFolder();
    const { c } = await daemon({ roleAdapter: fakeAdapter({ defaultLoginFolder: own }) });
    await c.request({ type: "addAccount", name: "Linked", folder: linked });
    await c.request({ type: "addAccount", name: "Bare", folder: bare });
    const kept = realpathSync(join(own, "projects"));
    expect((await c.message("accounts", (m) => m.accounts.length === 3)).accounts.map((account) => account.conversations)).toEqual([kept, kept, null]);
    mkdirSync(join(bare, "projects"));
    await c.request({ type: "renameAccount", id: 2, name: "Bare no more" });
    expect((await c.message("accounts", (m) => m.accounts[2]?.name === "Bare no more")).accounts[2]?.conversations).toBe(realpathSync(join(bare, "projects")));
    const unfound = await daemon({ roleAdapter: fakeAdapter() });
    expect(unfound.ready.accounts?.[0]?.conversations).toBeNull();
  });

  it("sends the accounts again once the adapter's lookup finds System default's folder after a window's ready, so the window can offer a change to it (scenario 9)", async () => {
    const own = folder();
    mkdirSync(join(own, "projects"));
    let found: string | null = null;
    let answer = (): void => {};
    const looked = new Promise<void>((resolve) => (answer = resolve));
    const adapter: RoleAdapter = { ...fakeAdapter(), defaultLoginFolder: () => found, notice: () => looked.then(() => null) };
    const { c, ready } = await daemon({ roleAdapter: adapter });
    expect(ready.accounts?.[0]?.conversations).toBeNull();
    found = own;
    answer();
    const sent = await c.message("accounts", (m) => m.accounts[0]?.conversations !== null);
    expect(sent.accounts[0]?.conversations).toBe(realpathSync(join(own, "projects")));
  });

  it("renames an account at a request, answers before it sends every client the accounts, refuses an empty name, System default and an id it keeps none of with a sentence, and leaves a ledger entry written before the rename with the name it had (the rename of scenario 11)", async () => {
    const { c } = await daemon();
    await c.request({ type: "addAccount", name: "Work", folder: handedFolder() });
    const { workItemId } = await workItemIn(c);
    await c.request({ type: "setWorkItem", id: workItemId, accountId: 1 });
    await asked(c, workItemId);
    const before = c.messages.length;
    expect(await c.request({ type: "renameAccount", id: 1, name: " Office " })).toMatchObject({ type: "done" });
    expect((await c.message("accounts", (m) => m.accounts[1]?.name === "Office")).accounts.map((account) => account.name)).toEqual(["System default", "Office"]);
    expect(c.messages.slice(before).flatMap((m) => (m.type === "done" || m.type === "accounts" ? [m.type] : []))).toEqual(["done", "accounts"]);
    expect(await c.request({ type: "renameAccount", id: 1, name: "" })).toMatchObject({ type: "error", message: "An account needs a name." });
    expect(await c.request({ type: "renameAccount", id: SYSTEM_DEFAULT_ID, name: "Mine" })).toMatchObject({ type: "error", message: "System default keeps its name." });
    expect(await c.request({ type: "renameAccount", id: 9, name: "Other" })).toMatchObject({ type: "error", message: "No account 9 is kept." });
    expect(await c.request({ type: "renameAccount", id: 1 })).toMatchObject({ type: "error", message: "An account is renamed by its id and a name." });
    c.send({ type: "readLedger", requestId: 77, workItemId });
    expect((await c.message("ledger", (m) => m.workItemId === workItemId)).entries.map((entry) => entry.account)).toEqual([{ id: 1, name: "Work" }]);
  });

  it("launches a pane under the session's own account, then the work item's, then the repository's, then the default, names that account on the pane, gives the pane's command that account's folder, and under System default no folder of an account and the default login's folder as the one Claude Code reads, and refuses a start that names an account it keeps none of, starting nothing (the pane's half of scenarios 2 and 4)", async () => {
    const asked: { kind: string; accountDir: string | null; configDir: string | null }[] = [];
    const { c } = await daemon({
      roleAdapter: fakeAdapter({ defaultLoginFolder: "/Users/person/.claude" }),
      commandFor: (kind, _id, start) => {
        asked.push({ kind, accountDir: start.accountDir, configDir: start.configDir });
        return { command: "/bin/sh", args: ["-c", "sleep 30"], env: {} };
      },
    });
    const work = handedFolder();
    const home = handedFolder();
    await c.request({ type: "addAccount", name: "Work", folder: work });
    await c.request({ type: "addAccount", name: "Home", folder: home });
    const { workItemId, repositoryId } = await workItemIn(c);
    const started = async (kind: "shell" | "claude", accountId?: number) => {
      const requestId = 500 + asked.length;
      c.send({ type: "start", kind, cols: 80, rows: 24, requestId, workItemId, ...(accountId === undefined ? {} : { accountId }) });
      return (await c.message("started", (m) => m.requestId === requestId)).session;
    };
    await c.request({ type: "setRepository", id: repositoryId, accountId: 1 });
    expect((await started("claude")).accountId).toBe(1);
    await c.request({ type: "setWorkItem", id: workItemId, accountId: 2 });
    expect((await started("shell")).accountId).toBe(2);
    expect((await started("claude", SYSTEM_DEFAULT_ID)).accountId).toBe(SYSTEM_DEFAULT_ID);
    expect((await started("claude", 1)).accountId).toBe(1);
    expect(asked).toEqual([
      // The pane the work item was created with, under the default.
      { kind: "shell", accountDir: null, configDir: "/Users/person/.claude" },
      { kind: "claude", accountDir: work, configDir: work },
      { kind: "shell", accountDir: home, configDir: home },
      { kind: "claude", accountDir: null, configDir: "/Users/person/.claude" },
      { kind: "claude", accountDir: work, configDir: work },
    ]);
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 900, workItemId, accountId: 9 });
    expect(await c.message("error", (m) => m.requestId === 900)).toMatchObject({ message: "No account 9 is kept." });
    expect(asked).toHaveLength(5);
  });

  it("launches a pane of a kind that declares no accounts under none, whatever the nearest setting names, and names no account on it", async () => {
    const asked: { kind: string; accountDir: string | null }[] = [];
    const { c } = await daemon({
      paneKinds: [{ ...PANE_KINDS[0]!, accounts: false }, PANE_KINDS[1]!],
      roleAdapter: fakeAdapter({ defaultLoginFolder: "/Users/person/.claude" }),
      commandFor: (kind, _id, start) => {
        asked.push({ kind, accountDir: start.accountDir });
        return { command: "/bin/sh", args: ["-c", "sleep 30"], env: {} };
      },
    });
    const work = handedFolder();
    await c.request({ type: "addAccount", name: "Work", folder: work });
    const { workItemId, repositoryId } = await workItemIn(c);
    await c.request({ type: "setRepository", id: repositoryId, accountId: 1 });
    for (const [requestId, kind] of [[601, "shell"], [602, "claude"]] as const) c.send({ type: "start", kind, cols: 80, rows: 24, requestId, workItemId });
    const shell = (await c.message("started", (m) => m.requestId === 601)).session;
    const claude = (await c.message("started", (m) => m.requestId === 602)).session;
    expect([shell.accountId, claude.accountId]).toEqual([null, 1]);
    expect(asked.slice(-2)).toEqual([
      { kind: "shell", accountDir: null },
      { kind: "claude", accountDir: work },
    ]);
  });

  it("clears at its start a repository's and a work item's setting that names an account it keeps none of, so an account added later under a freed id takes no setting, and keeps a setting that names one it keeps", async () => {
    const first = await daemon();
    await first.c.request({ type: "addAccount", name: "Work", folder: handedFolder() });
    await first.c.request({ type: "addAccount", name: "Home", folder: handedFolder() });
    const one = await workItemIn(first.c);
    const two = await workItemIn(first.c);
    await first.c.request({ type: "setRepository", id: one.repositoryId, accountId: 1 });
    await first.c.request({ type: "setWorkItem", id: one.workItemId, accountId: 1 });
    await first.c.request({ type: "setRepository", id: two.repositoryId, accountId: 2 });
    await first.d.close();
    // The account 1 is gone from the file, as a person's edit or an older build's would leave it.
    const file = join(first.runDir, "accounts.json");
    const kept = JSON.parse(readFileSync(file, "utf8")) as { accounts: { id: number }[] };
    writeFileSync(file, JSON.stringify({ ...kept, nextId: 1, accounts: kept.accounts.filter((account) => account.id !== 1) }));
    const second = await daemon({ runDir: first.runDir });
    const [repositoryOne, repositoryTwo] = second.ready.repositories;
    expect([repositoryOne?.accountId, repositoryTwo?.accountId]).toEqual([null, 2]);
    expect(second.ready.workItems.find((item) => item.id === one.workItemId)?.accountId).toBeNull();
    const stored = JSON.parse(readFileSync(join(first.runDir, "repositories.json"), "utf8")).repositories;
    expect(stored.map((repository: { accountId: unknown }) => repository.accountId)).toEqual([null, 2]);
    expect(stored[0].workItems[0].accountId).toBeNull();
  });
});

describe("a refresh of an account's usage", () => {
  /** The accounts message after `from` in which `where` holds of the account `id`. */
  const accountsAfter = (c: Client, from: number, id: number, where: (account: Account) => boolean) => c.until(() => c.messages.slice(from).find((m): m is Extract<ServerMessage, { type: "accounts" }> => m.type === "accounts" && m.accounts.some((account) => account.id === id && where(account))));

  it("starts on the press one session under the account's folder, with no role, as a refresh, in the daemon's empty folder, keeps the values it hands over with their time in accounts.json, says the refresh ran and then how it ended with its cost, and writes nothing of it in the ledger or the account's folder; System default's runs under the folder the adapter finds (scenario 15)", async () => {
    let now = 1_000_000;
    const limits = [{ status: "near", used: 0.42, resetsAt: 2_000_000, window: "five_hour" }] as const;
    const { adapter, started } = noted(fakeAdapter({ limits: (_prompt, _role, refresh) => (refresh ? [...limits] : []), usage: () => ({ costUsd: 0.003, converted: true, models: [] }) }));
    const { c, ready, runDir } = await daemon({ roleAdapter: adapter, now: () => now });
    expect(ready).toMatchObject({ refreshesUsage: true });
    const work = handedFolder();
    await c.request({ type: "addAccount", name: "Work", folder: work });
    const from = c.messages.length;
    now = 1_500_000;
    expect(await c.request({ type: "refreshUsage", id: 1 })).toMatchObject({ type: "done" });
    expect((await accountsAfter(c, from, 1, (account) => account.refresh !== null)).accounts[1]?.refresh).toEqual({ state: "running", startedAt: 1_500_000 });
    const ended = (await accountsAfter(c, from, 1, (account) => account.refresh?.state === "ended")).accounts[1];
    expect(ended).toMatchObject({ limits: [{ ...limits[0], at: 1_500_000 }], refresh: { state: "ended", at: 1_500_000, handed: 1, usage: { costUsd: 0.003, converted: true, models: [] }, error: null } });
    expect(started).toEqual([{ prompt: REFRESH_PROMPT, cwd: join(runDir, "accounts", "refresh"), refresh: true, accountDir: work }]);
    expect(readdirSync(join(runDir, "accounts", "refresh"))).toEqual([]);
    expect(new AccountStore(runDir).listed()[1]?.limits).toEqual([{ ...limits[0], at: 1_500_000 }]);
    expect(contents(work)).toEqual({ "settings.json": "{}\n" });
    expect(existsSync(join(runDir, "ledger.jsonl"))).toBe(false);
    // System default has no folder: its session is given none, and runs under the one the adapter's agent finds.
    expect(await c.request({ type: "refreshUsage", id: SYSTEM_DEFAULT_ID })).toMatchObject({ type: "done" });
    await accountsAfter(c, from, SYSTEM_DEFAULT_ID, (account) => account.refresh?.state === "ended");
    expect(started[1]).toEqual({ prompt: REFRESH_PROMPT, cwd: join(runDir, "accounts", "refresh"), refresh: true });
  });

  it("says where the CLI handed over no value, that a refresh which gives no result within its limit was stopped, and why a refresh failed, keeping no number of any; and refuses a call its session asks for (scenario 15)", async () => {
    // A session that asks for a call is told no, and goes on to its result.
    const { c } = await daemon({ roleAdapter: fakeAdapter({ usage: () => null, asks: () => [{ tool: "Bash", action: "run", path: null, text: "ls" }] }) });
    await c.request({ type: "addAccount", name: "Work", folder: handedFolder() });
    const from = c.messages.length;
    await c.request({ type: "refreshUsage", id: 1 });
    expect((await accountsAfter(c, from, 1, (account) => account.refresh?.state === "ended")).accounts[1]).toMatchObject({ limits: [], refresh: { state: "ended", handed: 0, usage: null, error: null } });
    const slow = await daemon({ roleAdapter: fakeAdapter({ delayMs: 2000, limits: () => [{ status: "ok", used: 0.1, resetsAt: null, window: null }] }), refreshLimitMs: 100 });
    const later = slow.c.messages.length;
    await slow.c.request({ type: "refreshUsage", id: SYSTEM_DEFAULT_ID });
    expect((await accountsAfter(slow.c, later, SYSTEM_DEFAULT_ID, (account) => account.refresh?.state === "ended")).accounts[0]).toMatchObject({ limits: [], refresh: { state: "ended", handed: 0, error: "The refresh gave no result within a minute and was stopped." } });
    for (const [fail, error] of [
      ["result", "the fake adapter was told to fail"],
      ["exit", "The refresh's session exited with code 1 and gave no result."],
      ["start", "the fake adapter was told not to start"],
    ] as const) {
      const failing = await daemon({ roleAdapter: fakeAdapter({ fail }) });
      const at = failing.c.messages.length;
      expect(await failing.c.request({ type: "refreshUsage", id: SYSTEM_DEFAULT_ID })).toMatchObject({ type: "done" });
      expect((await accountsAfter(failing.c, at, SYSTEM_DEFAULT_ID, (account) => account.refresh?.state === "ended")).accounts[0]?.refresh).toMatchObject({ handed: 0, error });
    }
  });

  it("gives a folder Owlery made its missing names before the refresh starts, refuses through an adapter that declares no accounts a refresh of a named account and runs one of System default with no folder, and stops a refresh that runs at the daemon's close (scope item 13)", async () => {
    const furnished: string[] = [];
    const logins: AccountLogins = { furnish: (at) => void furnished.push(at), signIn: () => Promise.reject(new Error("no")), status: () => Promise.reject(new Error("no")), signOut: () => Promise.resolve() };
    const { adapter, started } = noted(fakeAdapter({ logins }));
    const { c, runDir } = await daemon({ roleAdapter: adapter });
    await c.request({ type: "addAccount", name: "Made" });
    furnished.length = 0;
    const from = c.messages.length;
    await c.request({ type: "refreshUsage", id: 1 });
    await accountsAfter(c, from, 1, (account) => account.refresh?.state === "ended");
    expect(furnished).toEqual([join(runDir, "accounts", "1")]);
    expect(started).toEqual([expect.objectContaining({ refresh: true, accountDir: join(runDir, "accounts", "1") })]);
    const bare = noted(fakeAdapter({ features: ["limit-refresh"] }));
    const plain = await daemon({ roleAdapter: bare.adapter });
    await plain.c.request({ type: "addAccount", name: "Work", folder: handedFolder() });
    expect(await plain.c.request({ type: "refreshUsage", id: 1 })).toMatchObject({ type: "error", message: "The fake adapter launches no session under an account's folder, so it refreshes the usage of System default alone." });
    const at = plain.c.messages.length;
    await plain.c.request({ type: "refreshUsage", id: SYSTEM_DEFAULT_ID });
    await accountsAfter(plain.c, at, SYSTEM_DEFAULT_ID, (account) => account.refresh?.state === "ended");
    expect(bare.started).toEqual([{ prompt: REFRESH_PROMPT, cwd: join(plain.runDir, "accounts", "refresh"), refresh: true }]);
    let stops = 0;
    const slow = fakeAdapter({ delayMs: 5000 });
    const held = await daemon({ roleAdapter: { ...slow, start: async (options, listener) => {
      const run = await slow.start(options, listener);
      return { ...run, stop: () => ((stops += 1), run.stop()) };
    } } });
    await held.c.request({ type: "refreshUsage", id: SYSTEM_DEFAULT_ID });
    await held.c.until(() => (stops === 0 ? true : undefined));
    await new Promise((r) => setTimeout(r, 50));
    await held.d.close();
    expect(stops).toBe(1);
  });

  it("refuses with its reason, and starts nothing, a refresh while a pane or a working session runs under the account or a refresh of it runs, for an id it keeps none of, and through an adapter that declares no refresh; and starts none at the daemon's start, at a client's hello, or as the daemon's clock passes an hour with no press (scenario 15)", async () => {
    let now = 1_000_000;
    const { adapter, started } = noted(fakeAdapter({ delayMs: 300 }));
    const { c, url } = await daemon({ roleAdapter: adapter, now: () => now });
    await c.request({ type: "addAccount", name: "Work", folder: handedFolder() });
    const { workItemId } = await workItemIn(c);
    await client(url).then((other) => other.message("ready"));
    now += 60 * 60_000;
    await new Promise((r) => setTimeout(r, 300));
    expect(started).toEqual([]);
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 910, workItemId, accountId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 910)).session;
    expect(await c.request({ type: "refreshUsage", id: 1 })).toMatchObject({ type: "error", message: 'The usage of "Work" is not refreshed while something runs under it, which hands over its values itself: the Claude Code pane in "A work item".' });
    c.send({ type: "close", id: pane.id });
    await c.message("inbox", (m) => !m.sessions.some((session) => session.id === pane.id));
    const ask = await c.request({ type: "ask", workItemId, prompt: "Who am I?", accountId: 1 });
    expect(await c.request({ type: "refreshUsage", id: 1 })).toMatchObject({ type: "error", message: 'The usage of "Work" is not refreshed while something runs under it, which hands over its values itself: a session asked in "A work item".' });
    await c.message("headless", (m) => ask.type === "asked" && m.headless.id === ask.headless.id && m.headless.state !== "working");
    expect(await c.request({ type: "refreshUsage", id: 1 })).toMatchObject({ type: "done" });
    expect(await c.request({ type: "refreshUsage", id: 1 })).toMatchObject({ type: "error", message: 'The usage of "Work" is being refreshed already.' });
    // A refresh runs under its account, so the account is not removed meanwhile.
    expect(await c.request({ type: "removeAccount", id: 1 })).toMatchObject({ type: "error", message: '"Work" is not removed while something runs under it: a refresh of its usage.' });
    expect(await c.request({ type: "refreshUsage", id: 9 })).toMatchObject({ type: "error", message: "No account 9 is kept." });
    expect(started.filter((options) => "refresh" in options)).toHaveLength(1);
    const plain = await daemon({ roleAdapter: fakeAdapter({ features: ["role-tools", "permission-requests", "accounts"] }) });
    expect(plain.ready).toMatchObject({ refreshesUsage: false });
    expect(await plain.c.request({ type: "refreshUsage", id: SYSTEM_DEFAULT_ID })).toMatchObject({ type: "error", message: "The fake adapter does not refresh an account's usage." });
  });

  it("keeps the values every headless session of an account hands over, so the account shows them with no refresh, and keeps them for the account the session started under (scope item 13)", async () => {
    let now = 7_000;
    const { c } = await daemon({ roleAdapter: fakeAdapter({ limits: () => [{ status: "ok", used: 0.25, resetsAt: null, window: "seven_day" }] }), now: () => now });
    await c.request({ type: "addAccount", name: "Work", folder: handedFolder() });
    const { workItemId } = await workItemIn(c);
    const from = c.messages.length;
    now = 9_000;
    await asked(c, workItemId, 1);
    expect((await accountsAfter(c, from, 1, (account) => account.limits.length > 0)).accounts.map((account) => account.limits)).toEqual([[], [{ status: "ok", used: 0.25, resetsAt: null, window: "seven_day", at: 9_000 }]]);
    expect(c.messages.slice(from).some((m) => m.type === "accounts" && m.accounts.some((account) => account.refresh !== null))).toBe(false);
  });
});

describe("Claude Code's part of the accounts", () => {
  it("links into an account's folder each listed name the person's folder holds and no other, leaves a name the account's folder holds already, follows no link into the person's folder and changes nothing of it (scenario 5's links)", () => {
    const own = ownFolder();
    const account = folder("owlery-made-");
    writeFileSync(join(account, "CLAUDE.md"), "The account's own.\n");
    symlinkSync(join(account, "nowhere"), join(account, "rules"));
    const before = contents(own);
    expect(linkOwn(account, own)).toEqual(["settings.json", "skills", "projects", "history.jsonl"]);
    expect(linksIn(account)).toEqual({ "settings.json": join(own, "settings.json"), skills: join(own, "skills"), projects: join(own, "projects"), "history.jsonl": join(own, "history.jsonl"), rules: join(account, "nowhere") });
    expect(readFileSync(join(account, "CLAUDE.md"), "utf8")).toBe("The account's own.\n");
    expect(readdirSync(account).sort()).toEqual(["CLAUDE.md", "history.jsonl", "projects", "rules", "settings.json", "skills"]);
    expect(contents(own)).toEqual(before);
    // A second call finds nothing missing.
    expect(linkOwn(account, own)).toEqual([]);
    expect(LINKED_NAMES).not.toContain(".claude.json");
    expect(LINKED_NAMES).not.toContain(".credentials.json");
  });

  it("answers where a config folder keeps its conversations by the real path of its projects, through the adapter, so a folder whose projects links into the person's answers as the person's does, and null for a folder that holds none (scenario 9)", () => {
    const own = folder();
    mkdirSync(join(own, "projects"));
    const linked = handedFolder();
    symlinkSync(join(own, "projects"), join(linked, "projects"));
    const { conversationsOf } = claudeAdapter({});
    expect([conversationsOf?.(own), conversationsOf?.(linked), conversationsOf?.(handedFolder())]).toEqual([realpathSync(join(own, "projects")), realpathSync(join(own, "projects")), null]);
  });

  it("reads the CLI's word on a login from how `auth status` exited, the end it printed and the email it printed for a login that stands, kept without the white space at its ends, and nothing from any other exit (scope item 4 and scenario E, the adapter's part)", () => {
    expect(authArgs("login")).toEqual(["auth", "login"]);
    expect(authArgs("status")).toEqual(["auth", "status"]);
    expect(authArgs("logout")).toEqual(["auth", "logout"]);
    expect(loginStatusOf(0, '{"loggedIn":true,"email":"person@example.com","loginExpiresAt":"2026-12-20T09:30:00.000Z"}')).toEqual({ signedIn: true, loginEndsAt: Date.parse("2026-12-20T09:30:00.000Z"), name: "person@example.com" });
    expect(loginStatusOf(0, '{"loggedIn":true,"email":"  person@example.com\\n","loginExpiresAt":null}')).toEqual({ signedIn: true, loginEndsAt: null, name: "person@example.com" });
    expect(loginStatusOf(0, '{"loggedIn":true,"authMethod":"api_key"}')).toEqual({ signedIn: true, loginEndsAt: null, name: null });
    expect(loginStatusOf(0, '{"loginExpiresAt":"soon"}')).toEqual({ signedIn: true, loginEndsAt: null, name: null });
    // An email that is empty once trimmed, or no string, names no login, and the daemon names the account itself.
    for (const email of ['""', '" "', "null", "7", '["person@example.com"]', '{"address":"person@example.com"}']) expect(loginStatusOf(0, `{"loggedIn":true,"email":${email}}`)?.name).toBeNull();
    expect(loginStatusOf(0, "not json")).toEqual({ signedIn: true, loginEndsAt: null, name: null });
    // No login stands where the command exited 1, so an email it printed names none.
    expect(loginStatusOf(1, '{"loggedIn":false,"email":"person@example.com"}')).toEqual({ signedIn: false, loginEndsAt: null, name: null });
    expect(loginStatusOf(1, "not json")).toEqual({ signedIn: false, loginEndsAt: null, name: null });
    expect(loginStatusOf(2, '{"loggedIn":true,"email":"person@example.com"}')).toBeUndefined();
  });

  it("signs a folder in by a pane's command, reads its login and the email the CLI names it by, and signs it out through the CLI with the folder as CLAUDE_CONFIG_DIR, links only once the person's folder is known, and rejects with the CLI's words where it failed (scope item 12)", async () => {
    const { cli, here, calls } = authStandIn();
    const account = folder("owlery-made-");
    const own = ownFolder();
    let known: string | null = null;
    const logins = loginsOf(cli, () => known);
    logins.furnish(account);
    expect(readdirSync(account)).toEqual([]);
    known = own;
    logins.furnish(account);
    expect(Object.keys(linksIn(account)).sort()).toEqual(["CLAUDE.md", "history.jsonl", "projects", "settings.json", "skills"]);
    expect(await logins.status(account)).toEqual({ signedIn: false, loginEndsAt: null, name: null });
    const signIn = await logins.signIn(account);
    expect(signIn).toEqual({ command: cli, args: ["auth", "login"], env: claudeEnv(process.env, process.env.PATH ?? "/usr/bin:/bin", account) });
    expect(signIn.env.CLAUDE_CONFIG_DIR).toBe(account);
    // The pane's process, run here as a pane would run it.
    await new Promise<void>((resolve, reject) => {
      execFile(signIn.command, signIn.args, { env: signIn.env }, (error) => (error ? reject(error) : resolve()));
    });
    expect(await logins.status(account)).toEqual({ signedIn: true, loginEndsAt: Date.parse("2026-12-20T09:30:00.000Z"), name: "stand-in@example.com" });
    // A login the CLI names no email for, as a case makes the stand-in print.
    writeFileSync(join(here, "no-email"), "");
    expect(await logins.status(account)).toEqual({ signedIn: true, loginEndsAt: Date.parse("2026-12-20T09:30:00.000Z"), name: null });
    rmSync(join(here, "no-email"));
    writeFileSync(join(here, "refuse-logout"), "");
    await expect(logins.signOut(account)).rejects.toThrow("claude auth logout exited with 2: Logout failed.");
    rmSync(join(here, "refuse-logout"));
    await logins.signOut(account);
    expect(await logins.status(account)).toEqual({ signedIn: false, loginEndsAt: null, name: null });
    // A CLI given no folder exits otherwise than 0 or 1, which says nothing of a login.
    const unnamed = claudeLogins({ locate: () => Promise.resolve({ cli, path: process.env.PATH ?? "/usr/bin:/bin" }), envOf: (path) => ({ PATH: path }), ownFolder: () => own });
    await expect(unnamed.status(account)).rejects.toThrow("claude auth status exited with 64.");
    expect(calls()).toEqual([`auth status|${account}`, `auth login|${account}`, `auth status|${account}`, `auth status|${account}`, `auth logout|${account}`, `auth logout|${account}`, `auth status|${account}`, "auth status|"]);
    const lost = claudeLogins({ locate: () => Promise.reject(new Error("claude was not found by the login shell (/bin/zsh)")), envOf: (path, at) => claudeEnv(process.env, path, at), ownFolder: () => own });
    await expect(lost.signIn(account)).rejects.toThrow("claude was not found by the login shell (/bin/zsh)");
    await expect(lost.status(account)).rejects.toThrow("claude was not found by the login shell (/bin/zsh)");
    await expect(lost.signOut(account)).rejects.toThrow("claude was not found by the login shell (/bin/zsh)");
  });
});

describe("the accounts Owlery makes", () => {
  it("adds an account with no folder: the daemon makes its folder in the run folder, links the person's names into it once the adapter knows the person's folder and again before each launch under it, and changes nothing of the person's folder; an adapter that signs no account in is refused one (scenario 5)", async () => {
    const own = ownFolder();
    const before = contents(own);
    let known: string | null = null;
    const { cli } = authStandIn();
    const { c, runDir } = await daemon({ roleAdapter: fakeAdapter({ logins: loginsOf(cli, () => known) }) });
    expect(await c.request({ type: "addAccount", name: "Early" })).toMatchObject({ type: "done" });
    const early = join(runDir, "accounts", "1");
    // The lookup has not answered, so no link is made.
    expect(readdirSync(early)).toEqual([]);
    known = own;
    expect(await c.request({ type: "addAccount", name: " Work " })).toMatchObject({ type: "done" });
    const work = join(runDir, "accounts", "2");
    const linked = { "CLAUDE.md": join(own, "CLAUDE.md"), "history.jsonl": join(own, "history.jsonl"), projects: join(own, "projects"), "settings.json": join(own, "settings.json"), skills: join(own, "skills") };
    expect(linksIn(work)).toEqual(linked);
    const sent = await c.message("accounts", (m) => m.accounts.length === 3);
    expect(sent.accounts.slice(1)).toEqual([
      { id: 1, name: "Early", made: true, folder: early, signedIn: null, loginEndsAt: null, limits: [], refresh: null, conversations: null },
      { id: 2, name: "Work", made: true, folder: work, signedIn: null, loginEndsAt: null, limits: [], refresh: null, conversations: realpathSync(join(own, "projects")) },
    ]);
    rmSync(join(work, "skills"));
    const { workItemId } = await workItemIn(c);
    await asked(c, workItemId, 2);
    expect(linksIn(work)).toEqual(linked);
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 800, workItemId, accountId: 1 });
    await c.message("started", (m) => m.requestId === 800);
    expect(linksIn(early)).toEqual(linked);
    expect(contents(own)).toEqual(before);
    const plain = await daemon();
    expect(await plain.c.request({ type: "addAccount", name: "Work" })).toMatchObject({ type: "error", message: "This agent signs no account in here, so Owlery makes no folder for one. Use an existing folder." });
    expect(existsSync(join(plain.runDir, "accounts"))).toBe(false);
    expect(await plain.c.request({ type: "addAccount", name: "Work", folder: 7 })).toMatchObject({ type: "error", message: "An account is added with a name, and the absolute path of its folder where the person hands one over." });
  });

  it("signs an account in in a pane of no work item that runs the CLI's own sign-in under the account's folder, in the environment the adapter names and no variable of the daemon's own, and at the pane's end and at a request reads whether a login stands and when it ends (scenario 6)", async () => {
    const { cli, here, calls } = authStandIn();
    // A variable of the daemon's own environment, as a token a terminal exported would be, never reaches the sign-in.
    process.env.OWLERY_DAEMON_ONLY = "inherited";
    cleanups.push(() => {
      delete process.env.OWLERY_DAEMON_ONLY;
    });
    const { c, runDir } = await daemon({ roleAdapter: fakeAdapter({ logins: loginsOf(cli, () => null) }) });
    await c.request({ type: "addAccount", name: "Work" });
    await c.request({ type: "addAccount", name: "Home" });
    const work = join(runDir, "accounts", "1");
    const home = join(runDir, "accounts", "2");
    c.send({ type: "signIn", requestId: 700, id: 1, cols: 80, rows: 24 });
    const pane = (await c.message("started", (m) => m.requestId === 700)).session;
    expect(pane).toMatchObject({ kind: "shell", alive: true, workItemId: null, accountId: 1, signsIn: 1 });
    const signed = await c.message("accounts", (m) => m.accounts[1]?.signedIn === true);
    expect(signed.accounts[1]).toEqual({ id: 1, name: "Work", made: true, folder: work, signedIn: true, loginEndsAt: Date.parse("2026-12-20T09:30:00.000Z"), limits: [], refresh: null, conversations: null });
    await c.message("inbox", (m) => m.sessions.some((session) => session.id === pane.id && !session.alive));
    expect(calls()).toEqual([`auth login|${work}`, `auth status|${work}`]);
    const given = readFileSync(join(here, "login-env"), "utf8").split("\n");
    expect([given.includes(`CLAUDE_CONFIG_DIR=${work}`), given.some((line) => line.startsWith("OWLERY_DAEMON_ONLY="))]).toEqual([true, false]);
    writeFileSync(join(here, "refuse-login"), "");
    c.send({ type: "signIn", requestId: 701, id: 2, cols: 80, rows: 24 });
    expect((await c.message("started", (m) => m.requestId === 701)).session).toMatchObject({ workItemId: null, accountId: 2, signsIn: 2 });
    expect((await c.message("accounts", (m) => m.accounts[2]?.signedIn === false)).accounts[2]).toMatchObject({ signedIn: false, loginEndsAt: null });
    // Signed out outside Owlery, which the daemon learns at the person's request.
    rmSync(join(work, ".stand-in-login"));
    expect(await c.request({ type: "readSignIn", id: 1 })).toMatchObject({ type: "done" });
    expect((await c.message("accounts", (m) => m.accounts[1]?.signedIn === false)).accounts[1]).toMatchObject({ signedIn: false, loginEndsAt: null });
    expect(calls().slice(2)).toEqual([`auth login|${home}`, `auth status|${home}`, `auth status|${work}`]);
    rmSync(join(here, "refuse-login"));
    writeFileSync(join(here, "hold-login"), "");
    c.send({ type: "signIn", requestId: 702, id: 1, cols: 80, rows: 24 });
    const held = (await c.message("started", (m) => m.requestId === 702)).session;
    expect(await c.request({ type: "signIn", id: 1, cols: 80, rows: 24 })).toMatchObject({ type: "error", message: 'A sign-in of "Work" is open already.' });
    expect(await c.request({ type: "removeAccount", id: 1 })).toMatchObject({ type: "error", message: '"Work" is not removed while something runs under it: its sign-in pane.' });
    rmSync(join(here, "hold-login"));
    await c.message("inbox", (m) => m.sessions.some((session) => session.id === held.id && !session.alive));
    for (const [id, refusal] of [
      [SYSTEM_DEFAULT_ID, "System default is signed in with the agent in a terminal of your own."],
      [9, "No account 9 is kept."],
    ] as const) {
      expect(await c.request({ type: "signIn", id, cols: 80, rows: 24 })).toMatchObject({ type: "error", message: refusal });
      expect(await c.request({ type: "readSignIn", id })).toMatchObject({ type: "error", message: refusal });
    }
    const plain = await daemon();
    await plain.c.request({ type: "addAccount", name: "Handed", folder: handedFolder() });
    expect(await plain.c.request({ type: "signIn", id: 1, cols: 80, rows: 24 })).toMatchObject({ type: "error", message: "This agent signs no account in here." });
    expect(await plain.c.request({ type: "readSignIn", id: 1 })).toMatchObject({ type: "error", message: "This agent signs no account in here." });
  });

  it("removes an account Owlery made that settings name: signs its folder out through the CLI, removes the folder with its links, clears each repository's and work item's setting that named it and a default that named it, reads those repositories' chain again under the account they then take, and changes nothing of the person's folder (scenario 13)", async () => {
    const own = ownFolder();
    const before = contents(own);
    const { cli, calls } = authStandIn();
    // The plugin is enabled in the accounts' folders alone, so a repository's chain says whether it was read in one. No reading of commits reads it again meanwhile.
    const enabledIn = new Set<string>();
    const { c, runDir } = await daemon({ roleAdapter: fakeAdapter({ logins: loginsOf(cli, () => own) }), pluginEnabled: (_folder, _checkout, configDir) => configDir !== null && enabledIn.has(configDir), commitPollMs: 3_600_000 });
    await c.request({ type: "addAccount", name: "Work" });
    await c.request({ type: "addAccount", name: "Home" });
    const work = join(runDir, "accounts", "1");
    const home = join(runDir, "accounts", "2");
    enabledIn.add(work).add(home);
    expect(Object.keys(linksIn(work))).toHaveLength(5);
    const one = await workItemIn(c);
    const two = await workItemIn(c);
    await c.request({ type: "setDefaultAccount", id: 1 });
    await c.request({ type: "setRepository", id: one.repositoryId, accountId: 1 });
    await c.request({ type: "setWorkItem", id: one.workItemId, accountId: 1 });
    await c.request({ type: "setWorkItem", id: two.workItemId, accountId: 2 });
    const chainOf = (lists: Extract<ServerMessage, { type: "inbox" }>, id: number) => lists.repositories.find((repository) => repository.id === id)?.chain?.plugin;
    // Before the removal both read the account's folder: the one by its setting, the other by the default.
    await c.message("inbox", (m) => m.repositories[0]?.accountId === 1 && chainOf(m, one.repositoryId) === true && chainOf(m, two.repositoryId) === true);
    const from = c.messages.length;
    expect(await c.request({ type: "removeAccount", id: 1 })).toMatchObject({ type: "done" });
    expect(calls()).toEqual([`auth logout|${work}`]);
    expect(existsSync(work)).toBe(false);
    const accounts = await c.message("accounts", (m) => !m.accounts.some((account) => account.id === 1));
    expect([accounts.accounts.map((account) => account.id), accounts.defaultAccountId]).toEqual([[0, 2], SYSTEM_DEFAULT_ID]);
    const inbox = await c.until(() => c.messages.slice(from).find((m): m is Extract<ServerMessage, { type: "inbox" }> => m.type === "inbox"));
    expect(inbox.repositories.map((repository) => [repository.id, repository.accountId, repository.chain?.plugin])).toEqual([
      [one.repositoryId, null, false],
      [two.repositoryId, null, false],
    ]);
    expect(inbox.workItems.map((item) => [item.id, item.accountId])).toEqual([
      [one.workItemId, null],
      [two.workItemId, 2],
    ]);
    expect(JSON.parse(readFileSync(join(runDir, "accounts.json"), "utf8"))).toMatchObject({ defaultId: 0, accounts: [{ id: 2 }] });
    // A repository set to an account that is not the default is read again where its own setting is cleared.
    await c.request({ type: "setRepository", id: two.repositoryId, accountId: 2 });
    await c.message("inbox", (m) => m.repositories[1]?.accountId === 2 && chainOf(m, two.repositoryId) === true);
    const later = c.messages.length;
    expect(await c.request({ type: "removeAccount", id: 2 })).toMatchObject({ type: "done" });
    const after = await c.until(() => c.messages.slice(later).find((m): m is Extract<ServerMessage, { type: "inbox" }> => m.type === "inbox"));
    expect(after.repositories.map((repository) => [repository.accountId, repository.chain?.plugin])).toEqual([
      [null, false],
      [null, false],
    ]);
    expect(after.workItems.map((item) => item.accountId)).toEqual([null, null]);
    expect(calls()).toEqual([`auth logout|${work}`, `auth logout|${home}`]);
    expect(contents(own)).toEqual(before);
  });

  it("refuses a removal while a pane or a working session runs under the account, naming each, for System default and an id it keeps none of, and where the sign-out fails, removing nothing (scenario 13's refusal)", async () => {
    const { cli, here, calls } = authStandIn();
    const { c, runDir } = await daemon({ roleAdapter: fakeAdapter({ logins: loginsOf(cli, () => null), delayMs: 300 }) });
    await c.request({ type: "addAccount", name: "Work" });
    const work = join(runDir, "accounts", "1");
    const { workItemId } = await workItemIn(c);
    c.send({ type: "start", kind: "claude", cols: 80, rows: 24, requestId: 810, workItemId, accountId: 1 });
    const pane = (await c.message("started", (m) => m.requestId === 810)).session;
    const ask = await c.request({ type: "ask", workItemId, prompt: "Who am I?", accountId: 1 });
    expect(ask.type).toBe("asked");
    expect(await c.request({ type: "removeAccount", id: 1 })).toMatchObject({ type: "error", message: '"Work" is not removed while something runs under it: the Claude Code pane in "A work item"; a session asked in "A work item".' });
    c.send({ type: "close", id: pane.id });
    await c.message("inbox", (m) => !m.sessions.some((session) => session.id === pane.id));
    await c.message("headless", (m) => m.headless.state !== "working");
    writeFileSync(join(here, "refuse-logout"), "");
    expect(await c.request({ type: "removeAccount", id: 1 })).toMatchObject({ type: "error", message: "claude auth logout exited with 2: Logout failed." });
    expect(existsSync(work)).toBe(true);
    expect(await c.request({ type: "removeAccount", id: SYSTEM_DEFAULT_ID })).toMatchObject({ type: "error", message: "System default is never removed." });
    expect(await c.request({ type: "removeAccount", id: 9 })).toMatchObject({ type: "error", message: "No account 9 is kept." });
    expect(calls()).toEqual([`auth logout|${work}`]);
    expect(JSON.parse(readFileSync(join(runDir, "accounts.json"), "utf8")).accounts).toHaveLength(1);
  });

  it("removes an account handed over by its folder without signing it out, and leaves the folder and every file in it (the removing half of scenario 7)", async () => {
    const { cli, calls } = authStandIn();
    const { c } = await daemon({ roleAdapter: fakeAdapter({ logins: loginsOf(cli, () => ownFolder()) }) });
    const handed = handedFolder();
    mkdirSync(join(handed, "projects"));
    writeFileSync(join(handed, "projects", "a.jsonl"), "{}\n");
    const before = contents(handed);
    await c.request({ type: "addAccount", name: "Handed", folder: handed });
    const { workItemId } = await workItemIn(c);
    await asked(c, workItemId, 1);
    expect(await c.request({ type: "removeAccount", id: 1 })).toMatchObject({ type: "done" });
    expect((await c.message("accounts", (m) => m.accounts.length === 1)).accounts).toEqual([{ ...SYSTEM_DEFAULT, conversations: null }]);
    expect(contents(handed)).toEqual(before);
    expect(calls()).toEqual([]);
  });
});
