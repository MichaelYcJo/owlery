import { describe, expect, it } from "vitest";
import { staysOnPage } from "../src/main/navigation";

const PAGE = "file:///Applications/Owlery.app/Contents/Resources/app/dist/index.html";

describe("staysOnPage", () => {
  it("lets the window load the page it already shows, which is what a reload asks for", () => {
    expect(staysOnPage(PAGE, PAGE)).toBe(true);
  });

  it.each([
    ["a file a person dropped", "file:///Users/x/Desktop/shot.png"],
    ["a page of the web", "https://example.com/"],
    ["another file of the app's own folder", "file:///Applications/Owlery.app/Contents/Resources/app/dist/themes.css"],
    ["its own page with a query", `${PAGE}?next=https://example.com/`],
    ["a script", "javascript:void 0"],
    ["no address", ""],
  ])("refuses %s", (_name, asked) => {
    expect(staysOnPage(asked, PAGE)).toBe(false);
  });

  it("refuses every address while the window shows no page yet", () => {
    expect(staysOnPage("", "")).toBe(false);
    expect(staysOnPage("https://example.com/", "")).toBe(false);
  });
});
