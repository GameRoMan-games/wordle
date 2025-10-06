import { onMount, Switch, Match } from "solid-js";

import { useGame } from "~/hooks/useGame";

import TopBar from "./TopBar";

import MenuContainer from "./MenuContainer";
import GameContainer from "./GameContainer";
import StatsContainer from "./StatsContainer";
import SettingsContainer from "./SettingsContainer";
import LeaderboardContainer from "./LeaderboardContainer";

function App() {
  const {
    getState,

    getGamemode,

    currentSection,
    setCurrentSection,

    stats,
    settings,

    updateSettings,

    tiles,
    keycolors,

    initializeGame,

    handleKeyPress,

    init,
  } = useGame();

  onMount(init);

  return (
    <div id="main-container">
      <TopBar
        currentSection={currentSection()}
        setCurrentSection={setCurrentSection}
      />

      <Switch>
        <Match when={currentSection() === "menu"}>
          <MenuContainer initializeGame={initializeGame} />
        </Match>

        <Match when={currentSection() === "game"}>
          <GameContainer
            gamemode={getGamemode() ?? "unlimited"}
            settings={settings()}
            initializeGame={initializeGame}
            tiles={tiles()}
            keycolors={keycolors()}
            handleKeyPress={handleKeyPress}
            state={getState()}
          />
        </Match>

        <Match when={currentSection() === "stats"}>
          <StatsContainer stats={stats()} />
        </Match>

        <Match when={currentSection() === "settings"}>
          <SettingsContainer
            settings={settings()}
            updateSettings={updateSettings}
          />
        </Match>

        <Match when={currentSection() === "leaderboard"}>
          <LeaderboardContainer />
        </Match>
      </Switch>
    </div>
  );
}

export default App;
