import type { GameMode } from "~/types";

const MenuContainer = (props: {
  initializeGame: (gameMode?: GameMode) => void;
}) => (
  <div id="menu-container" class="content-container">
    <button
      class="content-button"
      onClick={() => props.initializeGame("daily")}
    >
      Play Daily
    </button>
    <button
      class="content-button"
      onClick={() => props.initializeGame("unlimited")}
    >
      Play Unlimited
    </button>
  </div>
);

export default MenuContainer;
