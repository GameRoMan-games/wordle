// -- state --

export type State = "loading" | "playing" | "gameover";

export type GameMode = "daily" | "unlimited";

export type CurrentSection =
  | "game"
  | "menu"
  | "settings"
  | "stats"
  | "leaderboard";

// -- state --

// -- settings --

export type Theme = "dark" | "system" | "light";
export type KeyboardLayout = "QWERTY" | "AZERTY";
export type SubmitButtonType = "ENTER" | "SUBMIT";

export type Settings = {
  theme: Theme;
  keyboardLayout: KeyboardLayout;
  submitButtonType: SubmitButtonType;
};

// -- settings --

// -- stats --

export type Stats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
};

// -- stats --

export type KeyName = "Enter" | "Submit" | "Delete" | (string & {});
export type KeyColor = "correct" | "present" | "absent" | "";

export type TileColor = KeyColor & {};
export type TileAnim = "flip" | "shake" | "pop" | "";

export type TileInfo = {
  letter: string;
  color: TileColor;
  anim: TileAnim;
};
