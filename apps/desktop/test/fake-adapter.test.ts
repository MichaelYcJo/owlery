import { describe, expect, it } from "vitest";
import type { RoleEvent, RoleRun } from "../src/daemon/adapters/adapter";
import { fakeAdapter } from "../src/daemon/adapters/fake";
import type { RoleStage, Usage } from "../src/shared/protocol";

/** Starts one run and gives every event of it once it has exited, the session's name among them. */
async function runWhole(adapter: ReturnType<typeof fakeAdapter>, prompt: string, role?: RoleStage): Promise<RoleEvent[]> {
  const events: RoleEvent[] = [];
  await new Promise<void>((resolve, reject) => {
    adapter
      .start({ prompt, cwd: "/nowhere", ...(role ? { role } : {}) }, (event) => {
        events.push(event);
        if (event.type === "exit") resolve();
      })
      .catch(reject);
  });
  return events;
}

/** Starts one run and gives its events once it has exited, without the `session` event every run opens with, which the first case below holds. */
async function run(adapter: ReturnType<typeof fakeAdapter>, prompt: string, role?: RoleStage): Promise<RoleEvent[]> {
  return (await runWhole(adapter, prompt, role)).filter((event) => event.type !== "session");
}

describe("the fake adapter", () => {
  it("opens each run with its session's own id and its model, before a request and before its text: an id counted from 1 in each adapter and the model `fake`, or what it was given for the prompt and the role", async () => {
    const counted = fakeAdapter({ asks: () => [{ tool: "Write", action: "write", path: "/a", text: "/a", withdraw: true }] });
    expect((await runWhole(counted, "Q")).map((event) => (event.type === "session" ? `${event.type} ${event.id} ${String(event.model)}` : event.type))).toEqual(["session fake-1 fake", "permission", "permission-withdrawn", "text", "result", "exit"]);
    expect((await runWhole(counted, "Q"))[0]).toEqual({ type: "session", id: "fake-2", model: "fake" });
    // Another adapter counts its own sessions.
    expect((await runWhole(fakeAdapter(), "Q"))[0]).toEqual({ type: "session", id: "fake-1", model: "fake" });

    const given = fakeAdapter({ session: (prompt, role) => ({ id: `${prompt}-${role?.role ?? "none"}`, model: role ? null : "owl" }) });
    expect(await runWhole(given, "s", { role: "sealer", stage: "seal" })).toEqual([
      { type: "session", id: "s-sealer", model: null },
      { type: "text", text: 'As the sealer at the stage seal, you asked: "s"' },
      { type: "result", text: 'As the sealer at the stage seal, you asked: "s"', isError: false, usage: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    expect((await runWhole(given, "t"))[0]).toEqual({ type: "session", id: "t-none", model: "owl" });
    // A session told to fail still says who it is, and one told not to start says nothing.
    expect((await runWhole(fakeAdapter({ fail: "result" }), "Q")).map((event) => event.type)).toEqual(["session", "result", "exit"]);
    expect((await runWhole(fakeAdapter({ fail: "exit" }), "Q")).map((event) => event.type)).toEqual(["session", "exit"]);
  });

  it("declares its name and the two features, or the list it was told to declare in their place", () => {
    expect(fakeAdapter().name).toBe("fake");
    expect(fakeAdapter().features).toEqual(["role-tools", "permission-requests"]);
    expect(fakeAdapter({ features: ["role-tools"] }).features).toEqual(["role-tools"]);
    expect(fakeAdapter({ features: [] }).features).toEqual([]);
  });

  it("answers a prompt with a text that quotes it, then the result and exit 0", async () => {
    expect(await run(fakeAdapter(), "Which owl?")).toEqual([
      { type: "text", text: 'You asked: "Which owl?"' },
      { type: "result", text: 'You asked: "Which owl?"', isError: false, usage: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
  });

  it("answers with the pieces it is given, each as one text, and their whole as the result", async () => {
    const adapter = fakeAdapter({ pieces: (prompt) => [`${prompt}: `, "a barn ", "owl"] });
    expect(await run(adapter, "Q")).toEqual([
      { type: "text", text: "Q: " },
      { type: "text", text: "a barn " },
      { type: "text", text: "owl" },
      { type: "result", text: "Q: a barn owl", isError: false, usage: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
  });

  it("started with a role, answers with a text that names the role and the stage, and with none answers as before", async () => {
    expect(await run(fakeAdapter(), "Which owl?", { role: "proofer", stage: "round" })).toEqual([
      { type: "text", text: 'As the proofer at the stage round, you asked: "Which owl?"' },
      { type: "result", text: 'As the proofer at the stage round, you asked: "Which owl?"', isError: false, usage: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
    expect((await run(fakeAdapter(), "Q", { role: "crafter", stage: "fix-pass" }))[0]).toEqual({ type: "text", text: 'As the crafter at the stage fix-pass, you asked: "Q"' });
    expect((await run(fakeAdapter(), "Q"))[0]).toEqual({ type: "text", text: 'You asked: "Q"' });
  });

  it("gives its pieces the role it was started with, and nothing where it was started with none", async () => {
    const adapter = fakeAdapter({ pieces: (prompt, role) => [prompt, ": ", role ? `${role.role}/${role.stage}` : "no role"] });
    expect((await run(adapter, "Q", { role: "sealer", stage: "seal" })).at(-2)).toEqual({ type: "result", text: "Q: sealer/seal", isError: false, usage: null });
    expect((await run(adapter, "Q")).at(-2)).toEqual({ type: "result", text: "Q: no role", isError: false, usage: null });
  });

  it("reports nothing before the turn in which it was started ends", async () => {
    const events: RoleEvent[] = [];
    await fakeAdapter().start({ prompt: "Q", cwd: "/nowhere" }, (event) => events.push(event));
    expect(events).toEqual([]);
  });

  it("told to fail, ends with an error result and exit 1", async () => {
    expect(await run(fakeAdapter({ fail: "result" }), "Q")).toEqual([
      { type: "result", text: "the fake adapter was told to fail", isError: true, usage: null },
      { type: "exit", exitCode: 1, errorOutput: "" },
    ]);
  });

  it("reports the usage it is given on the result of a session that succeeds, for the prompt and the role it was started with, and none on a result told to fail", async () => {
    const used = (prompt: string, role?: RoleStage): Usage => ({ costUsd: 0.5, converted: true, models: [{ model: `${prompt} as ${role ? `${role.role}/${role.stage}` : "no role"}`, inputTokens: 1, outputTokens: 2, cacheReadTokens: 3, cacheWriteTokens: 4, costUsd: 0.5 }] });
    expect((await run(fakeAdapter({ usage: used }), "Q", { role: "proofer", stage: "round" })).at(-2)).toEqual({ type: "result", text: 'As the proofer at the stage round, you asked: "Q"', isError: false, usage: used("Q", { role: "proofer", stage: "round" }) });
    expect((await run(fakeAdapter({ usage: used }), "Q")).at(-2)).toMatchObject({ type: "result", usage: used("Q") });
    expect((await run(fakeAdapter({ usage: () => null }), "Q")).at(-2)).toMatchObject({ type: "result", usage: null });
    expect((await run(fakeAdapter({ usage: used, fail: "result" }), "Q")).at(-2)).toEqual({ type: "result", text: "the fake adapter was told to fail", isError: true, usage: null });
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
    const started = await fakeAdapter({ pieces: () => ["one", "two"], delayMs: 100 }).start({ prompt: "Q", cwd: "/nowhere" }, (event) => void (event.type !== "session" && events.push(event)));
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

  /** Starts one run whose listener is also given the run, and gives its events once it has exited. */
  async function answering(adapter: ReturnType<typeof fakeAdapter>, onEvent: (event: RoleEvent, run: RoleRun) => void, role?: RoleStage): Promise<RoleEvent[]> {
    const events: RoleEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      let run: RoleRun | undefined;
      adapter
        .start({ prompt: "Q", cwd: "/nowhere", ...(role ? { role } : {}) }, (event) => {
          if (event.type !== "session") events.push(event);
          onEvent(event, run!);
          if (event.type === "exit") resolve();
        })
        .then((started) => (run = started), reject);
    });
    return events;
  }

  const EDIT = { tool: "Edit", action: "write", path: "/w/a.ts", text: "/w/a.ts" } as const;
  const SHELL = { tool: "Bash", action: "run", path: null, text: "ls" } as const;

  it("raises each request it was given before its text, waits for each answer, and says in its text what each answer was, in the requests' order", async () => {
    const adapter = fakeAdapter({ asks: () => [EDIT, SHELL], pieces: () => ["done"] });
    const events = await answering(adapter, (event, run) => {
      // The second request is answered first, and the first only once both wait.
      if (event.type !== "permission" || event.id !== "ask-2") return;
      run.answer("ask-2", { allow: false, reason: "Not here." });
      run.answer("ask-1", { allow: true });
    });
    expect(events).toEqual([
      { type: "permission", id: "ask-1", ...EDIT },
      { type: "permission", id: "ask-2", ...SHELL },
      { type: "text", text: "allowed: Edit\n" },
      { type: "text", text: "refused: Bash: Not here.\n" },
      { type: "text", text: "done" },
      { type: "result", text: "allowed: Edit\nrefused: Bash: Not here.\ndone", isError: false, usage: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
  });

  it("goes on only once a request is answered: until then it reports the request and nothing after it", async () => {
    const events: RoleEvent[] = [];
    const started = await fakeAdapter({ asks: () => [SHELL] }).start({ prompt: "Q", cwd: "/nowhere" }, (event) => void (event.type !== "session" && events.push(event)));
    await new Promise((r) => setTimeout(r, 100));
    expect(events).toEqual([{ type: "permission", id: "ask-1", ...SHELL }]);
    // An id it does not wait on is ignored.
    started.answer("ask-7", { allow: true });
    await new Promise((r) => setTimeout(r, 50));
    expect(events).toHaveLength(1);
    started.answer("ask-1", { allow: true });
    // A second answer to the same request is ignored.
    started.answer("ask-1", { allow: false, reason: "Too late." });
    await new Promise((r) => setTimeout(r, 100));
    expect(events.map((event) => (event.type === "text" || event.type === "result" ? event.text : event.type))).toEqual(["permission", "allowed: Bash\n", 'You asked: "Q"', 'allowed: Bash\nYou asked: "Q"', "exit"]);
  });

  it("answers a request in the turn that reports it, where the listener does", async () => {
    const events = await answering(fakeAdapter({ asks: () => [SHELL] }), (event, run) => {
      if (event.type === "permission") run.answer(event.id, { allow: false, reason: "No." });
    });
    expect(events.at(-2)).toEqual({ type: "result", text: 'refused: Bash: No.\nYou asked: "Q"', isError: false, usage: null });
  });

  it("gives its requests the prompt and the role it was started with, as it gives its pieces", async () => {
    const adapter = fakeAdapter({ asks: (prompt, role) => [{ tool: "Bash", action: "run", path: null, text: `${prompt} as ${role ? `${role.role}/${role.stage}` : "no role"}` }] });
    const allow = (event: RoleEvent, run: RoleRun): void => {
      if (event.type === "permission") run.answer(event.id, { allow: true });
    };
    expect((await answering(adapter, allow, { role: "crafter", stage: "fix-pass" }))[0]).toMatchObject({ type: "permission", text: "Q as crafter/fix-pass" });
    expect((await answering(adapter, allow))[0]).toMatchObject({ type: "permission", text: "Q as no role" });
  });

  it("withdraws a request it was told to withdraw: it reports the request, then that it waits no more, puts nothing of it in its text, and ignores a later answer", async () => {
    const adapter = fakeAdapter({ asks: () => [{ ...SHELL, withdraw: true }, EDIT] });
    const events = await answering(adapter, (event, run) => {
      if (event.type === "permission-withdrawn") run.answer("ask-1", { allow: true });
      if (event.type === "permission" && event.id === "ask-2") run.answer("ask-2", { allow: true });
    });
    expect(events).toEqual([
      { type: "permission", id: "ask-1", ...SHELL },
      { type: "permission-withdrawn", id: "ask-1" },
      { type: "permission", id: "ask-2", ...EDIT },
      { type: "text", text: "allowed: Edit\n" },
      { type: "text", text: 'You asked: "Q"' },
      { type: "result", text: 'allowed: Edit\nYou asked: "Q"', isError: false, usage: null },
      { type: "exit", exitCode: 0, errorOutput: "" },
    ]);
  });

  it("reports nothing more of a run stopped while it waits for an answer, whatever is answered afterwards", async () => {
    const events: RoleEvent[] = [];
    const started = await fakeAdapter({ asks: () => [SHELL] }).start({ prompt: "Q", cwd: "/nowhere" }, (event) => void (event.type !== "session" && events.push(event)));
    await new Promise((r) => setTimeout(r, 50));
    await started.stop();
    started.answer("ask-1", { allow: true });
    await new Promise((r) => setTimeout(r, 100));
    expect(events).toEqual([{ type: "permission", id: "ask-1", ...SHELL }]);
  });

  it("does its work in the session's folder before the first piece of its answer and after its requests were answered, with the folder, the prompt and the role, and waits for it; and reports nothing more where it was stopped meanwhile", async () => {
    const order: string[] = [];
    let release = (): void => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const adapter = fakeAdapter({
      asks: () => [{ tool: "Bash", action: "run", path: null, text: "git commit" }],
      work: async (cwd, prompt, role) => {
        order.push(`work in ${cwd} for ${JSON.stringify(prompt)} as ${role ? `${role.role}/${role.stage}` : "no role"}`);
        await held;
        order.push("work done");
      },
    });
    let run: RoleRun | undefined;
    const exited = new Promise<void>((resolve) => {
      void adapter
        .start({ prompt: "Fix it", cwd: "/a/worktree", role: { role: "crafter", stage: "fix-pass" } }, (event) => {
          if (event.type !== "session") order.push(event.type);
          if (event.type === "permission") run?.answer(event.id, { allow: true });
          if (event.type === "exit") resolve();
        })
        .then((started) => {
          run = started;
        });
    });
    await new Promise((r) => setTimeout(r, 60));
    // The answer waits for the work: nothing of it was reported yet.
    expect(order).toEqual(["permission", "text", 'work in /a/worktree for "Fix it" as crafter/fix-pass']);
    release();
    await exited;
    expect(order).toEqual(["permission", "text", 'work in /a/worktree for "Fix it" as crafter/fix-pass', "work done", "text", "result", "exit"]);

    const events: RoleEvent[] = [];
    let stop = (): void => {};
    const stopped = fakeAdapter({ work: async () => (await new Promise((r) => setTimeout(r, 20)), stop()) });
    const second = await stopped.start({ prompt: "Q", cwd: "/nowhere" }, (event) => void (event.type !== "session" && events.push(event)));
    stop = () => void second.stop();
    await new Promise((r) => setTimeout(r, 60));
    expect(events).toEqual([]);
  });

  it("has no notice of its agent unless it is given one, and gives the one it was given at every call", async () => {
    expect(await fakeAdapter().notice()).toBeNull();
    const adapter = fakeAdapter({ notice: "The fake agent is old." });
    expect(await adapter.notice()).toBe("The fake agent is old.");
    expect(await adapter.notice()).toBe("The fake agent is old.");
  });
});
