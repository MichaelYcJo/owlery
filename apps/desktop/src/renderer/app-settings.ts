// The app's Settings dialog, which the application menu's "Settings…"
// opens, and the first click on a file a pane printed where no editor was
// chosen. It holds the editor the files a pane printed open in. The choice
// is this client's own: the main process keeps it (src/main/editor.ts), and
// the window holds what the main process last said, so a link's card and
// its click read it at once.
import type { EditorState } from "../shared/ipc";
import { byId } from "./shared";
import { fileOpener, type FileOpener } from "./view";

const dialog = byId<HTMLDialogElement>("app-settings-dialog");
const field = byId<HTMLSelectElement>("app-settings-editor");
const refusal = byId("app-settings-error");
const submit = byId<HTMLButtonElement>("app-settings-submit");

// What the main process last said: no choice and no editor, until it answers.
let editor: EditorState = { chosen: null, installed: [] };
// What a Save that names an editor does next, for the file whose click opened the dialog.
let thenOpen: (() => void) | undefined;

/** Who opens a file a pane printed, as the main process last said the choice and the editors the Mac holds (./view, `fileOpener`). */
export function editorOpener(): FileOpener {
  return fileOpener(editor);
}

/** Asks the main process again for the choice and the editors the Mac holds. */
export async function readEditorState(): Promise<void> {
  editor = await window.owlery.editor();
}

/**
 * Opens the dialog, where no other dialog or menu is open, with "Open files
 * in" offering each editor the Mac holds and "Show in Finder" last, on the
 * choice kept, or on the first editor where none was kept. Where `then` is
 * given, a Save that names an editor calls it, and a Save of "Show in
 * Finder" and a Cancel do not.
 */
export async function openSettings(then?: () => void): Promise<void> {
  if (document.querySelector('dialog[open], [role="menu"]') !== null) return;
  await readEditorState();
  // Another dialog may have opened while the main process answered.
  if (document.querySelector('dialog[open], [role="menu"]') !== null) return;
  field.replaceChildren(...editor.installed.map((name) => new Option(name, name)), new Option("Show in Finder", "finder"));
  field.value = editor.chosen !== null && [...field.options].some((option) => option.value === editor.chosen) ? editor.chosen : field.options[0]?.value ?? "finder";
  refusal.textContent = "";
  submit.disabled = false;
  thenOpen = then;
  dialog.showModal();
  field.focus();
}

/** Has the dialog's buttons act: Cancel closes it, and Save keeps the choice, closes it and, where the dialog opened at a file's click and the choice names an editor, opens that file. */
export function initSettings(): void {
  byId("app-settings-cancel").addEventListener("click", () => dialog.close());
  // A close by Escape forgets the file as Cancel does.
  dialog.addEventListener("close", () => {
    thenOpen = undefined;
  });
  byId<HTMLFormElement>("app-settings-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const chosen = field.value;
    submit.disabled = true;
    void window.owlery.saveEditor(chosen).then(async (kept) => {
      submit.disabled = false;
      if (!kept) {
        refusal.textContent = "Owlery opens files in an editor of its list, or shows them in Finder.";
        return;
      }
      await readEditorState();
      const then = thenOpen;
      dialog.close();
      if (then && typeof editorOpener() === "object") then();
    });
  });
  window.owlery.onSettingsMenu(() => void openSettings());
}
