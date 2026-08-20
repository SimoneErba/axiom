import { makeLog } from "./gameState";
import { triggerProphecies } from "./prophecyEngine";
import type { GameState } from "./types";

export function produceVillage(state: GameState) {
  const millet = state.village.fields;
  const water = state.village.wells;
  state.resources.millet += millet;
  state.resources.water += water;
  state.log.push(makeLog(state.round, `Produzione: +${millet} miglio dai campi, +${water} acqua dai pozzi.`, "good"));
  triggerProphecies(state, "produce-millet");
  triggerProphecies(state, "produce-water");
}
