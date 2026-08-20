import { makeLog } from "./gameState";
import { triggerProphecies } from "./prophecyEngine";
import type { GameState } from "./types";

export function advanceSeason(state: GameState) {
  state.season = state.season === "rainy" ? "dry" : "rainy";
  state.log.push(makeLog(state.round, `È iniziata la stagione ${state.season === "rainy" ? "delle piogge" : "secca"}.`, "ritual"));
  triggerProphecies(state, state.season === "rainy" ? "rain-start" : "dry-start");
  if (state.season === "rainy") {
    state.log.push(makeLog(state.round, "Piove. Evento RAIN generato.", "good"));
    triggerProphecies(state, "rain");
  }
}
