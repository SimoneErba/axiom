import { MAX_EFFECT_RESOLUTIONS_PER_ACTION, VICTORY_RESOLUTIONS_PER_ROUND } from "./balance";
import { draw } from "./deck";
import { canPay, makeLog } from "./gameState";
import type { Card, Condition, Effect, GameEvent, GameState, Prophecy, Resource } from "./types";

interface ResolutionContext { count: number; chain: Set<string> }

export function checkCondition(condition: Condition | undefined, state: GameState) {
  if (!condition) return true;
  if (condition.kind === "resource") return state.resources[condition.resource] >= condition.amount;
  if (condition.kind === "season") return state.season === condition.season;
  if (condition.kind === "resource-comparison") return condition.operator === "more" ? state.resources[condition.left] > state.resources[condition.right] : state.resources[condition.left] < state.resources[condition.right];
  return Object.values(state.resources).filter((amount) => amount > 0).length >= condition.amount;
}

export function triggerMatches(card: Card | undefined, trigger: string | GameEvent) {
  if (!card) return false;
  if (typeof trigger === "string") return card.trigger === trigger;
  if (trigger.type === "ACTION_PERFORMED") {
    return card.trigger === trigger.action || card.trigger === ({
      trade: "trade", buy_incense: "spend-incense", sacrifice: "sacrifice-cow", breed_goat: "gain-goat", breed_cow: "gain-cow",
    } as Record<string, string>)[trigger.action];
  }
  return card.trigger === `gain-${trigger.resource}` || card.trigger === ({ water: "produce-water", millet: "produce-millet", gold: "gain-gold", blood: "gain-blood" } as Record<string, string>)[trigger.resource];
}

function addResource(state: GameState, resource: Resource, amount: number) {
  state.resources[resource] += amount;
}

export function resolveEffect(state: GameState, effect: Effect, source: string, depth = 0, event?: GameEvent): number {
  if (depth >= MAX_EFFECT_RESOLUTIONS_PER_ACTION) {
    state.log.push(makeLog(state.round, "Il limite di sicurezza delle risoluzioni è stato raggiunto.", "warning"));
    return depth;
  }
  if (effect.kind === "gain") {
    addResource(state, effect.resource, effect.amount);
    state.log.push(makeLog(state.round, `${source}: +${effect.amount} ${effect.resource}.`, "good"));
    return depth + 1;
  }
  if (effect.kind === "gain-same" || effect.kind === "multiply-gain") {
    if (event?.resource) {
      const amount = effect.kind === "gain-same" ? effect.amount : Math.max(1, Math.round((event.amount ?? 1) * effect.multiplier));
      addResource(state, event.resource, amount);
      state.log.push(makeLog(state.round, `${source}: +${amount} ${event.resource} contestuale.`, "good"));
    }
    return depth + 1;
  }
  if (effect.kind === "convert") {
    if (state.resources[effect.from] >= effect.fromAmount) {
      state.resources[effect.from] -= effect.fromAmount;
      addResource(state, effect.to, effect.toAmount);
      state.log.push(makeLog(state.round, `${source}: convertite risorse.`, "good"));
    }
    return depth + 1;
  }
  if (effect.kind === "produce") {
    const amount = effect.building === "fields" ? state.village.fields : state.village.wells;
    const resource = effect.building === "fields" ? "millet" : "water";
    addResource(state, resource, amount * (effect.multiplier ?? 1));
    state.log.push(makeLog(state.round, `${source}: produzione di ${amount * (effect.multiplier ?? 1)} ${resource}.`, "good"));
    return depth + 1;
  }
  if (effect.kind === "repeat-production") {
    return resolveEffect(state, { kind: "produce", building: effect.building }, source, depth + 1);
  }
  if (effect.kind === "draw") {
    const result = draw(state.decks[effect.tier === "gain1" ? "gain1" : "when"], effect.amount, state.seed);
    state.seed = result.seed;
    state.hand.push(...result.cards);
    state.log.push(makeLog(state.round, `${source}: pescate ${result.cards.length} carte.`, "good"));
    return depth + 1;
  }
  return depth + 1;
}

