import { CONFIG } from "~/config";
import type { TileColor } from "~/types";

// Add this helper function inside the useGame() hook
function getTileColors(guess: string, secret: string): TileColor[] {
  const tileColors: TileColor[] = Array(CONFIG.wordLength).fill("absent");
  const letterCounts = [...secret].reduce<Record<string, number>>(
    (res, char) => ((res[char] = (res[char] || 0) + 1), res),
    {}
  );

  // Pass 1: Find Correct (Green) letters
  for (let i = 0; i < CONFIG.wordLength; i++) {
    const guessLetter = guess[i]!;
    const secretLetter = secret[i]!;
    if (guessLetter === secretLetter) {
      tileColors[i] = "correct";
      letterCounts[guessLetter]!--;
    }
  }

  // Pass 2: Find Present (Yellow) and Absent (Gray) letters
  for (let i = 0; i < CONFIG.wordLength; i++) {
    if (tileColors[i] === "correct") {
      continue;
    }
    const guessLetter = guess[i]!;
    if (letterCounts[guessLetter]! > 0) {
      tileColors[i] = "present";
      letterCounts[guessLetter]!--;
    }
  }

  return tileColors;
}

export { getTileColors };
