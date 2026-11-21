// The folder dialog behind the window's "Browse…" button. The dialog itself is
// passed in, so the cases run without Electron's.

export interface FolderDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export type OpenFolderDialog = (options: { title: string; properties: ["openDirectory"] }) => Promise<FolderDialogResult>;

/** Asks for one folder, and gives its path, or null where the person chose none. */
export async function pickFolder(open: OpenFolderDialog): Promise<string | null> {
  const result = await open({ title: "Choose the repository folder", properties: ["openDirectory"] });
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
}
