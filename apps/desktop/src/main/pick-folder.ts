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

/**
 * Who opens the folder dialog for this start of the app: nobody in the
 * background, so a start a test or an agent makes shows no sheet on the
 * screen of the person at the machine (#148), and the system's dialog
 * otherwise. In the background the answer is that no folder was chosen.
 */
export function chooseFolderDialog(background: boolean, system: OpenFolderDialog): OpenFolderDialog {
  if (background) return async () => ({ canceled: true, filePaths: [] });
  return system;
}
