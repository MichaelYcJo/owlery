// The fake adapter: it stands where the Claude adapter does and launches
// nothing, so the daemon's cases run a role session's whole flow, and the
// connector's shape is held by two adapters from the start
// (docs/architecture.md, "Rules that keep it portable", rule 3).
import { realpathSync } from "node:fs";
import { join } from "node:path";
import type { RoleStage, Usage } from "../../shared/protocol";
import type { AccountLogins, PermissionAction, RoleAdapter, RoleEvent, RoleFeature } from "./adapter";

/** One request a fake session raises. With `withdraw` the session withdraws it, and waits for no answer to it. */
export interface FakeAsk {
  tool: string;
  action: PermissionAction;
  path: string | null;
  text: string;
  withdraw?: true;
}

export interface FakeAdapterOptions {
  /** The answer to a prompt, in the pieces it arrives in, for the role the session was started with, if any. When absent the answer is a text that quotes the prompt, names the role and the stage of a session started with one, and ends with the config folder of a session started under an account's. */
  pieces?: (prompt: string, role?: RoleStage) => string[];
  /** The requests a session raises before its answer, for the prompt and the role it was started with, if any. Each is reported under the id `ask-<n>`, counted from 1 in each session. The session waits until each is answered, but for the ones it withdraws, and its answer then opens with one line for each answer it was given, in the requests' order: `allowed: <tool>` or `refused: <tool>: <reason>`. */
  asks?: (prompt: string, role?: RoleStage) => FakeAsk[];
  /** What a session does in its folder before the first piece of its answer, after its requests were answered: it is called with the folder, the prompt and the role the session was started with, if any, and awaited. A case's crafter commits a fix and appends a close block through it. */
  work?: (cwd: string, prompt: string, role?: RoleStage) => void | Promise<void>;
  /** The features the adapter declares, in place of all four. */
  features?: readonly RoleFeature[];
  /** `start`: no session starts. `result`: the turn ends with an error, and exit 1. `exit`: the process exits 1 without a result. */
  fail?: "start" | "result" | "exit";
  /** How long each event waits after the one before it. */
  delayMs?: number;
  /** What every `exit` says the process printed on its error stream; nothing when absent. */
  errorOutput?: string;
  /** What the adapter says of its agent at every call of `notice`; nothing to say when absent. */
  notice?: string;
  /** The folder the adapter answers as its default login's at every call of `defaultLoginFolder`; none, as an adapter that found none, when absent. */
  defaultLoginFolder?: string;
  /** What the adapter does with an account's folder, as its `logins`; an adapter that signs no account in when absent. A case gives the Claude Code part with a stand-in for the CLI. */
  logins?: AccountLogins;
  /** What the turn used, for the prompt and the role the session was started with, if any, on the result of a session that succeeds. Without it, and on the result of a session told to fail, the result carries no usage. */
  usage?: (prompt: string, role?: RoleStage) => Usage | null;
  /** The limit values a session's stream hands over, for the prompt and the role it was started with, if any, and whether it was started as a refresh: each is reported as a `limit` event after the pieces of the answer and before its result. None when absent. */
  limits?: (prompt: string, role: RoleStage | undefined, refresh: boolean) => Omit<Extract<RoleEvent, { type: "limit" }>, "type">[];
  /** The id and the model a session reports as its own, for the prompt and the role it was started with, if any. Without it each session reports the id `fake-<n>`, counted from 1 in each adapter, and the model `fake`. */
  session?: (prompt: string, role?: RoleStage) => { id: string; model: string | null };
}

export function fakeAdapter(options: FakeAdapterOptions = {}): RoleAdapter {
  let sessions = 0;
  return {
    name: "fake",
    features: options.features ?? ["role-tools", "permission-requests", "accounts", "limit-refresh"],
    notice: () => Promise.resolve(options.notice ?? null),
    defaultLoginFolder: () => options.defaultLoginFolder ?? null,
    // The fake keeps a folder's conversations where Claude Code does, in its `projects`, so a case links two folders' `projects` to share them.
    conversationsOf: (folder) => {
      try {
        return realpathSync(join(folder, "projects"));
      } catch {
        return null;
      }
    },
    ...(options.logins ? { logins: options.logins } : {}),
    start({ prompt, cwd, role, accountDir, refresh }, listener) {
      if (options.fail === "start") return Promise.reject(new Error("the fake adapter was told not to start"));
      const asks = options.asks?.(prompt, role) ?? [];
      const under = accountDir === undefined ? "" : ` under the config folder ${accountDir}`;
      const pieces = options.pieces?.(prompt, role) ?? [`${role ? `As the ${role.role} at the stage ${role.stage}, you asked: "${prompt}"` : `You asked: "${prompt}"`}${under}`];
      const errorOutput = options.errorOutput ?? "";
      sessions += 1;
      const named = options.session?.(prompt, role) ?? { id: `fake-${String(sessions)}`, model: "fake" };
      let stopped = false;
      let timer: NodeJS.Timeout | undefined;
      // Each event on a later turn of the event loop, as a process's output arrives. A stop leaves the wait unsettled, so nothing follows it.
      const report = (event: RoleEvent, delayMs = options.delayMs ?? 0): Promise<void> =>
        new Promise((resolve) => {
          timer = setTimeout(() => {
            listener(event);
            resolve();
          }, delayMs);
        });
      // The requests the session waits on, by their ids, each with what takes the line its answer adds to the text.
      const waiting = new Map<string, (line: string) => void>();
      const session = async (): Promise<void> => {
        // The session says who it is first, as an agent's first line does, and with no wait: `delayMs` is the wait before each event of the turn.
        await report({ type: "session", ...named }, 0);
        const lines: Promise<string>[] = [];
        for (const [index, { tool, action, path, text, withdraw }] of asks.entries()) {
          const id = `ask-${index + 1}`;
          // Held before the request is reported, because a listener may answer in the turn that reports it.
          if (!withdraw) lines.push(new Promise((resolve) => waiting.set(id, resolve)));
          await report({ type: "permission", id, tool, action, path, text });
          if (withdraw) await report({ type: "permission-withdrawn", id });
        }
        const said: string[] = [];
        for (const line of lines) {
          said.push(await line);
          if (stopped) return;
          await report({ type: "text", text: said.at(-1)! });
        }
        if (options.fail === "exit") return report({ type: "exit", exitCode: 1, errorOutput });
        if (options.fail === "result") {
          await report({ type: "result", text: "the fake adapter was told to fail", isError: true, usage: null });
          return report({ type: "exit", exitCode: 1, errorOutput });
        }
        await options.work?.(cwd, prompt, role);
        if (stopped) return;
        for (const text of pieces) await report({ type: "text", text });
        for (const limit of options.limits?.(prompt, role, refresh === true) ?? []) await report({ type: "limit", ...limit });
        await report({ type: "result", text: [...said, ...pieces].join(""), isError: false, usage: options.usage?.(prompt, role) ?? null });
        return report({ type: "exit", exitCode: 0, errorOutput });
      };
      void session();
      // No process runs, so the stop has nothing to wait for.
      const ended = Promise.resolve();
      return Promise.resolve({
        stop: () => {
          stopped = true;
          clearTimeout(timer);
          return ended;
        },
        answer: (id, answer) => {
          const asked = asks[Number(id.slice("ask-".length)) - 1];
          const take = waiting.get(id);
          if (!asked || !take) return;
          // A second answer to the same request changes nothing: its line was taken at the first.
          take(answer.allow ? `allowed: ${asked.tool}\n` : `refused: ${asked.tool}: ${answer.reason}\n`);
        },
      });
    },
  };
}
