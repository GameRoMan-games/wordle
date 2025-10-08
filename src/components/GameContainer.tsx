import { Show } from "solid-js";

import type {
  GameMode,
  Settings,
  BoardAction,
  State,
  TileInfo,
  KeyColor,
} from "~/types";

import GameBoard from "./GameBoard";
import Keyboard from "./Keyboard";

const NewGameButton = (props: { label: string; onClick: () => void }) => (
  <button class="content-button" onClick={props.onClick}>
    {props.label}
  </button>
);

const GameContainer = (props: {
  tiles: TileInfo[];

  keycolors: Record<string, KeyColor>;

  state: State;

  settings: Settings;
  handleBoardAction: (action: BoardAction) => void;

  gamemode: GameMode;
  startNewGame: (gameMode?: GameMode) => void;
}) => (
  <div id="game-container" class="content-container">
    <GameBoard tiles={props.tiles} />

    <Show when={props.state === "playing"}>
      <Keyboard
        settings={props.settings}
        keycolors={props.keycolors}
        handleBoardAction={props.handleBoardAction}
      />
    </Show>

    <Show when={props.state === "gameover"}>
      <NewGameButton
        label={props.gamemode === "unlimited" ? "New Game" : "Play Unlimited"}
        onClick={() => props.startNewGame("unlimited")}
      />
    </Show>
  </div>
);

export default GameContainer;
