import { For } from "solid-js";
import type { Stats } from "~/types";

const GuessDistributionRow = (props: { v: number; i: number; p: number }) => (
  <div class="guess-row">
    <div class="guess-label">{props.i + 1}</div>
    <div class="guess-bar">
      <div class="guess-bar-fill" style={{ width: `${props.p}%` }} />
      <div class="guess-count">{props.v}</div>
    </div>
  </div>
);

const GuessDistribution = (props: { guessDistribution: number[] }) => (
  <div id="guess-distribution">
    <For each={props.guessDistribution}>
      {(v, i) => (
        <GuessDistributionRow
          v={v}
          i={i()}
          p={(v / Math.max(...props.guessDistribution, 1)) * 100}
        />
      )}
    </For>
  </div>
);

const StatsContainer = (props: { stats: Stats }) => (
  <div id="stats-container" class="content-container">
    <div id="stats-grid">
      <div class="stat-box">
        <div class="stat-number" id="games-played">
          {props.stats.gamesPlayed}
        </div>
        <div class="stat-label">Played</div>
      </div>

      <div class="stat-box">
        <div class="stat-number" id="win-percentage">
          {props.stats.gamesPlayed === 0
            ? "0%"
            : Math.round(
                (props.stats.gamesWon / props.stats.gamesPlayed) * 100
              ) + "%"}
        </div>
        <div class="stat-label">Win %</div>
      </div>

      <div class="stat-box">
        <div class="stat-number" id="current-streak">
          {props.stats.currentStreak}
        </div>
        <div class="stat-label">Current Streak</div>
      </div>

      <div class="stat-box">
        <div class="stat-number" id="max-streak">
          {props.stats.maxStreak}
        </div>
        <div class="stat-label">Max Streak</div>
      </div>
    </div>

    <h3 class="my-[10px]">Guess Distribution</h3>

    <GuessDistribution guessDistribution={props.stats.guessDistribution} />
  </div>
);

export default StatsContainer;
