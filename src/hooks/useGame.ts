import { createSignal } from "solid-js";

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
} from "~/types";

import { WORDS, CONFIG } from "~/config";

export function useGame() {
  const [currentSection, setCurrentSection] =
    createSignal<CurrentSection>("game");

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

  const [gamemode, setGamemode] = createSignal<GameMode | null>(null);

  const [state, setState] = createSignal<State>("loading");

  const [secretword, setSecretword] = createSignal<string>("");

  const [currentRow, setCurrentRow] = createSignal<number>(0);
  const [currentTile, setCurrentTile] = createSignal<number>(0);

  const [guesses, setGuesses] = createSignal<string[]>([]);

  const [keycolors, setKeycolors] = createSignal<Record<string, KeyColor>>({});

  function createTiles(): TileInfo[] {
    const tiles: TileInfo[] = [];

    for (let i = 0; i < CONFIG.maxGuesses; i++) {
      for (let j = 0; j < CONFIG.wordLength; j++) {
        tiles.push({ letter: "", color: "", anim: "" });
      }
    }

    return tiles;
  }

  const [tiles, setTiles] = createSignal<TileInfo[]>(createTiles());

  function saveData() {
    localStorage.setItem("wordle-stats", JSON.stringify(stats()));
    localStorage.setItem("wordle-settings", JSON.stringify(settings()));
  }

  function updateSettings(settings: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...settings }));
    updateThemeState();
    saveData();
  }

  function updateStats(won: boolean) {
    setStats({ ...stats(), gamesPlayed: stats().gamesPlayed + 1 });

    if (!won) {
      setStats({ ...stats(), currentStreak: 0 });
      return;
    }

    const guessDistribution = window.structuredClone(stats().guessDistribution);
    guessDistribution[currentRow()]!++;

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

    showSharePopup(won);
    updateStats(won);

    saveData();
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
    const row = currentRow();
    const guess = guesses()[row]!.toLowerCase();
    const letterCounts = [...secretword()].reduce<Record<string, number>>(
      (res, char) => ((res[char] = (res[char] || 0) + 1), res),
      {}
    );

    const newKeyColors: Record<string, KeyColor> = {};
    const flipPromises: Promise<void>[] = [];

    for (let index = 0; index < guess.length; index++) {
      const tileIndex = row * CONFIG.wordLength + index;
      const letter = guess[index]!;
      const correctLetter = secretword()[index]!;

      const color: TileColor = (() => {
        if (letter === correctLetter) {
          letterCounts[letter]!--;
          return "correct";
        }

        if (letterCounts[letter]! > 0) {
          letterCounts[letter]!--;
          return "present";
        }

        return "absent";
      })();

      const p = (async () => {
        await delay(index * DELAY_BETWEEN_FLIPS);

        await flipTile(tileIndex, color);

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

      flipPromises.push(p);
    }

    await Promise.all(flipPromises);

    setKeycolors((prev) => ({ ...prev, ...newKeyColors }));
  }

  function shakeRow() {
    const start = currentRow() * CONFIG.wordLength;
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
    const guess = guesses()[currentRow()]!.toLowerCase();

    if (!WORDS.guesses.includes(guess)) {
      shakeRow();
      showNotification(`Word ${guess.toUpperCase()} does not exist`);
      return;
    }

    colorTiles();

    if (guess === secretword()) {
      finishGame(true);
    } else if (currentRow() === CONFIG.maxGuesses - 1) {
      finishGame(false);
    } else {
      setCurrentRow(currentRow() + 1);
      setCurrentTile(0);
    }
  }

  function showSharePopup(isWin: boolean) {
    const pattern = getGuessPattern();

    const notification = document.createElement("div");
    notification.classList.add("notification", "game-over");

    const title = document.createElement("div");
    title.textContent = isWin
      ? "Congratulations!"
      : `Game Over! The word was ${secretword().toUpperCase()}`;
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
        isWin ? ` in ${currentRow() + 1} attempts` : ""
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

  let notificationTimeoutId: number | undefined | null;

  function showNotification(message: string) {
    if (notificationTimeoutId) {
      window.clearTimeout(notificationTimeoutId);
      const existingNotification = document.querySelector(".notification");
      if (existingNotification) {
        existingNotification.remove();
      }
    }

    const notification = document.createElement("div");
    notification.textContent = message;
    notification.classList.add("notification");
    document.body.appendChild(notification);

    window.setTimeout(() => {
      notification.classList.add("show");
    }, 100);

    notificationTimeoutId = window.setTimeout(() => {
      notification.classList.remove("show");
      window.setTimeout(() => {
        notification.remove();
        notificationTimeoutId = null;
      }, 300);
    }, 2000);
  }

  function updateThemeState() {
    document.body.classList.remove("dark-mode");

    const theme = settings().theme;
    const isSystemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (theme === "dark" || (theme === "system" && isSystemDark)) {
      document.body.classList.add("dark-mode");
    }
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
    setGamemode(gameMode);

    setState("playing");

    setCurrentRow(0);
    setCurrentTile(0);

    setTiles(createTiles());

    setGuesses([]);
    setKeycolors({});

    if (gameMode === "daily") {
      setSecretword(getDailyWord());
    } else if (gameMode === "unlimited") {
      const randomIndex = Math.floor(Math.random() * WORDS.answers.length);
      const randowWord = WORDS.answers[randomIndex]!;
      setSecretword(randowWord);
    }

    setCurrentSection("game");
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

    initializeGame("daily");
  }

  function handleKeyPress(key: KeyName) {
    if (state() === "gameover") return;

    if (key === "Enter" || key === "Submit") {
      if (currentTile() !== CONFIG.wordLength) return;
      submitGuess();
      return;
    }

    if (key === "Delete") {
      if (currentTile() === 0) return;

      const tileIndex = currentRow() * CONFIG.wordLength + (currentTile() - 1);

      setTiles((prev) => {
        const copy = [...prev];
        copy[tileIndex] = { ...copy[tileIndex]!, letter: "", anim: "" };
        return copy;
      });

      const guesses_ = window.structuredClone(guesses());
      guesses_[currentRow()] = guesses_[currentRow()]!.slice(0, -1);
      setGuesses(guesses_);

      setCurrentTile(currentTile() - 1);
      return;
    }

    if (currentTile() >= CONFIG.wordLength) return;

    const tileIndex = currentRow() * CONFIG.wordLength + currentTile();

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

    const guesses_ = window.structuredClone(guesses());
    guesses_[currentRow()] = (guesses_[currentRow()] || "") + key;
    setGuesses(guesses_);

    setCurrentTile(currentTile() + 1);
  }

  function loadData() {
    const savedStats = localStorage.getItem("wordle-stats");

    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    const savedSettings = localStorage.getItem("wordle-settings");

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
      updateThemeState();
    }
  }

  function init() {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        updateThemeState();
      });

    // ----

    loadData();
    updateThemeState();

    fetchWords();

    // ----

    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleKeyPress("Enter");
      } else if (event.key === "Backspace") {
        handleKeyPress("Delete");
      } else if (event.key.match(/^[a-zA-Z]$/)) {
        handleKeyPress(event.key.toUpperCase());
      }
    });
  }

  return {
    state,

    gamemode,

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
