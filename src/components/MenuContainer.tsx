import type { GameMode } from "~/types";

const MenuContainer = (props: {
  startNewGame: (gameMode?: GameMode) => void;
}) => (
  <div id="menu-container" class="content-container">
    <button
      class="content-button"
      onClick={() => props.startNewGame("daily")}
    >
      Play Daily
    </button>
    <button
      class="content-button"
      onClick={() => props.startNewGame("unlimited")}
    >
      Play Unlimited
    </button>
  </div>
);

export default MenuContainer;
