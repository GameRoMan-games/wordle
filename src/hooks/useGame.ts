import { createSignal, batch } from "solid-js";

import type {
  CurrentSection,
  Stats,
  Settings,
  GameMode,
  KeyName,
  State,
  KeyColor,
  TileColor,
  TileInfo,
  Theme,
} from "~/types";

import { WORDS, CONFIG } from "~/config";

import { getGuessPattern } from "~/lib/get-guess-patern";
import { getTileColors } from "~/lib/get-tile-colors";
import { showNotification } from "~/lib/show-notification";

function getEmptyTiles(): TileInfo[] {
  const tiles: TileInfo[] = [];

  for (let i = 0; i < CONFIG.maxGuesses; i++) {
    for (let j = 0; j < CONFIG.wordLength; j++) {
      tiles.push({ letter: "", color: "", anim: "" });
    }
  }

  return tiles;
}

export function useGame() {
  const [stats, setStats] = createSignal<Stats>({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  });

  const [settings, setSettings] = createSignal<Settings>({
    theme: "system",
    keyboardLayout: "QWERTY",
    submitButtonType: "ENTER",
  });

  const [getState, setState] = createSignal<State>("loading");
  const [getGameMode, setGameMode] = createSignal<GameMode | null>(null);

  const [currentSection, setCurrentSection] =
    createSignal<CurrentSection>("game");

  const [getSecretWord, setSecretWord] = createSignal<string>("");

  const [getCurrentRow, setCurrentRow] = createSignal<number>(0);
  const [currentTile, setCurrentTile] = createSignal<number>(0);

  const [getGuesses, setGuesses] = createSignal<string[]>([]);

  const [keycolors, setKeycolors] = createSignal<Record<string, KeyColor>>({});

  const [tiles, setTiles] = createSignal<TileInfo[]>(getEmptyTiles());

  const STORAGE_WORDLE_STATS_KEY = "wordle-stats";
  const STORAGE_WORDLE_SETTINGS_KEY = "wordle-settings";

  function saveLocalData() {
    localStorage.setItem(STORAGE_WORDLE_STATS_KEY, JSON.stringify(stats()));
    localStorage.setItem(
      STORAGE_WORDLE_SETTINGS_KEY,
      JSON.stringify(settings())
    );
  }

  function loadLocalData() {
    const savedStats = localStorage.getItem(STORAGE_WORDLE_STATS_KEY);

    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      setStats(parsedStats);
    }

    const savedSettings = localStorage.getItem(STORAGE_WORDLE_SETTINGS_KEY);

    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      updateThemeState(parsedSettings.theme);
    }
  }

  function updateThemeState(theme: Theme) {
    document.body.classList.remove("dark-mode");
    const isSystemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (theme === "dark" || (theme === "system" && isSystemDark)) {
      document.body.classList.add("dark-mode");
    }
  }

  function updateSettings(settings: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...settings }));
    updateThemeState(settings().theme);
    saveLocalData();
  }

  function updateStats(won: boolean) {
    const gamesPlayed = stats().gamesPlayed + 1;
    setStats({ ...stats(), gamesPlayed });

    if (!won) {
      setStats({ ...stats(), currentStreak: 0 });
      return;
    }

    const guessDistribution = window.structuredClone(stats().guessDistribution);
    guessDistribution[getCurrentRow()]!++;

    setStats({
      ...stats(),
      gamesWon: stats().gamesWon + 1,
      currentStreak: stats().currentStreak + 1,
      maxStreak: Math.max(stats().maxStreak, stats().currentStreak),
      guessDistribution,
    });
  }

  function finishGame(won: boolean) {
    setState("gameover");
    updateStats(won);
    saveLocalData();
    showSharePopup({
      isWin: won,
      guesses: getGuesses(),
      secretWord: getSecretWord(),
    });
  }

  const FLIP_DELAY = 250;
  const DELAY_BETWEEN_FLIPS = 175;

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  async function flipTile(
    tileIndex: number,
    color: TileColor
  ): Promise<TileColor> {
    setTiles((prev) => {
      const copy = [...prev];
      copy[tileIndex] = { ...copy[tileIndex]!, anim: "flip" };
      return copy;
    });

    await delay(FLIP_DELAY);

    setTiles((prev) => {
      const copy = [...prev];
      copy[tileIndex] = { ...copy[tileIndex]!, color, anim: "" };
      return copy;
    });

    return color;
  }

  async function colorTiles() {
    const row = getCurrentRow();
    const guess = getGuesses()[row]!.toLowerCase();
    const tileColors = getTileColors(guess, getSecretWord());

    const newKeyColors: Record<string, KeyColor> = {};
    const flipPromises: Promise<void>[] = [];

    for (let index = 0; index < guess.length; index++) {
      const flipPromise = (async () => {
        await delay(index * DELAY_BETWEEN_FLIPS);

        const tileIndex = row * CONFIG.wordLength + index;
        const color: TileColor = tileColors[index]!;
        await flipTile(tileIndex, color);

        const letter = guess[index]!;
        const upper = letter.toUpperCase();
        const existing = newKeyColors[upper] || "";

        const newKeyColor = (() => {
          if (existing === "correct") {
            return "correct";
          }

          if (existing === "present" && color === "absent") {
            return "present";
          }

          return color;
        })();

        newKeyColors[upper] = newKeyColor;
      })();

      flipPromises.push(flipPromise);
    }

    await Promise.all(flipPromises);

    setKeycolors((prev) => ({ ...prev, ...newKeyColors }));
  }

  function shakeRow() {
    const start = getCurrentRow() * CONFIG.wordLength;
    const end = start + CONFIG.wordLength;

    setTiles((prev) => {
      const copy = [...prev];
      for (let i = start; i < end; i++) {
        copy[i] = { ...copy[i]!, anim: "shake" };
      }
      return copy;
    });

    window.setTimeout(() => {
      setTiles((prev) => {
        const copy = [...prev];
        for (let i = start; i < end; i++) {
          copy[i] = { ...copy[i]!, anim: "" };
        }
        return copy;
      });
    }, 500);
  }

  function submitGuess() {
    const guess = getGuesses()[getCurrentRow()]!.toLowerCase();

    if (!WORDS.guesses.includes(guess)) {
      shakeRow();
      showNotification(`Word ${guess.toUpperCase()} does not exist`);
      return;
    }

    colorTiles();

    if (guess === getSecretWord()) {
      finishGame(true);
    } else if (getCurrentRow() === CONFIG.maxGuesses - 1) {
      finishGame(false);
    } else {
      setCurrentRow(getCurrentRow() + 1);
      setCurrentTile(0);
    }
  }

  function showSharePopup({
    isWin,
    guesses,
    secretWord,
  }: {
    isWin: boolean;
    guesses: string[];
    secretWord: string;
  }) {
    const pattern = getGuessPattern(guesses, secretWord);
    const attempts = getCurrentRow() + 1;

    const notification = document.createElement("div");
    notification.classList.add("notification", "game-over");

    const title = document.createElement("div");
    title.textContent = isWin
      ? "Congratulations!"
      : `Game Over! The word was ${secretWord.toUpperCase()}`;
    title.style.fontSize = "1.5rem";
    title.style.marginBottom = "15px";
    notification.appendChild(title);

    const patternDisplay = document.createElement("pre");
    patternDisplay.textContent = pattern;
    patternDisplay.style.fontFamily = "monospace";
    patternDisplay.style.margin = "15px 0";
    notification.appendChild(patternDisplay);

    const shareButton = document.createElement("button");
    shareButton.textContent = "Share";
    shareButton.classList.add("content-button");
    shareButton.style.margin = "10px 0";
    shareButton.addEventListener("click", () => {
      const shareText = `${
        isWin ? "I guessed" : "I did not guess"
      } a word in Wordle${
        isWin ? ` in ${attempts} attempts` : ""
      }\n\n${pattern}\n\nPlay on ${window.location.href}`;

      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          showNotification("Copied to clipboard!");
        })
        .catch(() => {
          showNotification("Failed to copy to clipboard");
        });
    });

    notification.appendChild(shareButton);

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.classList.add("notification-close");
    closeButton.addEventListener("click", () => {
      notification.classList.remove("show");
      window.setTimeout(() => {
        notification.remove();
      }, 300);
    });

    notification.appendChild(closeButton);
    document.body.appendChild(notification);

    window.setTimeout(() => {
      notification.classList.add("show");
    }, 100);
  }

  function getNewWord(gameMode: GameMode) {
    const newWord = gameMode === "daily" ? getDailyWord() : getRandomWord();
    return newWord;
  }

  function getRandomWord(): string {
    const randomIndex = Math.floor(Math.random() * WORDS.answers.length);
    const randomWord = WORDS.answers[randomIndex]!;
    return randomWord;
  }

  function getDailyWord() {
    const seed = CONFIG.seed;
    const today = new Date();
    const startDate = new Date("2025-01-01");
    const daysSinceStart = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return WORDS.answers[(daysSinceStart * seed) % WORDS.answers.length]!;
  }

  function initializeGame(gameMode: GameMode = "unlimited") {
    batch(() => {
      setState("playing");
      setGameMode(gameMode);

      setCurrentRow(0);
      setCurrentTile(0);

      setTiles(getEmptyTiles());

      setGuesses([]);
      setKeycolors({});

      setSecretWord(getNewWord(gameMode));
      setCurrentSection("game");
    });
  }

  async function fetchWords() {
    try {
      const [guessesResponse, answersResponse] = await Promise.all([
        fetch(CONFIG.dataUrls.guesses),
        fetch(CONFIG.dataUrls.answers),
      ]);

      const guessesString = await guessesResponse.text();
      const answersString = await answersResponse.text();

      const guesses = guessesString.split("\n").map((word) => word.trim());
      const answers = answersString.split("\n").map((word) => word.trim());

      WORDS.guesses = guesses.concat(answers);
      WORDS.answers = answers;
    } catch (error) {
      console.error("Error fetching words:", error);
    }

    return WORDS;
  }

  function handleKeyPress(key: KeyName) {
    if (getState() === "gameover") return;

    if (key === "Enter" || key === "Submit") {
      if (currentTile() !== CONFIG.wordLength) return;
      submitGuess();
      return;
    }

    if (key === "Delete") {
      if (currentTile() === 0) return;

      const tileIndex =
        getCurrentRow() * CONFIG.wordLength + (currentTile() - 1);

      setTiles((prev) => {
        const copy = [...prev];
        copy[tileIndex] = { ...copy[tileIndex]!, letter: "", anim: "" };
        return copy;
      });

      const guesses = window.structuredClone(getGuesses());
      guesses[getCurrentRow()] = guesses[getCurrentRow()]!.slice(0, -1);
      setGuesses(guesses);

      setCurrentTile(currentTile() - 1);
      return;
    }

    if (currentTile() >= CONFIG.wordLength) return;

    const tileIndex = getCurrentRow() * CONFIG.wordLength + currentTile();

    setTiles((prev) => {
      const copy = [...prev];
      copy[tileIndex] = { ...copy[tileIndex]!, letter: key, anim: "pop" };
      return copy;
    });

    window.setTimeout(() => {
      setTiles((prev) => {
        const copy = [...prev];
        copy[tileIndex] = { ...copy[tileIndex]!, anim: "" };
        return copy;
      });
    }, 150);

    const guesses = window.structuredClone(getGuesses());
    guesses[getCurrentRow()] = (guesses[getCurrentRow()] || "") + key;
    setGuesses(guesses);

    setCurrentTile(currentTile() + 1);
  }

  const initThemeWatcher = () => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        updateThemeState();
      });
  };

  const initKeyPressHandling = () => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleKeyPress("Enter");
      } else if (event.key === "Backspace") {
        handleKeyPress("Delete");
      } else if (event.key.match(/^[a-zA-Z]$/)) {
        handleKeyPress(event.key.toUpperCase());
      }
    });
  };

  function init() {
    initThemeWatcher();

    loadLocalData();
    updateThemeState();

    fetchWords().then(() => initializeGame("daily"));

    // ----

    initKeyPressHandling();
  }

  return {
    getState,

    getGameMode,

    currentSection,
    setCurrentSection,

    stats,
    settings,

    updateSettings,

    tiles,
    keycolors,

    initializeGame,

    handleKeyPress,

    init,
  };
}
