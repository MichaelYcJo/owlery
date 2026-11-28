// layer: logic
import { describe, expect, it } from "vitest";
import { daemonControl } from "../src/main/daemon-control";

/** A promise a case settles by hand. */
function gate(): { promise: Promise<void>; open: () => void; fail: (error: Error) => void } {
  let open!: () => void;
  let fail!: (error: Error) => void;
  const promise = new Promise<void>((resolve, reject) => {
    open = resolve;
    fail = reject;
  });
  return { promise, open, fail };
}

/** A control whose start, stop and quit note each call, in order. Each stop waits on the gate the case gave it, in the order given. */
function recorded(stops: Promise<void>[] = []): { calls: string[]; control: ReturnType<typeof daemonControl<string>> } {
  const calls: string[] = [];
  const control = daemonControl({
    start: async () => {
      calls.push("start");
      return "found";
    },
    stop: async () => {
      calls.push("stop");
      await (stops.shift() ?? Promise.resolve());
      calls.push("stopped");
    },
    quit: () => void calls.push("quit"),
  });
  return { calls, control };
}

/** Lets every promise that is already settled run what waits on it. */
const turn = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe("daemonControl", () => {
  it("finds or starts the daemon at a request, and answers with what the start found", async () => {
    const { calls, control } = recorded();
    expect(await control.daemon()).toBe("found");
    expect(calls).toEqual(["start"]);
  });

  it("starts no daemon while a stop is under way: a request made then is served once the stop has ended", async () => {
    const stop = gate();
    const { calls, control } = recorded([stop.promise]);
    const ended = control.end("restart");
    const asked = control.daemon();
    await turn();
    expect(calls).toEqual(["stop"]);
    stop.open();
    expect(await ended).toBeNull();
    expect(await asked).toBe("found");
    expect(calls).toEqual(["stop", "stopped", "start"]);
  });

  it("stops no daemon while a start is under way: the stop waits for the daemon the start finds", async () => {
    const calls: string[] = [];
    const start = gate();
    const control = daemonControl({
      start: async () => {
        calls.push("start");
        await start.promise;
        calls.push("started");
        return "found";
      },
      stop: async () => void calls.push("stop"),
      quit: () => void calls.push("quit"),
    });
    const asked = control.daemon();
    const ended = control.end("restart");
    await turn();
    expect(calls).toEqual(["start"]);
    start.open();
    await asked;
    await ended;
    expect(calls).toEqual(["start", "started", "stop"]);
  });

  it("answers a restart whose stop failed with the stop's sentence, quits nothing, and serves the next request", async () => {
    const stop = gate();
    const { calls, control } = recorded([stop.promise]);
    const ended = control.end("restart");
    stop.fail(new Error("Owlery's background process did not stop. It is process 7."));
    expect(await ended).toBe("Owlery's background process did not stop. It is process 7.");
    expect(await control.daemon()).toBe("found");
    expect(calls).toEqual(["stop", "start"]);
  });

  it("refuses a request for the daemon from the moment a complete quit begins, starts none, and quits once after the stop", async () => {
    const stop = gate();
    const { calls, control } = recorded([stop.promise]);
    const ended = control.end("quit");
    await expect(control.daemon()).rejects.toThrow(new Error("Owlery is quitting."));
    expect(calls).toEqual(["stop"]);
    stop.open();
    expect(await ended).toBeNull();
    expect(calls).toEqual(["stop", "stopped", "quit"]);
    // The app is quitting still: its window's reload, a second later, starts no daemon.
    await expect(control.daemon()).rejects.toThrow(new Error("Owlery is quitting."));
    expect(await control.end("quit")).toBe("Owlery is quitting.");
    expect(await control.end("restart")).toBe("Owlery is quitting.");
    expect(calls).toEqual(["stop", "stopped", "quit"]);
  });

  it("does not quit where the stop of a complete quit failed: it answers with the stop's sentence, and serves the next request", async () => {
    const stop = gate();
    const { calls, control } = recorded([stop.promise]);
    const ended = control.end("quit");
    stop.fail(new Error("Owlery's background process did not stop. It is process 7."));
    expect(await ended).toBe("Owlery's background process did not stop. It is process 7.");
    expect(calls).toEqual(["stop"]);
    expect(await control.daemon()).toBe("found");
    expect(calls).toEqual(["stop", "start"]);
  });

  it.each([undefined, null, "", "stop", "Restart", 1, { then: "quit" }])("stops nothing and quits nothing at a request that names neither a restart nor a quit: %j", async (then) => {
    const { calls, control } = recorded();
    expect(await control.end(then)).toBe("Owlery was asked for neither a restart nor a quit.");
    expect(calls).toEqual([]);
  });
});
