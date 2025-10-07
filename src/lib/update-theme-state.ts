import { Theme } from "~/types";

export function updateThemeState(theme: Theme) {
  const isSystemDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  const isDark = theme === "dark" || (theme === "system" && isSystemDark);

  if (isDark) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}
