import { describe, expect, it } from "vitest";
import { type Clipboard, chooseClipboard } from "../src/main/clipboard";

/** A stand-in for the system's clipboard that notes each call and holds a text. No case reads or writes the system's. */
function noting(held = ""): { calls: string[]; system: Clipboard } {
  const calls: string[] = [];
  let text = held;
  return {
    calls,
    system: {
      async writeText(written) {
        calls.push(`write ${written}`);
        text = written;
      },
      async readText() {
        calls.push("read");
        return text;
      },
    },
  };
}

describe("chooseClipboard", () => {
  it("keeps a clipboard of the app's own in the background: it starts empty, a text written is the text read back, and the system's is never called", async () => {
    const { calls, system } = noting("what the person copied");
    const clipboard = chooseClipboard(true, system);
    expect(await clipboard.readText()).toBe("");
    await clipboard.writeText("https://example.com/a");
    expect(await clipboard.readText()).toBe("https://example.com/a");
    await clipboard.writeText("/tmp/b");
    expect(await clipboard.readText()).toBe("/tmp/b");
    expect(calls).toEqual([]);
  });

  it("keeps each background start's clipboard apart from another's", async () => {
    const first = chooseClipboard(true, noting().system);
    await first.writeText("first");
    expect(await chooseClipboard(true, noting().system).readText()).toBe("");
  });

  it("writes and reads the system's clipboard otherwise", async () => {
    const { calls, system } = noting("what the person copied");
    const clipboard = chooseClipboard(false, system);
    expect(await clipboard.readText()).toBe("what the person copied");
    await clipboard.writeText("/tmp/b");
    expect(await clipboard.readText()).toBe("/tmp/b");
    expect(calls).toEqual(["read", "write /tmp/b", "read"]);
  });

  it.each([true, false])("writes nothing for a value that is no text (in the background: %s)", async (background) => {
    const { calls, system } = noting("kept");
    const clipboard = chooseClipboard(background, system);
    await clipboard.writeText("kept");
    for (const value of [12, ["a text in a list"], undefined, null]) await clipboard.writeText(value as unknown as string);
    expect(await clipboard.readText()).toBe("kept");
    expect(calls.filter((call) => call.startsWith("write"))).toEqual(background ? [] : ["write kept"]);
  });
});
