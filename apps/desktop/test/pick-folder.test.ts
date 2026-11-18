import { describe, expect, it } from "vitest";
import { pickFolder } from "../src/main/pick-folder";

describe("pickFolder", () => {
  it("asks for one folder and gives the folder chosen", async () => {
    const asked: unknown[] = [];
    const folder = await pickFolder(async (options) => {
      asked.push(options);
      return { canceled: false, filePaths: ["/r/project"] };
    });
    expect(folder).toBe("/r/project");
    expect(asked).toEqual([{ title: "Choose the repository folder", properties: ["openDirectory"] }]);
  });

  it("gives null where the dialog was cancelled, whatever paths it carries", async () => {
    expect(await pickFolder(async () => ({ canceled: true, filePaths: ["/r/project"] }))).toBeNull();
  });

  it("gives null where the dialog closed with no folder", async () => {
    expect(await pickFolder(async () => ({ canceled: false, filePaths: [] }))).toBeNull();
  });
});
