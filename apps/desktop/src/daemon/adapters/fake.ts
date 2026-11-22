// The fake adapter: it stands where the Claude adapter does and launches
// nothing, so the daemon's cases run a role session's whole flow, and the
// connector's shape is held by two adapters from the start
// (docs/architecture.md, "Rules that keep it portable", rule 3).
import type { RoleStage } from "../../shared/protocol";
import type { RoleAdapter, RoleEvent } from "./adapter";

export interface FakeAdapterOptions {
  /** The answer to a prompt, in the pieces it arrives in, for the role the session was started with, if any. When absent the answer is a text that quotes the prompt, and names the role and the stage of a session started with one. */
  pieces?: (prompt: string, role?: RoleStage) => string[];
  /** `start`: no session starts. `result`: the turn ends with an error, and exit 1. `exit`: the process exits 1 without a result. */
  fail?: "start" | "result" | "exit";
  /** How long each event waits after the one before it. */
  delayMs?: number;
  /** What every `exit` says the process printed on its error stream; nothing when absent. */
  errorOutput?: string;
  /** What the adapter says of its agent at every call of `notice`; nothing to say when absent. */
  notice?: string;
}

export function fakeAdapter(options: FakeAdapterOptions = {}): RoleAdapter {
  return {
    name: "fake",
    features: [],
    notice: () => Promise.resolve(options.notice ?? null),
    start({ prompt, role }, listener) {
      if (options.fail === "start") return Promise.reject(new Error("the fake adapter was told not to start"));
      const pieces = options.pieces?.(prompt, role) ?? [role ? `As the ${role.role} at the stage ${role.stage}, you asked: "${prompt}"` : `You asked: "${prompt}"`];
      const errorOutput = options.errorOutput ?? "";
      const events: RoleEvent[] =
        options.fail === "exit"
          ? [{ type: "exit", exitCode: 1, errorOutput }]
          : options.fail === "result"
            ? [
                { type: "result", text: "the fake adapter was told to fail", isError: true, costUsd: null },
                { type: "exit", exitCode: 1, errorOutput },
              ]
            : [...pieces.map((text): RoleEvent => ({ type: "text", text })), { type: "result", text: pieces.join(""), isError: false, costUsd: null }, { type: "exit", exitCode: 0, errorOutput }];
      // Each event on a later turn of the event loop, as a process's output arrives.
      let timer: NodeJS.Timeout | undefined;
      const next = (index: number): void => {
        const event = events[index];
        if (!event) return;
        timer = setTimeout(() => {
          listener(event);
          next(index + 1);
        }, options.delayMs ?? 0);
      };
      next(0);
      // No process runs, so the stop has nothing to wait for.
      const stopped = Promise.resolve();
      return Promise.resolve({
        stop: () => {
          clearTimeout(timer);
          return stopped;
        },
      });
    },
  };
}
