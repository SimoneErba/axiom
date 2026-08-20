import type { BaseActionId, Resource, ResourcePool, Season } from "./types";
import { BASE_ACTION_VALUES } from "./balance";

export interface BaseActionDefinition {
  id: BaseActionId;
  label: string;
  icon: string;
  description: string;
  cost?: Partial<ResourcePool>;
  gain?: Partial<ResourcePool>;
  seasonalGain?: Partial<Record<Season, Partial<ResourcePool>>>;
  needsTarget?: "trade-resource" | "sacrifice-animal";
}

export const BASE_ACTIONS: Record<BaseActionId, BaseActionDefinition> = {
  gather_water: { id: "gather_water", label: "Raccogli acqua", icon: "💧", description: "Raccogli acqua dai pozzi.", gain: { water: 2 }, seasonalGain: { rainy: { water: BASE_ACTION_VALUES.gatherWater.rainy }, dry: { water: BASE_ACTION_VALUES.gatherWater.dry } } },
  gather_millet: { id: "gather_millet", label: "Raccogli miglio", icon: "🌾", description: "Raccogli miglio dai campi.", gain: { millet: 2 }, seasonalGain: { rainy: { millet: BASE_ACTION_VALUES.gatherMillet.rainy }, dry: { millet: BASE_ACTION_VALUES.gatherMillet.dry } } },
  gather_wood: { id: "gather_wood", label: "Raccogli legno", icon: "🪵", description: "Raccogli legna dal bosco.", gain: { wood: BASE_ACTION_VALUES.gatherWood } },
  gather_stone: { id: "gather_stone", label: "Estrai pietra", icon: "🪨", description: "Estrai pietra dalla cava.", gain: { stone: BASE_ACTION_VALUES.gatherStone } },
  breed_goat: { id: "breed_goat", label: "Alleva capra", icon: "🐐", description: "Nutri una capra e falla crescere.", cost: BASE_ACTION_VALUES.breedGoat.cost, gain: { goat: BASE_ACTION_VALUES.breedGoat.gain } },
  breed_cow: { id: "breed_cow", label: "Alleva mucca", icon: "🐄", description: "Investi risorse per allevare una mucca.", cost: BASE_ACTION_VALUES.breedCow.cost, gain: { cow: BASE_ACTION_VALUES.breedCow.gain } },
  trade: { id: "trade", label: "Commercia", icon: "🪙", description: "Vendi una risorsa per ottenere oro.", needsTarget: "trade-resource" },
  buy_incense: { id: "buy_incense", label: "Compra incenso", icon: "🕯️", description: "Spendi oro per comprare incenso.", cost: BASE_ACTION_VALUES.buyIncense.cost, gain: { incense: BASE_ACTION_VALUES.buyIncense.gain } },
  sacrifice: { id: "sacrifice", label: "Sacrifica", icon: "🩸", description: "Sacrifica un animale per ottenere sangue.", needsTarget: "sacrifice-animal" },
};

export function actionGain(action: BaseActionDefinition, season: Season): Partial<ResourcePool> {
  return action.seasonalGain?.[season] ?? action.gain ?? {};
}

export function resourceForAction(action: BaseActionId): Resource | undefined {
  return ({ gather_water: "water", gather_millet: "millet", gather_wood: "wood", gather_stone: "stone", breed_goat: "goat", breed_cow: "cow", buy_incense: "incense" } as Partial<Record<BaseActionId, Resource>>)[action];
}
