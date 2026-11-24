import { lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { type Account, type AccountLimit, type AccountRefresh, SYSTEM_DEFAULT_ID, SYSTEM_DEFAULT_NAME } from "../shared/protocol";
import { writeWholeFile } from "./whole-file";

const FILE = "accounts.json";

/** The folder of the run folder that holds the folders the daemon makes for accounts, each named by its account's id, and the empty folder a refresh of usage runs in. */
export const MADE_FOLDERS = "accounts";

/** The folder of `MADE_FOLDERS` a refresh of usage runs in. No account's id is this name. */
const REFRESH_FOLDER = "refresh";

/** An account as the store keeps it: the name a person gave it, the adapter whose agent it is a login of, its config folder, whether Owlery made that folder, and the agent's last word on its login. */
export interface StoredAccount {
  id: number;
  name: string;
  adapter: string;
  folder: string;
  made: boolean;
  /** Whether a login stood in the folder at the agent's last word on it, and null where it has said nothing yet. */
  signedIn: boolean | null;
  /** The daemon's clock at which that login is expected to end, and null where the agent named no end or has said nothing yet. */
  loginEndsAt: number | null;
  /** The last limit value its sessions handed over, one for each window (`Account.limits`). */
  limits: AccountLimit[];
}

/** What `accounts.json` holds: the id the next account takes, the default account's id, the accounts, and System default's limit values, since System default is no entry of the accounts. */
interface Stored {
  nextId: number;
  defaultId: number;
  accounts: StoredAccount[];
  systemLimits: AccountLimit[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function isStoredAccount(value: unknown): value is StoredAccount {
  return isRecord(value) && Number.isInteger(value.id) && (value.id as number) > SYSTEM_DEFAULT_ID && typeof value.name === "string" && typeof value.adapter === "string" && typeof value.folder === "string" && typeof value.made === "boolean";
}

const LIMIT_STATES: readonly unknown[] = ["ok", "near", "reached", null];
const numberOrNull = (value: unknown): boolean => value === null || (typeof value === "number" && Number.isFinite(value));

function isLimit(value: unknown): value is AccountLimit {
  return isRecord(value) && LIMIT_STATES.includes(value.status) && numberOrNull(value.used) && numberOrNull(value.resetsAt) && (value.window === null || typeof value.window === "string") && typeof value.at === "number" && Number.isFinite(value.at);
}

/** The limit values a file holds, each in its form, and none for a file of a build before them. */
function limitsOf(value: unknown): AccountLimit[] {
  return Array.isArray(value) ? value.filter(isLimit).map(({ status, used, resetsAt, window, at }) => ({ status, used, resetsAt, window, at })) : [];
}

function isStored(value: unknown): value is Omit<Stored, "systemLimits"> & { systemLimits?: unknown } {
  return isRecord(value) && Number.isInteger(value.nextId) && Number.isInteger(value.defaultId) && Array.isArray(value.accounts) && value.accounts.every(isStoredAccount);
}

/** Whether anything stands at a path, a link that leads nowhere among it. */
function stands(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

/** The folder a path names once its links are followed, or the path itself where nothing stands there to follow. */
function realOf(folder: string): string {
  try {
    return realpathSync(folder);
  } catch {
    return folder;
  }
}

/**
 * The daemon's accounts: the logins of the person's agent, each kept as the
 * agent's config folder, and which of them is the default. It is the
 * daemon's state, not the person's repository's: it lives in `accounts.json`
 * in the run directory, readable by the user alone, is written whole at each
 * change and is read at start. "System default", `SYSTEM_DEFAULT_ID`, is no
 * entry of the file: it is always an account, has no folder and is the
 * default until another is named. An id is never given twice, and a file
 * whose next id stands at or below an id it holds is read as one past the
 * highest. A default that names no account the file holds is read as System
 * default, and a file that is no store as no account. An account the file
 * calls made is read as one handed over where its folder is not the one the
 * store makes for its id, `accounts/<id>` of the run directory, so a removal
 * deletes no folder the store did not make. The store reads no file
 * inside a folder and writes none there: it makes an empty folder for an
 * account added with none, and removes that folder with its account. Given
 * no run directory, the store is kept in memory alone and makes no folder.
 */
export class AccountStore {
  private readonly file: string | undefined;
  private stored: Stored = { nextId: SYSTEM_DEFAULT_ID + 1, defaultId: SYSTEM_DEFAULT_ID, accounts: [], systemLimits: [] };

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(this.file, "utf8"));
    } catch {
      return;
    }
    if (!isStored(value)) return;
    // A file of a build before sign-in holds no word on a login, and reads as one the agent has said nothing of.
    // A file of a build before usage holds no limit value, and reads as one no session handed any over to.
    // A folder is read as made only where it is the one `addMade` makes for its id, so an edited file never has a removal sign out
    // and delete a folder Owlery did not make. A run folder moved elsewhere reads its made folders as handed over, which are never removed.
    const holder = join(dirname(this.file), MADE_FOLDERS);
    const madeAt = (id: number): string => join(holder, String(id));
    const accounts = value.accounts.map(({ id, name, adapter, folder, made, signedIn, loginEndsAt, limits }) => ({ id, name, adapter, folder, made: made && folder === madeAt(id), signedIn: typeof signedIn === "boolean" ? signedIn : null, loginEndsAt: typeof loginEndsAt === "number" && Number.isFinite(loginEndsAt) ? loginEndsAt : null, limits: limitsOf(limits) }));
    const highest = accounts.reduce((most, account) => Math.max(most, account.id), SYSTEM_DEFAULT_ID);
    this.stored = {
      nextId: Math.max(value.nextId, highest + 1),
      defaultId: accounts.some((account) => account.id === value.defaultId) ? value.defaultId : SYSTEM_DEFAULT_ID,
      accounts,
      systemLimits: limitsOf(value.systemLimits),
    };
  }

  /** Every account but System default, in the order they were added. */
  accounts(): readonly StoredAccount[] {
    return this.stored.accounts;
  }

  /** The account of an id, and nothing for System default and for an id the store keeps no account under. */
  account(id: number): StoredAccount | undefined {
    return this.stored.accounts.find((account) => account.id === id);
  }

  /** Whether the id is an account's: System default's, or one the store keeps. */
  holds(id: number): boolean {
    return id === SYSTEM_DEFAULT_ID || this.account(id) !== undefined;
  }

  defaultId(): number {
    return this.stored.defaultId;
  }

  /** The accounts as a client is sent them: System default first, then the others in the order they were added, each with the refresh `refreshOf` gives of its id, which the store does not keep. */
  listed(refreshOf: (id: number) => AccountRefresh | null = () => null): Account[] {
    const limits = (kept: readonly AccountLimit[]): AccountLimit[] => kept.map((limit) => ({ ...limit }));
    return [
      { id: SYSTEM_DEFAULT_ID, name: SYSTEM_DEFAULT_NAME, made: false, folder: null, signedIn: null, loginEndsAt: null, limits: limits(this.stored.systemLimits), refresh: refreshOf(SYSTEM_DEFAULT_ID) },
      ...this.stored.accounts.map(({ id, name, made, folder, signedIn, loginEndsAt, limits: kept }) => ({ id, name, made, folder, signedIn, loginEndsAt, limits: limits(kept), refresh: refreshOf(id) })),
    ];
  }

  /**
   * Keeps a limit value a session of the account `id`, System default among
   * them, handed over at the daemon's clock `at`, in place of the last one
   * of its window, or after the others where its window had none. It answers
   * whether it kept it, which it does not for an id the store keeps no
   * account under, as one removed while its session ran.
   */
  setLimit(id: number, limit: Omit<AccountLimit, "at">, at: number): boolean {
    const kept = id === SYSTEM_DEFAULT_ID ? this.stored.systemLimits : this.account(id)?.limits;
    if (kept === undefined) return false;
    const { status, used, resetsAt, window } = limit;
    const value: AccountLimit = { status, used, resetsAt, window, at };
    const index = kept.findIndex((was) => was.window === window);
    if (index === -1) kept.push(value);
    else kept[index] = value;
    this.write();
    return true;
  }

  /** The empty folder of the run folder a refresh of usage runs in, made readable by the user alone where it does not stand. It throws, with a sentence a person reads, where the store keeps no run folder. */
  refreshFolder(): string {
    if (this.file === undefined) throw new Error("This daemon keeps no run folder to run a refresh in.");
    const folder = join(dirname(this.file), MADE_FOLDERS, REFRESH_FOLDER);
    mkdirSync(folder, { recursive: true, mode: 0o700 });
    return folder;
  }

  /**
   * Adds an account the person hands over by its config folder, under the
   * next id, and answers with it. It throws, with a sentence a person reads
   * and nothing added, for an empty name, a path that is not absolute, a
   * path where no folder stands, and a folder that is already an account's,
   * however the two paths spell it. The name is kept without the white space
   * at its ends, and the folder as its path names it, without a slash at its
   * end. Nothing is made, read or written inside the folder.
   */
  addHanded(name: string, folder: string, adapter: string): StoredAccount {
    const named = name.trim();
    if (named === "") throw new Error("An account needs a name.");
    if (!isAbsolute(folder)) throw new Error(`The folder of an account is an absolute path, and "${folder}" is not one.`);
    const path = resolve(folder);
    let isFolder: boolean;
    try {
      isFolder = statSync(path).isDirectory();
    } catch {
      isFolder = false;
    }
    if (!isFolder) throw new Error(`No folder stands at ${folder}.`);
    const real = realOf(path);
    const holder = this.stored.accounts.find((account) => realOf(account.folder) === real);
    if (holder) throw new Error(`The folder ${folder} is already the account "${holder.name}".`);
    const account: StoredAccount = { id: this.stored.nextId++, name: named, adapter, folder: path, made: false, signedIn: null, loginEndsAt: null, limits: [] };
    this.stored.accounts.push(account);
    this.write();
    return account;
  }

  /**
   * Adds an account whose config folder the store makes, under the next id,
   * and answers with it: `accounts/<id>` of the run folder, readable by the
   * user alone, as is the folder that holds it, and empty. An id whose folder
   * stands already, as one a lost `accounts.json` left, is passed over, so no
   * account takes a folder it did not make. It throws, with a sentence a
   * person reads and nothing added, for an empty name, and where the store
   * keeps no run folder to make the folder in.
   */
  addMade(name: string, adapter: string): StoredAccount {
    const named = name.trim();
    if (named === "") throw new Error("An account needs a name.");
    if (this.file === undefined) throw new Error("This daemon keeps no run folder to make an account's folder in.");
    const holder = join(dirname(this.file), MADE_FOLDERS);
    mkdirSync(holder, { recursive: true, mode: 0o700 });
    let id = this.stored.nextId;
    while (stands(join(holder, String(id)))) id += 1;
    const folder = join(holder, String(id));
    mkdirSync(folder, { mode: 0o700 });
    const account: StoredAccount = { id, name: named, adapter, folder, made: true, signedIn: null, loginEndsAt: null, limits: [] };
    this.stored.nextId = id + 1;
    this.stored.accounts.push(account);
    this.write();
    return account;
  }

  /** Keeps the agent's last word on an account's login, and answers whether it is another than the store held. It throws for an id the store keeps no account under. */
  setLogin(id: number, { signedIn, loginEndsAt }: { signedIn: boolean; loginEndsAt: number | null }): boolean {
    const account = this.account(id);
    if (account === undefined) throw new Error(`No account ${String(id)} is kept.`);
    if (account.signedIn === signedIn && account.loginEndsAt === loginEndsAt) return false;
    account.signedIn = signedIn;
    account.loginEndsAt = loginEndsAt;
    this.write();
    return true;
  }

  /**
   * Removes an account, and answers whether the default was that account,
   * which then is System default again. A folder the store made is removed
   * with everything in it, a link in it removed as a link and what it leads
   * to left as it is. A folder handed over is left as it is. It throws, with
   * a sentence a person reads and nothing removed, for System default and an
   * id the store keeps no account under, and where the made folder could not
   * be removed.
   */
  remove(id: number): boolean {
    if (id === SYSTEM_DEFAULT_ID) throw new Error(`${SYSTEM_DEFAULT_NAME} is never removed.`);
    const account = this.account(id);
    if (account === undefined) throw new Error(`No account ${String(id)} is kept.`);
    if (account.made) rmSync(account.folder, { recursive: true, force: true });
    this.stored.accounts = this.stored.accounts.filter((kept) => kept.id !== id);
    const wasDefault = this.stored.defaultId === id;
    if (wasDefault) this.stored.defaultId = SYSTEM_DEFAULT_ID;
    this.write();
    return wasDefault;
  }

  /** Names the default account, and answers whether it is another than it was. It throws for an id the store keeps no account under, and names nothing. */
  setDefault(id: number): boolean {
    if (!this.holds(id)) throw new Error(`No account ${String(id)} is kept.`);
    if (id === this.stored.defaultId) return false;
    this.stored.defaultId = id;
    this.write();
    return true;
  }

  /** Gives an account another name, kept without the white space at its ends, and answers whether it is another than it was. It throws, with a sentence a person reads and nothing renamed, for System default, which keeps its name, for an id the store keeps no account under, and for an empty name. */
  rename(id: number, name: string): boolean {
    if (id === SYSTEM_DEFAULT_ID) throw new Error(`${SYSTEM_DEFAULT_NAME} keeps its name.`);
    const account = this.account(id);
    if (account === undefined) throw new Error(`No account ${String(id)} is kept.`);
    const named = name.trim();
    if (named === "") throw new Error("An account needs a name.");
    if (named === account.name) return false;
    account.name = named;
    this.write();
    return true;
  }

  private write(): void {
    if (this.file === undefined) return;
    writeWholeFile(this.file, JSON.stringify(this.stored));
  }
}
