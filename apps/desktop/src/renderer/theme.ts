// The theme and the appearance in use, and the two controls at the sidebar's
// foot that choose them. The page's root carries the theme as `data-theme`
// and the appearance as `data-appearance`, which the preload set before the
// page was drawn; a choice, or the system's appearance turning under "Match
// the system", changes those two attributes and nothing else of the page.
// The main process keeps the choice.
import { APPEARANCE_CHOICES, appearanceFor, lookChoice, type LookChoice, THEME_CHOICES } from "../shared/appearance";
import { byId } from "./shared";

export interface ThemeActions {
  /** Has the main process keep the choice. */
  save(choice: LookChoice): Promise<void>;
  /** Called once the page is in another theme or appearance, for what takes its colours outside the page's style: the terminals. */
  changed(): void;
  /** Called where the choice was kept, so the notice that an earlier one was not is taken back. */
  saved(): void;
  /** Called where the choice could not be kept: the window is in the look chosen, and the next one opens in the look saved before. */
  notSaved(): void;
}

const themeControl = byId("theme-control");
const themes = byId<HTMLSelectElement>("theme");
const appearanceControl = byId("appearance-control");
const appearances = byId<HTMLSelectElement>("appearance");
const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)");

export function initTheme(saved: LookChoice, actions: ThemeActions): void {
  let choice = saved;
  /** Says the choice in the two controls, and puts its theme and its appearance on the page where the page is in another. */
  const show = (): void => {
    const appearance = appearanceFor(choice.appearance, systemIsDark.matches);
    themes.value = choice.theme;
    appearances.value = choice.appearance;
    themeControl.title = `Theme: ${THEME_CHOICES.find(({ value }) => value === choice.theme)?.label ?? choice.theme}`;
    appearanceControl.title = `Appearance: ${APPEARANCE_CHOICES.find(({ value }) => value === choice.appearance)?.label ?? choice.appearance}`;
    const root = document.documentElement;
    if (root.dataset.theme === choice.theme && root.dataset.appearance === appearance) return;
    root.dataset.theme = choice.theme;
    root.dataset.appearance = appearance;
    actions.changed();
  };
  /** A person's choice in either control: the two controls' values are the choice. */
  const chosen = (): void => {
    choice = lookChoice({ theme: themes.value, appearance: appearances.value });
    show();
    actions.save(choice).then(actions.saved, actions.notSaved);
  };
  themes.replaceChildren(...THEME_CHOICES.map(({ value, label }) => new Option(label, value)));
  appearances.replaceChildren(...APPEARANCE_CHOICES.map(({ value, label }) => new Option(label, value)));
  themes.addEventListener("change", chosen);
  appearances.addEventListener("change", chosen);
  // Under "Match the system" the appearance follows the system's while the window is open.
  systemIsDark.addEventListener("change", show);
  show();
}
