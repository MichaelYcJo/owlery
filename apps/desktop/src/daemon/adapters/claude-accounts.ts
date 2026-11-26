// What is Claude Code's alone in the accounts the daemon keeps: the variable
// that names a config folder, the names of a folder that belong to the person
// and are linked into a folder Owlery made, and the CLI's own `auth` commands
// that sign a folder in, say whether it is signed in and sign it out
// (docs/architecture.md, "Authentication of the Claude adapter"), and where
// a folder keeps its conversations. The daemon reaches it through
// `AccountLogins` and `RoleAdapter.conversationsOf`, which name no vendor.
import { execFile } from "node:child_process";
import { lstatSync, realpathSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import type { AccountLogins, LoginStatus } from "./adapter";

/** The real path of the folder Claude Code keeps a config folder's conversations in, its `projects`, or null where the folder holds none. */
export function conversationsIn(folder: string): string | null {
  try {
    return realpathSync(join(folder, "projects"));
  } catch {
    return null;
  }
}

/** The variable that names the config folder Claude Code keeps a login, its state and its settings in. */
export const CONFIG_DIR_VARIABLE = "CLAUDE_CONFIG_DIR";

/**
 * The names of a config folder that belong to the person and not to a login:
 * what the person writes, what the person installed, and the conversations
 * with what resumes them. In a folder Owlery made each is a link into the
 * person's own config folder. It is an allow-list, so a name a later version
 * of the CLI adds stays the account's own until it is named here: a file of a
 * login's that got linked would join two logins with no sign.
 */
export const LINKED_NAMES: readonly string[] = [
  "CLAUDE.md",
  "settings.json",
  "keybindings.json",
  "rules",
  "skills",
  "commands",
  "agents",
  "output-styles",
  "workflows",
  "themes",
  "agent-memory",
  "plugins",
  "projects",
  "history.jsonl",
  "file-history",
  "plans",
  "tasks",
  "paste-cache",
  "session-env",
  "shell-snapshots",
];

/** How long the daemon waits for `claude auth status` or `claude auth logout` before it reads the command as failed. */
export const AUTH_TIMEOUT_MS = 15_000;

/** Whether anything stands at a path, a link that leads nowhere among it. */
function stands(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Links into `accountDir` each name of `LINKED_NAMES` that `ownDir`, the
 * person's own config folder, holds and `accountDir` holds nothing by, and
 * answers with the names it linked. A name that already stands in the
 * account's folder, as a file, a folder or a link, is left as it is, since a
 * link is never made over anything, and nothing is written into the
 * person's folder. A name it cannot link is left out, and the next call
 * tries it again.
 */
export function linkOwn(accountDir: string, ownDir: string): string[] {
  const linked: string[] = [];
  for (const name of LINKED_NAMES) {
    const own = join(ownDir, name);
    if (!stands(own)) continue;
    try {
      symlinkSync(own, join(accountDir, name));
      linked.push(name);
    } catch {
      // A name the account's folder holds already, and a folder that is gone or not writable, keep what stands, and the launch goes on.
    }
  }
  return linked;
}

/** The arguments of the CLI's own command that signs a config folder in, says whether it is signed in, or signs it out. */
export function authArgs(command: "login" | "status" | "logout"): string[] {
  return ["auth", command];
}

/**
 * Reads what `claude auth status` did: it exits 0 where a login stands and 1
 * where none does, and prints JSON whose `loginExpiresAt` is the stored
 * login's latest expected end as a date, or null (Claude Code's CLI
 * reference), and whose `email` is the login's email, which the CLI reads
 * from `oauthAccount.emailAddress` of the folder's `.claude.json` (read in
 * the executable of Claude Code 2.1.332; no real login has printed it to
 * this code). The end is null where the field is absent, null or no date.
 * The name is the email without the white space at its ends, and null where
 * no login stands, or the email is absent, no string or empty. Nothing where
 * the command exited otherwise, which says nothing of a login.
 */
export function loginStatusOf(exitCode: number, printed: string): LoginStatus | undefined {
  if (exitCode !== 0 && exitCode !== 1) return undefined;
  let read: Record<string, unknown> | null | undefined;
  try {
    read = JSON.parse(printed) as Record<string, unknown> | null;
  } catch {
    read = undefined;
  }
  const ends = read?.loginExpiresAt;
  const at = typeof ends === "string" ? Date.parse(ends) : Number.NaN;
  const printedEmail = read?.email;
  const email = exitCode === 0 && typeof printedEmail === "string" ? printedEmail.trim() : "";
  return { signedIn: exitCode === 0, loginEndsAt: Number.isFinite(at) ? at : null, name: email === "" ? null : email };
}

/** How one run of a command ended: its exit code, or null where it did not start, was killed or ran past its time, and what it printed on each stream. */
interface Ran {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

function run(command: string, args: string[], env: Record<string, string>, timeoutMs: number): Promise<Ran> {
  return new Promise((resolve) => {
    execFile(command, args, { env, encoding: "utf8", timeout: timeoutMs }, (error, stdout, stderr) => {
      const code = error === null ? 0 : typeof error.code === "number" && !error.killed ? error.code : null;
      resolve({ exitCode: code, stdout, stderr });
    }).stdin?.end();
  });
}

/** What a person is told of a command that failed: its words and how it ended, with the last line it printed on its error stream where it printed one. */
function failed(words: string, ran: Ran): Error {
  const said = ran.stderr.trim().split("\n").pop() ?? "";
  const how = ran.exitCode === null ? "did not finish" : `exited with ${String(ran.exitCode)}`;
  return new Error(`claude ${words} ${how}${said === "" ? "." : `: ${said}`}`);
}

/**
 * Claude Code's part of the accounts: `locate` finds the CLI and the PATH of
 * the person's login shell, `envOf` gives the environment a command run
 * with that PATH under a config folder is given, and `ownFolder` names the
 * person's own config folder, or null while it is not known. Links are made
 * only once that folder is known.
 */
export function claudeLogins(options: { locate: () => Promise<{ cli: string; path: string }>; envOf: (path: string, folder: string) => Record<string, string>; ownFolder: () => string | null; timeoutMs?: number }): AccountLogins {
  const { locate, envOf, ownFolder } = options;
  const timeoutMs = options.timeoutMs ?? AUTH_TIMEOUT_MS;
  return {
    furnish(folder) {
      const own = ownFolder();
      if (own !== null) linkOwn(folder, own);
    },
    async signIn(folder) {
      const { cli, path } = await locate();
      return { command: cli, args: authArgs("login"), env: envOf(path, folder) };
    },
    async status(folder) {
      const { cli, path } = await locate();
      const ran = await run(cli, authArgs("status"), envOf(path, folder), timeoutMs);
      const status = ran.exitCode === null ? undefined : loginStatusOf(ran.exitCode, ran.stdout);
      if (status === undefined) throw failed("auth status", ran);
      return status;
    },
    async signOut(folder) {
      const { cli, path } = await locate();
      const ran = await run(cli, authArgs("logout"), envOf(path, folder), timeoutMs);
      if (ran.exitCode !== 0) throw failed("auth logout", ran);
    },
  };
}
