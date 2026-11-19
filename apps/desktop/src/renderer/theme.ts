// The theme in use and the control at the sidebar's foot that chooses it.
// The page's root carries the theme as `data-theme`, which the preload set
// before the page was drawn; a choice, or the system's appearance turning
// under "Match the system", changes that one attribute and nothing else of
// the page. The main process keeps the choice.
import { THEME_CHOICES, themeFor, type ThemeChoice } from "../shared/appearance";
import { byId } from "./shared";

export interface ThemeActions {
  /** Has the main process keep the choice. */
  save(choice: ThemeChoice): Promise<void>;
  /** Called once the page is in another theme, for what takes its colours outside the page's style: the terminals. */
  changed(): void;
  /** Called where the choice could not be kept: the window is in the theme chosen, and the next one opens in the theme saved before. */
  notSaved(): void;
}

const control = byId("theme-control");
const choices = byId<HTMLSelectElement>("theme");
const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)");

export function initTheme(saved: ThemeChoice, actions: ThemeActions): void {
  let choice = saved;
  /** Says the choice in the control, and puts its theme on the page where the page is in another. */
  const show = (): void => {
    const theme = themeFor(choice, systemIsDark.matches);
    choices.value = choice;
    control.title = `Theme: ${THEME_CHOICES.find(({ value }) => value === choice)?.label ?? choice}`;
    if (document.documentElement.dataset.theme === theme) return;
    document.documentElement.dataset.theme = theme;
    actions.changed();
  };
  choices.replaceChildren(...THEME_CHOICES.map(({ value, label }) => new Option(label, value)));
  choices.addEventListener("change", () => {
    choice = choices.value as ThemeChoice;
    show();
    actions.save(choice).catch(actions.notSaved);
  });
  // Under "Match the system" the theme follows the system's appearance while the window is open.
  systemIsDark.addEventListener("change", show);
  show();
}
