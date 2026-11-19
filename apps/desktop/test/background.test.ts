import { describe, expect, it } from "vitest";
import { startsInBackground } from "../src/main/background";

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
