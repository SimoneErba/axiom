import { CARD_COSTS, INITIAL_RESOURCES, INITIAL_VILLAGE } from "./balance";
import { CARD_DATA } from "./cards";
import { createDeck, draw } from "./deck";
import { initializeMarket } from "./market";
import type { Card, DeckKey, GameLogEntry, GameState, ResourcePool } from "./types";

const DECK_KEYS: DeckKey[] = ["when", "if", "gain1", "gain2", "gain3", "advanced"];

function logEntry(round: number, text: string, tone: GameLogEntry["tone"] = "normal"): GameLogEntry {
  return { id: `${Date.now()}-${Math.random()}`, round, text, tone };
}

export function makeLog(round: number, text: string, tone: GameLogEntry["tone"] = "normal") { return logEntry(round, text, tone); }

export function createInitialState(): GameState {
  let seed = Date.now() >>> 0;
  const decks = {} as GameState["decks"];
  for (const key of DECK_KEYS) {
    const created = createDeck(CARD_DATA[key], seed);
    decks[key] = created.deck;
    seed = created.seed;
  }
  const hand: Card[] = [];
  for (const key of ["when", "when", "if", "if", "gain1", "gain1"] as DeckKey[]) {
    const result = draw(decks[key], 1, seed);
    if (result.cards[0]) hand.push(result.cards[0]);
    seed = result.seed;
  }
  for (const key of DECK_KEYS) seed = initializeMarket(decks[key], seed);
  return {
    round: 1, turnResolutions: 0, won: false, season: "rainy", phase: "actions", resources: { ...INITIAL_RESOURCES }, decks, hand, prophecies: [], seed,
    log: [logEntry(1, "Il villaggio è pronto a interpretare i presagi.", "ritual"), logEntry(1, "È iniziata la stagione delle piogge.", "good")],
    village: { ...INITIAL_VILLAGE }, passed: false, events: [],
  };
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function canPay(resources: ResourcePool, cost: Partial<ResourcePool>) {
  return Object.entries(cost).every(([resource, amount]) => resources[resource as keyof ResourcePool] >= (amount ?? 0));
}

export function pay(resources: ResourcePool, cost: Partial<ResourcePool>) {
  Object.entries(cost).forEach(([resource, amount]) => { resources[resource as keyof ResourcePool] -= amount ?? 0; });
}

export function costFor(card: Card) { return card.cost ?? CARD_COSTS[card.type] ?? {}; }

export const deckKeys = DECK_KEYS;
