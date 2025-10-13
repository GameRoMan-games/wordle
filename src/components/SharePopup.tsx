import { showNotification } from "~/lib/show-notification";

const copyTextToClipboard = (text: string) =>
  navigator.clipboard
    .writeText(text)
    .then(() => showNotification("Copied to clipboard!"))
    .catch(() => showNotification("Failed to copy to clipboard"));

function SharePopup(props: {
  isWin: boolean;
  title: string;
  pattern: string;
  shareText: string;
}) {
  const popup = (
    <div class="notification game-over">
      <div
        textContent={props.title}
        style={{ "font-size": "1.5rem", "margin-bottom": "15px" }}
      />
      <pre
        textContent={props.pattern}
        style={{ "font-family": "monospace", margin: "15px 0" }}
      />
      <button
        textContent="Share"
        class="content-button"
        style={{ margin: "10px 0" }}
        onClick={() => copyTextToClipboard(props.shareText)}
      />
      <button
        textContent="×"
        class="notification-close"
        onClick={() => {
          popup.classList.remove("show");
          window.setTimeout(() => popup.remove(), 300);
        }}
      />
    </div>
  ) as HTMLDivElement;

  return popup;
}

export default SharePopup;
