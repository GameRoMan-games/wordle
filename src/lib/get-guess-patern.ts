import { CONFIG } from "~/config";

function getGuessPattern(guesses: string[], secretWord: string) {
  const pattern: string[] = [];

  for (const guess of guesses) {
    const rowPattern: ("🟩" | "🟨" | "⬛")[] = [];

    const letterCounts = [...secretWord].reduce<Record<string, number>>(
      (res, char) => ((res[char] = (res[char] || 0) + 1), res),
      {}
    );

    for (let i = 0; i < CONFIG.wordLength; i++) {
      const letter = guess[i]!;
      if (letter === secretWord[i]) {
        rowPattern.push("🟩");
        letterCounts[letter]!--;
      } else if (letterCounts[letter]! > 0) {
        rowPattern.push("🟨");
        letterCounts[letter]!--;
      } else {
        rowPattern.push("⬛");
      }
    }

    pattern.push(rowPattern.join(""));
  }

  return pattern.join("\n");
}

export { getGuessPattern };
