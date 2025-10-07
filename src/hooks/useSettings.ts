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

  return { getSettings, setSettings };
}
