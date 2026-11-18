// The fake adapter: it stands where the Claude adapter does and launches
// nothing, so the daemon's cases run a role session's whole flow, and the
// connector's shape is held by two adapters from the start
// (docs/architecture.md, "Rules that keep it portable", rule 3).
import type { RoleAdapter, RoleEvent } from "./adapter";

export interface FakeAdapterOptions {
  /** The answer to a prompt, in the pieces it arrives in; a text that quotes the prompt when absent. */
  pieces?: (prompt: string) => string[];
  /** `start`: no session starts. `result`: the turn ends with an error, and exit 1. `exit`: the process exits 1 without a result. */
  fail?: "start" | "result" | "exit";
  /** How long each event waits after the one before it. */
  delayMs?: number;
}

export function fakeAdapter(options: FakeAdapterOptions = {}): RoleAdapter {
  return {
    name: "fake",
    features: [],
    start({ prompt }, listener) {
      if (options.fail === "start") return Promise.reject(new Error("the fake adapter was told not to start"));
      const pieces = options.pieces?.(prompt) ?? [`You asked: "${prompt}"`];
      const events: RoleEvent[] =
        options.fail === "exit"
          ? [{ type: "exit", exitCode: 1 }]
          : options.fail === "result"
            ? [
                { type: "result", text: "the fake adapter was told to fail", isError: true, costUsd: null },
                { type: "exit", exitCode: 1 },
              ]
            : [...pieces.map((text): RoleEvent => ({ type: "text", text })), { type: "result", text: pieces.join(""), isError: false, costUsd: null }, { type: "exit", exitCode: 0 }];
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
      return Promise.resolve({ stop: () => clearTimeout(timer) });
    },
  };
}
