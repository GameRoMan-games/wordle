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
    <div class="popup game-over">
      <div
        textContent={props.title}
        style={{ fontSize: "1.5rem", marginBottom: "15px" }}
      />
      <pre
        textContent={props.pattern}
        style={{ fontFamily: "monospace", margin: "15px 0" }}
      />
      <button
        textContent="Share"
        class="content-button"
        style={{ margin: "10px 0" }}
        onClick={() => copyTextToClipboard(props.shareText)}
      />
    </div>
  ) as HTMLDivElement;

  const closeButton = (
    <button
      textContent="×"
      class="popup-close"
      onClick={() => {
        popup.classList.remove("show");
        window.setTimeout(popup.remove, 300);
      }}
    />
  ) as HTMLButtonElement;
  popup.appendChild(closeButton);

  return popup;
}

export default SharePopup;
