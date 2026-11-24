import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import type { RoleAdapter } from "../src/daemon/adapters/adapter";
import { fakeAdapter } from "../src/daemon/adapters/fake";
import { AccountStore } from "../src/daemon/accounts";
import { Daemon, type DaemonOptions } from "../src/daemon/daemon";
import { PANE_KINDS } from "../src/daemon/pane-kinds";
import { accountFor, type HeadlessInfo, type ServerMessage, SYSTEM_DEFAULT_ID } from "../src/shared/protocol";
import { temporaryRepository } from "./repositories";

const TOKEN = "t".repeat(64);
const SYSTEM_DEFAULT = { id: 0, name: "System default", made: false, folder: null };

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
    expect(store.addHanded(" Work ", work, "claude")).toEqual({ id: 1, name: "Work", adapter: "claude", folder: work, made: false });
    expect(store.addHanded("Home", `${home}/`, "claude")).toEqual({ id: 2, name: "Home", adapter: "claude", folder: home, made: false });
    expect(store.listed()).toEqual([SYSTEM_DEFAULT, { id: 1, name: "Work", made: false, folder: work }, { id: 2, name: "Home", made: false, folder: home }]);
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

  it("keeps the accounts and the default in accounts.json of the run folder, readable by the user alone, which a second store reads", () => {
    const runDir = folder();
    const handed = handedFolder();
    const store = new AccountStore(runDir);
    store.addHanded("Work", handed, "claude");
    store.setDefault(1);
    expect(statSync(join(runDir, "accounts.json")).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(join(runDir, "accounts.json"), "utf8"))).toEqual({ nextId: 2, defaultId: 1, accounts: [{ id: 1, name: "Work", adapter: "claude", folder: handed, made: false }] });
    const again = new AccountStore(runDir);
    expect(again.listed()).toEqual(store.listed());
    expect(again.defaultId()).toBe(1);
  });

  it("gives no id twice, and reads a file whose next id stands at or below an id it holds as one past the highest", () => {
    const runDir = folder();
    const handed = handedFolder();
    writeFileSync(join(runDir, "accounts.json"), JSON.stringify({ nextId: 1, defaultId: 0, accounts: [{ id: 4, name: "Work", adapter: "claude", folder: handed, made: false }] }));
    expect(new AccountStore(runDir).addHanded("Home", handedFolder(), "claude").id).toBe(5);
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

  it("keeps the accounts in memory alone where it is given no run folder", () => {
    const store = new AccountStore(undefined);
    store.addHanded("Work", handedFolder(), "claude");
    expect(store.listed()).toHaveLength(2);
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
    const launched = async (own?: number): Promise<number | undefined> => (await asked(c, workItemId, own)).accountId;
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
    const listed = [SYSTEM_DEFAULT, { id: 1, name: "Work", made: false, folder: work }];
    expect(await c.message("accounts")).toEqual({ type: "accounts", accounts: listed, defaultAccountId: SYSTEM_DEFAULT_ID });
    await c.request({ type: "setDefaultAccount", id: 1 });
    expect(await c.message("accounts", (m) => m.defaultAccountId === 1)).toEqual({ type: "accounts", accounts: listed, defaultAccountId: 1 });
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
    expect(await c.request({ type: "addAccount", name: "No folder" })).toMatchObject({ type: "error", message: "An account is added with a name and the absolute path of its folder." });
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

  it("gives the folder only to an adapter that declares accounts: one that does not launches the session as before, under the account the session names", async () => {
    const { adapter, started } = noted(fakeAdapter({ features: ["role-tools", "permission-requests"] }));
    const { c } = await daemon({ roleAdapter: adapter });
    await c.request({ type: "addAccount", name: "Work", folder: handedFolder() });
    const { workItemId } = await workItemIn(c);
    await c.request({ type: "setWorkItem", id: workItemId, accountId: 1 });
    const session = await asked(c, workItemId);
    expect(session.answer).toBe('You asked: "Who am I?"');
    expect(started).toHaveLength(1);
    expect("accountDir" in started[0]!).toBe(false);
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
