import type { TileInfo } from "~/types";

const Tile = (props: TileInfo) => {
  return <div class={`tile ${props.color} ${props.anim}`}>{props.letter}</div>;
};

export default Tile;
