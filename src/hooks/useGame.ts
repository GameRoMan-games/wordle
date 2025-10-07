import { createSignal, batch, type Accessor } from "solid-js";

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

import { getTileColors } from "~/lib/get-tile-colors";
import { showNotification } from "~/lib/show-notification";
import { createLocalStorageSignal } from "~/lib/create-local-storage-signal";
import { updateThemeState } from "~/lib/update-theme-state";
import { showSharePopup } from "~/lib/show-share-popup";

const EMPTY_STATS_STATE: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0],
};

function getArrayFullOf<T, Length extends number = number>(
  item: T,
  { length }: { length: Length }
): T[] {
  return Array.from({ length }, () => window.structuredClone(item));
}

function getEmptyTiles(): TileInfo[] {
  const tiles = getArrayFullOf<TileInfo>(
    { letter: "", color: "", anim: "" },
    { length: CONFIG.maxGuesses * CONFIG.wordLength }
  );

  return tiles;
}

export function useGame() {
  const STORAGE_WORDLE_STATS_KEY = "wordle-stats";
  const [stats, setStats] = createLocalStorageSignal<Stats>(
    STORAGE_WORDLE_STATS_KEY,
    EMPTY_STATS_STATE
  );

  const { getSettings, setSettings } = useSettings();

  const [getState, setState] = createSignal<State>("loading");
  const [getGameMode, setGameMode] = createSignal<GameMode | null>(null);

  const [currentSection, setCurrentSection] =
    createSignal<CurrentSection>("game");

  const [getSecretWord, setSecretWord] = createSignal<string>("");

  const [getCurrentRow, setCurrentRow] = createSignal<number>(0);
  const [getCurrentTile, setCurrentTile] = createSignal<number>(0);

  const [getGuesses, setGuesses] = createSignal<string[]>([]);

  const [keycolors, setKeycolors] = createSignal<Record<string, KeyColor>>({});

  const [tiles, setTiles] = createSignal<TileInfo[]>(getEmptyTiles());

  function updateSettings(settings: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...settings }));
    updateThemeState(getSettings().theme);
  }

  function updateStats(isWin: boolean) {
    const gamesPlayed = stats().gamesPlayed + 1;

    if (!isWin) {
      setStats({ ...stats(), gamesPlayed, currentStreak: 0 });
      return;
    }

    const guessDistribution = window.structuredClone(stats().guessDistribution);
    guessDistribution[getCurrentRow()]!++;

    setStats({
      ...stats(),
      gamesPlayed,
      gamesWon: stats().gamesWon + 1,
      currentStreak: stats().currentStreak + 1,
      maxStreak: Math.max(stats().maxStreak, stats().currentStreak),
      guessDistribution,
    });
  }

  function finishGame(isWin: boolean) {
    setState("gameover");
    updateStats(isWin);
    showSharePopup({
      isWin,
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

  function submitGuess(guess: string) {
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
      if (getCurrentTile() !== CONFIG.wordLength) return;
      const guess = getGuesses()[getCurrentRow()]!.toLowerCase();
      submitGuess(guess);
      return;
    }

    if (key === "Delete") {
      if (getCurrentTile() === 0) return;

      const tileIndex =
        getCurrentRow() * CONFIG.wordLength + (getCurrentTile() - 1);

      setTiles((prev) => {
        const copy = [...prev];
        copy[tileIndex] = { ...copy[tileIndex]!, letter: "", anim: "" };
        return copy;
      });

      const guesses = window.structuredClone(getGuesses());
      guesses[getCurrentRow()] = guesses[getCurrentRow()]!.slice(0, -1);
      setGuesses(guesses);

      setCurrentTile(getCurrentTile() - 1);
      return;
    }

    if (getCurrentTile() >= CONFIG.wordLength) return;

    const tileIndex = getCurrentRow() * CONFIG.wordLength + getCurrentTile();

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

    setCurrentTile(getCurrentTile() + 1);
  }

  const initThemeWatcher = (getTheme: Accessor<Theme>) => {
    const theme = getTheme();
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        updateThemeState(theme);
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
    initThemeWatcher(() => getSettings().theme);
    fetchWords().then(() => initializeGame("daily"));
    initKeyPressHandling();
  }

  return {
    getState,

    getGameMode,

    currentSection,
    setCurrentSection,

    stats,

    getSettings,
    updateSettings,

    tiles,
    keycolors,

    initializeGame,

    handleKeyPress,

    init,
  };
}
