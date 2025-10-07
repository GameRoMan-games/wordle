import { For } from "solid-js";

import type { TileInfo } from "~/types";

import Tile from "./Tile";

const GameBoard = (props: { tiles: TileInfo[] }) => (
  <div id="game-board">
    <For each={props.tiles}>
      {(tile) => (
        <Tile letter={tile.letter} color={tile.color} anim={tile.anim} />
      )}
    </For>
  </div>
);

export default GameBoard;
