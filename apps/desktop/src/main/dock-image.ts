// The image the main process gives the macOS Dock at its start. It imports
// nothing of Electron, so the cases read it without the app.
import { join } from "node:path";

/**
 * The image for the Dock, or none. An app started from a checkout is
 * Electron's own binary, whose bundle holds Electron's icon, so it gives the
 * Dock the PNG the build put beside its script. A packaged app gives none:
 * `setIcon` would replace the bundle's icon file, which holds a drawing for
 * 32 pixels and under and another for the larger sizes, with one image for
 * every size.
 */
export function dockImage(packaged: boolean, scriptFolder: string): string | null {
  return packaged ? null : join(scriptFolder, "app-icon.png");
}
