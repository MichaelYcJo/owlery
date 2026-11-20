// Whether the window may go where its page asks. It imports nothing of
// Electron, so the cases read it without the app.

/**
 * True where a navigation leaves the window on the page it shows: the URL
 * asked for is the URL the window already shows, which is what a reload of
 * the page asks for. Every other URL takes the window off Owlery's own page,
 * and so does any URL while the window shows none.
 */
export function staysOnPage(asked: string, shown: string): boolean {
  return shown !== "" && asked === shown;
}
