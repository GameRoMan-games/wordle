import { getGuessPattern } from "./get-guess-patern";
import { showNotification } from "./show-notification";

const createShareButton = (props: { text: string }) => {
  const shareButton = document.createElement("button");
  shareButton.textContent = "Share";
  shareButton.classList.add("content-button");
  shareButton.style.margin = "10px 0";
  shareButton.addEventListener("click", () => {
    navigator.clipboard
      .writeText(props.text)
      .then(() => {
        showNotification("Copied to clipboard!");
      })
      .catch(() => {
        showNotification("Failed to copy to clipboard");
      });
  });
};

export function showSharePopup({
  isWin,
  guesses,
  secretWord,
}: {
  isWin: boolean;
  guesses: string[];
  secretWord: string;
}) {
  const popup = document.createElement("div");
  popup.classList.add("popup", "game-over");

  const title = document.createElement("div");
  title.textContent = isWin
    ? "Congratulations!"
    : `Game Over! The word was ${secretWord.toUpperCase()}`;
  title.style.fontSize = "1.5rem";
  title.style.marginBottom = "15px";
  popup.appendChild(title);

  const pattern = getGuessPattern(guesses, secretWord);
  const patternDisplay = document.createElement("pre");
  patternDisplay.textContent = pattern;
  patternDisplay.style.fontFamily = "monospace";
  patternDisplay.style.margin = "15px 0";
  popup.appendChild(patternDisplay);

  const attempts = guesses.length;
  const topText = isWin
    ? `I guessed a word in Wordle in ${attempts} attempts`
    : `I did not guess a word in Wordle`;
  const shareText = `${topText}\n\n${pattern}\n\nPlay on ${window.location.href}`;
  const shareButton = createShareButton({ text: shareText });
  popup.appendChild(shareButton);

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.classList.add("popup-close");
  closeButton.addEventListener("click", () => {
    popup.classList.remove("show");
    window.setTimeout(() => {
      popup.remove();
    }, 300);
  });

  popup.appendChild(closeButton);
  document.body.appendChild(popup);

  window.setTimeout(() => {
    popup.classList.add("show");
  }, 100);
}
