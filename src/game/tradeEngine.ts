import { TRADE_RATES } from "./balance";
import { makeLog } from "./gameState";
import { triggerProphecies } from "./prophecyEngine";
import type { GameState, Resource } from "./types";

export function trade(state: GameState, from: Resource) {
  const rate = TRADE_RATES.find((item) => item.from === from);
  if (!rate || state.resources[rate.from] < rate.amount) return false;
  state.resources[rate.from] -= rate.amount;
  state.resources[rate.to] += rate.result;
  state.log.push(makeLog(state.round, `Commercio: ${rate.amount} ${rate.from} → ${rate.result} ${rate.to}.`, "good"));
  triggerProphecies(state, "trade");
  return true;
}
