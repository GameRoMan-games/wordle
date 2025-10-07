import { getGuessPattern } from "./get-guess-patern";
import { showNotification } from "./show-notification";

export function showSharePopup({
  isWin,
  guesses,
  secretWord,
}: {
  isWin: boolean;
  guesses: string[];
  secretWord: string;
}) {
  const attempts = guesses.length;
  const pattern = getGuessPattern(guesses, secretWord);

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
    const topText = isWin
      ? `I guessed a word in Wordle in ${attempts} attempts`
      : `I did not guess a word in Wordle`;
    const shareText = `${topText}\n\n${pattern}\n\nPlay on ${window.location.href}`;

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
