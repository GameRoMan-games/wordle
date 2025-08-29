import { For } from "solid-js";
import Tile from "./Tile";

const GameBoard = (props: {
  tiles: { letter: string; color: string; anim: string }[];
}) => (
  <div id="game-board">
    <For each={props.tiles}>
      {(tile) => (
        <Tile letter={tile.letter} color={tile.color} anim={tile.anim} />
      )}
    </For>
  </div>
);

export default GameBoard;
