import { makeLog } from "../gameState";
import { triggerProphecies } from "../prophecyEngine";
import type { BaseActionId, GameEvent, GameState, Resource } from "../types";

export function emitEvent(state: GameState, event: GameEvent) {
  state.events = [...(state.events ?? []), event].slice(-80);
  if (event.type === "ACTION_PERFORMED") {
    state.log.push(makeLog(state.round, `Azione: ${event.action}.`));
  } else {
    state.log.push(makeLog(state.round, `Evento: +${event.amount} ${event.resource}.`, "good"));
  }
  triggerProphecies(state, event);
}

export function actionEvent(action: BaseActionId, season: GameState["season"], resource?: Resource, amount?: number): GameEvent {
  return { type: "ACTION_PERFORMED", action, season, resource, amount };
}

export function resourceEvent(resource: Resource, amount: number, source: "base_action" | "prophecy" | "production" | "trade", action?: BaseActionId): GameEvent {
  return { type: "RESOURCE_GAINED", resource, amount, source, action };
}
