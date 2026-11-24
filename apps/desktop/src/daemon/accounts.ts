import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { type Account, SYSTEM_DEFAULT_ID, SYSTEM_DEFAULT_NAME } from "../shared/protocol";
import { writeWholeFile } from "./whole-file";

const FILE = "accounts.json";

/** An account as the store keeps it: the name a person gave it, the adapter whose agent it is a login of, its config folder, and whether Owlery made that folder. */
export interface StoredAccount {
  id: number;
  name: string;
  adapter: string;
  folder: string;
  made: boolean;
}

/** What `accounts.json` holds: the id the next account takes, the default account's id, and the accounts. */
interface Stored {
  nextId: number;
  defaultId: number;
  accounts: StoredAccount[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function isStoredAccount(value: unknown): value is StoredAccount {
  return isRecord(value) && Number.isInteger(value.id) && (value.id as number) > SYSTEM_DEFAULT_ID && typeof value.name === "string" && typeof value.adapter === "string" && typeof value.folder === "string" && typeof value.made === "boolean";
}

function isStored(value: unknown): value is Stored {
  return isRecord(value) && Number.isInteger(value.nextId) && Number.isInteger(value.defaultId) && Array.isArray(value.accounts) && value.accounts.every(isStoredAccount);
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
 * default, and a file that is no store as no account. The store reads no file
 * inside a folder and writes none there. Given no run directory, the store is
 * kept in memory alone.
 */
export class AccountStore {
  private readonly file: string | undefined;
  private stored: Stored = { nextId: SYSTEM_DEFAULT_ID + 1, defaultId: SYSTEM_DEFAULT_ID, accounts: [] };

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
    const accounts = value.accounts.map(({ id, name, adapter, folder, made }) => ({ id, name, adapter, folder, made }));
    const highest = accounts.reduce((most, account) => Math.max(most, account.id), SYSTEM_DEFAULT_ID);
    this.stored = {
      nextId: Math.max(value.nextId, highest + 1),
      defaultId: accounts.some((account) => account.id === value.defaultId) ? value.defaultId : SYSTEM_DEFAULT_ID,
      accounts,
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

  /** The accounts as a client is sent them: System default first, then the others in the order they were added. */
  listed(): Account[] {
    return [{ id: SYSTEM_DEFAULT_ID, name: SYSTEM_DEFAULT_NAME, made: false, folder: null }, ...this.stored.accounts.map(({ id, name, made, folder }) => ({ id, name, made, folder }))];
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
    const account: StoredAccount = { id: this.stored.nextId++, name: named, adapter, folder: path, made: false };
    this.stored.accounts.push(account);
    this.write();
    return account;
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
