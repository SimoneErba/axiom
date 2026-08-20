import { BASE_ACTIONS, actionGain, resourceForAction } from "../actions";
import { canPay, makeLog, pay } from "../gameState";
import { emitEvent, actionEvent, resourceEvent } from "./eventQueue";
import type { BaseActionId, GameState, Resource } from "../types";

function gain(state: GameState, resource: Resource, amount: number, action: BaseActionId, source: "base_action" | "trade" = "base_action") {
  state.resources[resource] += amount;
  emitEvent(state, resourceEvent(resource, amount, source, action));
}

export function previewAction(state: GameState, actionId: BaseActionId, target?: Resource) {
  const action = BASE_ACTIONS[actionId];
  const seasonal = actionGain(action, state.season);
  if (actionId === "trade") {
    const trade = target === "millet" || target === "water" ? 2 : 1;
    return { cost: { [target ?? "wood"]: trade } as Partial<Record<Resource, number>>, gain: { gold: 1 } as Partial<Record<Resource, number>>, label: `Vendi ${trade} ${target ?? "legno"} → +1 oro` };
  }
  if (actionId === "sacrifice") return { cost: { [target ?? "goat"]: 1 } as Partial<Record<Resource, number>>, gain: { blood: target === "cow" ? 2 : 1 } as Partial<Record<Resource, number>>, label: `Sacrifica ${target ?? "un animale"}` };
  return { cost: action.cost ?? {}, gain: seasonal, label: action.label };
}

export function performAction(state: GameState, actionId: BaseActionId, target?: Resource) {
  const action = BASE_ACTIONS[actionId];
  if (!action) return false;
  const preview = previewAction(state, actionId, target);
  if (!canPay(state.resources, preview.cost)) {
    state.log.push(makeLog(state.round, `Azione non possibile: risorse insufficienti per ${action.label}.`, "warning"));
    return false;
  }
  pay(state.resources, preview.cost);
  if (actionId === "breed_goat") state.village.goats += 1;
  if (actionId === "breed_cow") state.village.cows += 1;
  if (actionId === "sacrifice" && target === "goat") state.village.goats = Math.max(0, state.village.goats - 1);
  if (actionId === "sacrifice" && target === "cow") state.village.cows = Math.max(0, state.village.cows - 1);
  const firstResource = Object.keys(preview.gain)[0] as Resource | undefined;
  const firstAmount = firstResource ? preview.gain[firstResource] : undefined;
  emitEvent(state, actionEvent(actionId, state.season, firstResource, firstAmount));
  Object.entries(preview.gain).forEach(([resource, amount]) => gain(state, resource as Resource, amount ?? 0, actionId, actionId === "trade" ? "trade" : "base_action"));
  state.log.push(makeLog(state.round, `${action.label} completata.`, "good"));
  return true;
}

export function actionResource(actionId: BaseActionId) { return resourceForAction(actionId); }
