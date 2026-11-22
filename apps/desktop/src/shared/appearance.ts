// A client's own appearance: the themes the window can draw in, the dark and
// the light appearance each theme has, and the choice a person makes of both.
// The main process keeps the choice and opens the window on its ground, the
// preload puts the theme and the appearance on the page before it is drawn,
// and the page changes them, so all three read them here. The daemon does not
// learn of it (docs/architecture.md, The phone). docs/design.md, The themes,
// states each theme.

/** The themes, named as the page's `data-theme` names them. A first run opens in the first. */
export const THEMES = ["night-watch", "register", "desk"] as const;
export type Theme = (typeof THEMES)[number];

/** The appearances every theme has, named as the page's `data-appearance` names them. A theme in an appearance is one block of src/renderer/themes.css. */
export const APPEARANCES = ["dark", "light"] as const;
export type Appearance = (typeof APPEARANCES)[number];

/** What a person chooses for the appearance: one of the two, or to match the system's. */
export type AppearanceChoice = Appearance | "system";

/** What a person chooses for the window's look, and what `appearance.json` holds. */
export interface LookChoice {
  theme: Theme;
  appearance: AppearanceChoice;
}

/** The themes in the order their control offers them, each with the words a person reads. */
export const THEME_CHOICES: readonly { value: Theme; label: string }[] = [
  { value: "night-watch", label: "Night watch" },
  { value: "register", label: "Register" },
  { value: "desk", label: "Desk" },
];

/** The choices of appearance in the order their control offers them, each with the words a person reads. */
export const APPEARANCE_CHOICES: readonly { value: AppearanceChoice; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "Match the system" },
];

/** The choice of a first run: Night watch in the dark appearance. */
const FIRST_RUN: LookChoice = { theme: "night-watch", appearance: "dark" };

/** The appearance a choice gives: the one chosen, or under "Match the system" the system's own. */
export function appearanceFor(choice: AppearanceChoice, systemIsDark: boolean): Appearance {
  if (choice !== "system") return choice;
  return systemIsDark ? "dark" : "light";
}

/**
 * What `appearance.json` held as its `theme` before the window had three
 * themes, each a theme in one appearance or the system's, with the appearance
 * it is read as. The app reads that form and never writes it.
 */
const EARLIER: Readonly<Record<string, AppearanceChoice>> = { "night-desk": "dark", letter: "light", system: "system" };

/**
 * Reads a value that came from a file or from another process as a choice.
 * A value of the earlier form is Night watch in the appearance it named. A
 * value of neither form is the first run's choice.
 */
export function lookChoice(value: unknown): LookChoice {
  if (typeof value !== "object" || value === null) return { ...FIRST_RUN };
  const { theme, appearance } = value as { theme?: unknown; appearance?: unknown };
  if (typeof theme === "string" && Object.hasOwn(EARLIER, theme)) return { theme: "night-watch", appearance: EARLIER[theme] ?? FIRST_RUN.appearance };
  const known = THEME_CHOICES.find((choice) => choice.value === theme)?.value;
  const chosen = APPEARANCE_CHOICES.find((choice) => choice.value === appearance)?.value;
  return known !== undefined && chosen !== undefined ? { theme: known, appearance: chosen } : { ...FIRST_RUN };
}
