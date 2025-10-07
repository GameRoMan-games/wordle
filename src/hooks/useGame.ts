import { createSignal, batch } from "solid-js";

import type {
  CurrentSection,
  GameMode,
  KeyName,
  State,
  KeyColor,
  TileColor,
  BoardAction,
} from "~/types";

import { WORDS, CONFIG } from "~/config";

import { getNewWord } from "~/lib/get-new-word";
import { getTileColors } from "~/lib/get-tile-colors";
import { showNotification } from "~/lib/show-notification";
import { showSharePopup } from "~/lib/show-share-popup";

import { useSettings } from "./useSettings";
import { useStats } from "./useStats";
import { useTiles } from "./useTiles";

export function useGame() {
  const [getState, setState] = createSignal<State>("loading");
  const [getGameMode, setGameMode] = createSignal<GameMode | null>(null);

  const { getSettings, updateSettings } = useSettings();
  const { getStats, updateStats } = useStats();

  const [currentSection, setCurrentSection] =
    createSignal<CurrentSection>("game");

  const [getSecretWord, setSecretWord] = createSignal<string>("");

  const [getCurrentRow, setCurrentRow] = createSignal<number>(0);
  const [getCurrentTile, setCurrentTile] = createSignal<number>(0);

  const [getGuesses, setGuesses] = createSignal<string[]>([]);

  const [keycolors, setKeycolors] = createSignal<Record<string, KeyColor>>({});

  const { getTiles, setTiles, resetTiles, flipTile } = useTiles();

  function finishGame(isWin: boolean) {
    setState("gameover");
    updateStats(isWin, getCurrentRow());
    showSharePopup({
      isWin,
      guesses: getGuesses(),
      secretWord: getSecretWord(),
    });
  }

  const DELAY_BETWEEN_FLIPS = 175;

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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

      resetTiles();

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

  function handleBoardAction(action: BoardAction) {
    if (getState() === "gameover") return;

    if (action === "SUBMIT-GUESS") {
      if (getCurrentTile() !== CONFIG.wordLength) return;
      const guess = getGuesses()[getCurrentRow()]!.toLowerCase();
      submitGuess(guess);
      return;
    }

    if (action === "DELETE-LETTER") {
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
  }

  function handleKeyPress(key: KeyName) {
    if (getState() === "gameover") return;

    if (key === "Enter" || key === "Submit") {
      handleBoardAction("SUBMIT-GUESS");
      return;
    }

    if (key === "Delete") {
      handleBoardAction("DELETE-LETTER");
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

  const initKeyPressHandling = () => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleBoardAction("SUBMIT-GUESS");
      } else if (event.key === "Backspace") {
        handleBoardAction("DELETE-LETTER");
      } else if (event.key.match(/^[a-zA-Z]$/)) {
        handleKeyPress(event.key.toUpperCase());
      }
    });
  };

  function init() {
    fetchWords().then(() => initializeGame("daily"));
    initKeyPressHandling();
  }

  return {
    getState,

    getGameMode,

    currentSection,
    setCurrentSection,

    getStats,

    getSettings,
    updateSettings,

    getTiles,
    keycolors,

    initializeGame,

    handleKeyPress,

    init,
  };
}