export function resolveProphecy(state: GameState, prophecy: Prophecy, trigger: string | GameEvent, context: ResolutionContext = { count: 0, chain: new Set() }): boolean {
  if (context.count >= MAX_EFFECT_RESOLUTIONS_PER_ACTION || context.chain.has(prophecy.id) || !prophecy.active || (prophecy.when && !triggerMatches(prophecy.when, trigger)) || !checkCondition(prophecy.condition?.condition, state)) return false;
  const rituals = prophecy.upgrades;
  const sacrifice = rituals.filter((upgrade) => upgrade.advanced === "sacrifice" && upgrade.sacrificeAnimal && upgrade.sacrificeTier);
  if (sacrifice.some((upgrade) => state.resources[upgrade.sacrificeAnimal!] < 1)) return false;
  context.chain.add(prophecy.id);
  context.count += 1;
  sacrifice.forEach((upgrade) => { state.resources[upgrade.sacrificeAnimal!] -= 1; state.resources.blood += 2; });
  const baseEffect = prophecy.gain.effect;
  const sacrificeTier = Math.min(3 - Number(prophecy.gain.type.replace("gain", "")), sacrifice.reduce((sum, upgrade) => sum + (upgrade.sacrificeTier ?? 0), 0));
  const effect = baseEffect?.kind === "gain" && sacrificeTier > 0 ? { ...baseEffect, amount: baseEffect.amount + sacrificeTier } : baseEffect;
  if (effect) resolveEffect(state, effect, `Profezia #${prophecy.id.slice(-3)}`, 0, typeof trigger === "string" ? undefined : trigger);
  rituals.filter((upgrade) => upgrade.repeat).forEach((upgrade) => {
    const repeat = upgrade.repeat!;
    let iterations = 0;
    while (state.resources[repeat.resource] >= repeat.amount && context.count < MAX_EFFECT_RESOLUTIONS_PER_ACTION) {
      state.resources[repeat.resource] -= repeat.amount;
      if (effect) resolveEffect(state, effect, `RIPETI #${prophecy.id.slice(-3)}`, context.count, typeof trigger === "string" ? undefined : trigger);
      context.count += 1; iterations += 1;
    }
    if (iterations > 0) state.log.push(makeLog(state.round, `RIPETI: ${iterations} iterazioni consumando ${repeat.resource}.`, "ritual"));
  });
  rituals.filter((upgrade) => upgrade.advanced === "activate" && upgrade.targetProphecyId).forEach((upgrade) => {
    const target = state.prophecies.find((item) => item.id === upgrade.targetProphecyId);
    if (target) resolveProphecy(state, target, trigger, context);
  });
  prophecy.timesResolved += 1;
  state.turnResolutions = (state.turnResolutions ?? state.roundResolutions ?? 0) + 1;
  state.log.push(makeLog(state.round, `Profezia #${prophecy.id.slice(-3)} attivata.`, "ritual"));
  if (state.turnResolutions >= VICTORY_RESOLUTIONS_PER_ROUND) {
    state.won = true;
    state.log.push(makeLog(state.round, `Vittoria: hai risolto ${VICTORY_RESOLUTIONS_PER_ROUND} profezie in un turno.`, "good"));
  }
  context.chain.delete(prophecy.id);
  return true;
}

export function triggerProphecies(state: GameState, trigger: string | GameEvent) {
  const context: ResolutionContext = { count: 0, chain: new Set() };
  state.prophecies.forEach((prophecy) => resolveProphecy(state, prophecy, trigger, context));
}

export function addProphecy(state: GameState, prophecy: Prophecy) {
  state.prophecies.push(prophecy);
  state.log.push(makeLog(state.round, `Costruita la profezia #${prophecy.id.slice(-3)}.`, "ritual"));
  triggerProphecies(state, "build-prophecy");
}

export function canUseSacrifice(state: GameState, animal: "cow") { return state.resources[animal] > 0; }

export function freeSacrifice(state: GameState, animal: "cow") {
  if (!canUseSacrifice(state, animal)) return false;
  state.resources[animal] -= 1;
  const blood = 2;
  state.resources.blood += blood;
  state.log.push(makeLog(state.round, `Sacrificata una mucca: +${blood} sangue.`, "ritual"));
  triggerProphecies(state, "sacrifice-cow");
  triggerProphecies(state, "gain-blood");
  return true;
}

export function describeCondition(condition: Condition | undefined) {
  return condition?.kind === "resource" ? `${condition.resource} ≥ ${condition.amount}` : condition?.kind === "season" ? (condition.season === "rainy" ? "stagione delle piogge" : "stagione secca") : "condizione speciale";
}
