import { describe, expect, it } from "vitest";
import { chooseFolderDialog, pickFolder } from "../src/main/pick-folder";

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

describe("chooseFolderDialog", () => {
  it("opens no dialog in the background and answers that no folder was chosen, and opens the system's otherwise", async () => {
    let opened = 0;
    const system = async () => {
      opened += 1;
      return { canceled: false, filePaths: ["/r/project"] };
    };
    expect(await pickFolder(chooseFolderDialog(true, system))).toBeNull();
    expect(opened).toBe(0);
    expect(await pickFolder(chooseFolderDialog(false, system))).toBe("/r/project");
    expect(opened).toBe(1);
  });
});
