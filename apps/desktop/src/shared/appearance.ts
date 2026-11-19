// A client's own appearance: the themes the window can draw in, and the
// choice a person makes among them. The main process keeps the choice and
// opens the window on its ground, the preload puts the theme on the page
// before it is drawn, and the page changes it, so all three read it here. The
// daemon does not learn of it (docs/architecture.md, The phone).

/** The themes, each one block of src/renderer/themes.css, named as the page's `data-theme` names it. */
export const THEMES = ["night-desk", "letter"] as const;
export type Theme = (typeof THEMES)[number];

/** What a person chooses: one of the themes, or to match the system's appearance. */
export type ThemeChoice = Theme | "system";

/** The choices in the order the control offers them, each with the words a person reads. */
export const THEME_CHOICES: readonly { value: ThemeChoice; label: string }[] = [
  { value: "night-desk", label: "Night desk" },
  { value: "letter", label: "Letter" },
  { value: "system", label: "Match the system" },
];

/** The theme a choice gives: the one chosen, or under "Match the system" Night desk where the system's appearance is dark and Letter where it is light. */
export function themeFor(choice: ThemeChoice, systemIsDark: boolean): Theme {
  if (choice !== "system") return choice;
  return systemIsDark ? "night-desk" : "letter";
}

/** Reads a value that came from a file or from another process as a choice. Anything that is not one of the three is Night desk, the theme of a first run. */
export function themeChoice(value: unknown): ThemeChoice {
  return THEME_CHOICES.find((choice) => choice.value === value)?.value ?? "night-desk";
}
