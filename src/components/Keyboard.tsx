import { For } from "solid-js";

import { CONFIG } from "~/config";

import type {
  KeyColor,
  KeyColorOrNotColored,
  Settings,
  KeyName,
} from "~/types";

const KeyboardButton = (props: {
  name: KeyName;
  label?: string;
  width?: number;
  height?: number;
  color?: KeyColorOrNotColored;
  onClick: () => void;
}) => {
  const width: number = props.width ?? 1;
  const height: number = props.height ?? 1;

  const label: string = props.label ?? props.name;

  const color: KeyColorOrNotColored = props.color ?? "";

  return (
    <button
      class={`key ${color}`}
      onClick={props.onClick}
      style={{
        "grid-column": `span ${width}`,
        "grid-row": `span ${height}`,

        width: `calc((var(--key-size) * ${width}) + (var(--keyboard-gap) * ${
          width - 1
        }))`,
        height: `calc((var(--key-size) * ${height}) + (var(--keyboard-gap) * ${
          height - 1
        }))`,

        "font-size":
          props.name === "Enter" ? "var(--enter-key-font-size)" : undefined,
      }}
    >
      {label}
    </button>
  );
};

function getKeysArray(
  settings: Settings,
  handleKeyPress: (key: KeyName) => void,
  keycolors: Record<string, KeyColor>
) {
  const elements = [];

  const keyboardLayout = CONFIG.keyboardLayouts[settings.keyboardLayout];

  for (const key of keyboardLayout[0] + keyboardLayout[1]) {
    elements.push(
      <KeyboardButton
        name={key}
        color={keycolors[key] ?? ""}
        onClick={() => handleKeyPress(key)}
      />
    );
  }

  if (settings.keyboardLayout === "QWERTY") {
    elements.push(
      <KeyboardButton
        name={"Enter"}
        label="↵"
        width={1}
        height={2}
        onClick={() => handleKeyPress("Enter")}
      />
    );
  } else if (settings.keyboardLayout === "AZERTY") {
    elements.push(
      <KeyboardButton
        name={"Enter"}
        label="↵"
        width={2}
        height={1}
        onClick={() => handleKeyPress("Enter")}
      />
    );
  }

  for (const key of keyboardLayout[2]) {
    elements.push(
      <KeyboardButton
        name={key}
        color={keycolors[key] ?? ""}
        onClick={() => handleKeyPress(key)}
      />
    );
  }

  elements.push(
    <KeyboardButton
      name={"Delete"}
      label="⌫"
      width={2}
      height={1}
      onClick={() => handleKeyPress("Delete")}
    />
  );

  if (settings.submitButtonType === "SUBMIT") {
    elements.push(
      <KeyboardButton
        name={"Submit"}
        label="SUBMIT"
        width={10}
        height={1}
        onClick={() => handleKeyPress("Submit")}
      />
    );
  }

  return elements;
}

const Keyboard = (props: {
  settings: Settings;
  keycolors: Record<string, KeyColor>;
  handleKeyPress: (key: KeyName) => void;
}) => {
  const keysArray = () =>
    getKeysArray(props.settings, props.handleKeyPress, props.keycolors);

  return (
    <div id="keyboard">
      <For each={keysArray()}>{(key) => key}</For>
    </div>
  );
};

export default Keyboard;
