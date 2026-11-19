import { describe, expect, it } from "vitest";
import { quitsWithLastWindow, startsInBackground, takeBackground } from "../src/main/background";

describe("startsInBackground", () => {
  it("starts the app in the background for the value 1", () => {
    expect(startsInBackground({ OWLERY_BACKGROUND: "1" })).toBe(true);
  });

  it.each([
    ["without the variable", {}],
    ["with the variable empty", { OWLERY_BACKGROUND: "" }],
    ["with the value 0", { OWLERY_BACKGROUND: "0" }],
    ["with the value true", { OWLERY_BACKGROUND: "true" }],
  ])("starts the app as it ships %s", (_name, env) => {
    expect(startsInBackground(env)).toBe(false);
  });
});

describe("takeBackground", () => {
  it("answers as startsInBackground and leaves the environment without the variable", () => {
    const env: NodeJS.ProcessEnv = { OWLERY_BACKGROUND: "1", HOME: "/Users/x" };
    expect(takeBackground(env)).toBe(true);
    expect(env).toEqual({ HOME: "/Users/x" });
  });

  it("takes the variable out where its value does not start the app in the background", () => {
    const env: NodeJS.ProcessEnv = { OWLERY_BACKGROUND: "0", HOME: "/Users/x" };
    expect(takeBackground(env)).toBe(false);
    expect(env).toEqual({ HOME: "/Users/x" });
  });
});

describe("quitsWithLastWindow", () => {
  it("quits on macOS in the background, where no Dock icon or menu bar reaches the app", () => {
    expect(quitsWithLastWindow("darwin", true)).toBe(true);
  });

  it("stays on macOS as it ships, and quits on another platform", () => {
    expect(quitsWithLastWindow("darwin", false)).toBe(false);
    expect(quitsWithLastWindow("linux", false)).toBe(true);
  });
});
