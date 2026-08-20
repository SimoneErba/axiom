import type { Resource, ResourcePool } from "./types";

export const INITIAL_RESOURCES: ResourcePool = { water: 3, millet: 4, goat: 2, cow: 1, wood: 3, stone: 2, gold: 5, blood: 0, incense: 0 };
export const INITIAL_VILLAGE = { fields: 2, wells: 1, goats: 2, cows: 1 };
export const MARKET_SIZE = 3;
export const MAX_EFFECT_RESOLUTIONS_PER_ACTION = 100;
export const VICTORY_RESOLUTIONS_PER_ROUND = 10;
export const BASE_ACTION_VALUES = {
  gatherWater: { rainy: 3, dry: 1 }, gatherMillet: { rainy: 3, dry: 1 }, gatherWood: 2, gatherStone: 2,
  breedGoat: { cost: { millet: 2, water: 1 }, gain: 1 }, breedCow: { cost: { millet: 3, water: 2 }, gain: 1 },
  buyIncense: { cost: { gold: 2 }, gain: 1 }, sacrificeGoat: 1, sacrificeCow: 2,
} as const;
export const CARD_COSTS: Record<string, Partial<Record<Resource, number>>> = {
  when: { gold: 1 }, if: { gold: 1 }, gain1: { gold: 1 }, gain2: { gold: 2 }, gain3: { gold: 2, incense: 1 }, advanced: { blood: 1 },
};
export const OMEN_COST: Partial<Record<Resource, number>> = { incense: 1 };
export const TRADE_RATES: Array<{ from: keyof ResourcePool; amount: number; to: keyof ResourcePool; result: number }> = [
  { from: "millet", amount: 2, to: "gold", result: 1 }, { from: "water", amount: 2, to: "gold", result: 1 },
  { from: "wood", amount: 1, to: "gold", result: 1 }, { from: "stone", amount: 1, to: "gold", result: 1 },
  { from: "gold", amount: 2, to: "incense", result: 1 },
];

export function formatCost(cost: Partial<Record<Resource, number>>) {
  return Object.entries(cost).map(([resource, amount]) => `${amount}${resource}`).join(" · ");
}
