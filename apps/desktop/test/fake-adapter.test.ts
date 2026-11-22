import { describe, expect, it } from "vitest";
import type { RoleEvent } from "../src/daemon/adapters/adapter";
import { fakeAdapter } from "../src/daemon/adapters/fake";

/** Starts one run and gives its events once it has exited. */
async function run(adapter: ReturnType<typeof fakeAdapter>, prompt: string): Promise<RoleEvent[]> {
  const events: RoleEvent[] = [];
  await new Promise<void>((resolve, reject) => {
    adapter
      .start({ prompt, cwd: "/nowhere" }, (event) => {
        events.push(event);
        if (event.type === "exit") resolve();
      })
      .catch(reject);
  });
  return events;
}

describe("the fake adapter", () => {
  it("declares a name and no feature", () => {
    expect(fakeAdapter().name).toBe("fake");
    expect(fakeAdapter().features).toEqual([]);
  });

  it("answers a prompt with a text that quotes it, then the result and exit 0", async () => {
    expect(await run(fakeAdapter(), "Which owl?")).toEqual([
      { type: "text", text: 'You asked: "Which owl?"' },
      { type: "result", text: 'You asked: "Which owl?"', isError: false, costUsd: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
  });

  it("answers with the pieces it is given, each as one text, and their whole as the result", async () => {
    const adapter = fakeAdapter({ pieces: (prompt) => [`${prompt}: `, "a barn ", "owl"] });
    expect(await run(adapter, "Q")).toEqual([
      { type: "text", text: "Q: " },
      { type: "text", text: "a barn " },
      { type: "text", text: "owl" },
      { type: "result", text: "Q: a barn owl", isError: false, costUsd: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
  });

  it("reports nothing before the turn in which it was started ends", async () => {
    const events: RoleEvent[] = [];
    await fakeAdapter().start({ prompt: "Q", cwd: "/nowhere" }, (event) => events.push(event));
    expect(events).toEqual([]);
  });

  it("told to fail, ends with an error result and exit 1", async () => {
    expect(await run(fakeAdapter({ fail: "result" }), "Q")).toEqual([
      { type: "result", text: "the fake adapter was told to fail", isError: true, costUsd: null },
      { type: "exit", exitCode: 1, errorOutput: "" },
    ]);
  });

  it("told to exit early, exits 1 without a result", async () => {
    expect(await run(fakeAdapter({ fail: "exit" }), "Q")).toEqual([{ type: "exit", exitCode: 1, errorOutput: "" }]);
  });

  it("carries the error output it is given in each exit", async () => {
    expect(await run(fakeAdapter({ fail: "exit", errorOutput: "error: unknown option\n" }), "Q")).toEqual([{ type: "exit", exitCode: 1, errorOutput: "error: unknown option\n" }]);
    expect((await run(fakeAdapter({ errorOutput: "a warning" }), "Q")).at(-1)).toEqual({ type: "exit", exitCode: 0, errorOutput: "a warning" });
  });

  it("told not to start, starts nothing and says so", async () => {
    const events: RoleEvent[] = [];
    await expect(fakeAdapter({ fail: "start" }).start({ prompt: "Q", cwd: "/nowhere" }, (event) => events.push(event))).rejects.toThrow("the fake adapter was told not to start");
    await new Promise((r) => setTimeout(r, 20));
    expect(events).toEqual([]);
  });

  it("reports nothing more once its run is stopped, and its stop settles at once, the same promise at each call", async () => {
    const events: RoleEvent[] = [];
    const started = await fakeAdapter({ pieces: () => ["one", "two"], delayMs: 100 }).start({ prompt: "Q", cwd: "/nowhere" }, (event) => events.push(event));
    await new Promise((r) => setTimeout(r, 150));
    const stopping = started.stop();
    expect(started.stop()).toBe(stopping);
    // The stop settles at once: nothing is running to wait for.
    let settled = false;
    void stopping.then(() => (settled = true));
    await new Promise((r) => setTimeout(r, 0));
    expect(settled).toBe(true);
    await new Promise((r) => setTimeout(r, 300));
    expect(events).toEqual([{ type: "text", text: "one" }]);
  });
});
