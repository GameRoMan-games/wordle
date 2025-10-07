import { createLocalStorageSignal } from "~/lib/create-local-storage-signal";
import { updateThemeState } from "~/lib/update-theme-state";

import type { Settings } from "~/types";

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  keyboardLayout: "QWERTY",
  submitButtonType: "ENTER",
};

const STORAGE_WORDLE_SETTINGS_KEY = "wordle-settings";

export function useSettings() {
  const [getSettings, setSettings] = createLocalStorageSignal<Settings>(
    STORAGE_WORDLE_SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  const initThemeWatcher = () => {
    const theme = getSettings().theme();
    updateThemeState(theme);
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        updateThemeState(theme);
      });
  };

  function updateSettings(settings: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...settings }));
    updateThemeState(getSettings().theme);
  }

  initThemeWatcher();

  return { getSettings, updateSettings };
}
