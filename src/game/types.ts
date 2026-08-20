export type Resource = "water" | "millet" | "goat" | "cow" | "wood" | "stone" | "gold" | "blood" | "incense";
export type ResourcePool = Record<Resource, number>;
export type Season = "rainy" | "dry";
export type DeckKey = "when" | "if" | "gain1" | "gain2" | "gain3" | "advanced";
export type CardType = "when" | "if" | "gain1" | "gain2" | "gain3" | "advanced";
export type AdvancedKind = "sacrifice" | "repeat" | "activate";
export type InteractionMode = "idle" | "buy-card" | "build-prophecy" | "modify-prophecy" | "trade" | "sacrifice" | "consult-omens" | "choose-prophecy-target";
export type BaseActionId = "gather_water" | "gather_millet" | "gather_wood" | "gather_stone" | "breed_goat" | "breed_cow" | "trade" | "buy_incense" | "sacrifice";

export type Effect =
  | { kind: "gain"; resource: Resource; amount: number }
  | { kind: "gain-same"; amount: number }
  | { kind: "multiply-gain"; multiplier: number }
  | { kind: "convert"; from: Resource; fromAmount: number; to: Resource; toAmount: number }
  | { kind: "draw"; amount: number; tier?: CardType }
  | { kind: "produce"; building: "fields" | "wells"; multiplier?: number }
  | { kind: "activate"; prophecyId?: string }
  | { kind: "repeat-production"; building: "fields" | "wells" };

export type Condition =
  | { kind: "resource"; resource: Resource; amount: number }
  | { kind: "season"; season: Season }
  | { kind: "resource-comparison"; left: Resource; right: Resource; operator: "more" | "less" }
  | { kind: "distinct-resources"; amount: number };

export type Trigger =
  | BaseActionId
  | "gain-water"
  | "gain-millet"
  | "gain-wood"
  | "gain-stone"
  | "gain-goat"
  | "gain-cow"
  | "gain-gold"
  | "gain-blood"
  | "gain-incense"
  | "rain-start"
  | "dry-start"
  | "rain"
  | "produce-water"
  | "produce-millet"
  | "gain-gold"
  | "gain-cow"
  | "trade"
  | "buy-card"
  | "build-prophecy"
  | "sacrifice-cow"
  | "gain-blood";

export interface ActionPerformedEvent {
  type: "ACTION_PERFORMED";
  action: BaseActionId;
  season: Season;
  resource?: Resource;
  amount?: number;
}

export interface ResourceGainedEvent {
  type: "RESOURCE_GAINED";
  resource: Resource;
  amount: number;
  source: "base_action" | "prophecy" | "production" | "trade";
  action?: BaseActionId;
}

export type GameEvent = ActionPerformedEvent | ResourceGainedEvent;

export interface Card {
  id: string;
  type: CardType;
  title: string;
  text: string;
  cost: Partial<ResourcePool>;
  trigger?: Trigger;
  condition?: Condition;
  effect?: Effect;
  advanced?: AdvancedKind;
  sacrificeTier?: number;
  sacrificeAnimal?: "goat" | "cow";
  repeat?: { resource: Resource; amount: number };
  targetProphecyId?: string;
}

export interface DeckState {
  drawPile: Card[];
  market: Card[];
  discardPile: Card[];
}

export interface Prophecy {
  id: string;
  when?: Card;
  condition?: Card;
  gain: Card;
  upgrades: Card[];
  active: boolean;
  timesResolved: number;
}

export interface GameLogEntry {
  id: string;
  round: number;
  text: string;
  tone?: "normal" | "good" | "ritual" | "warning";
}

export interface VillageState {
  fields: number;
  wells: number;
  goats: number;
  cows: number;
}

export interface GameState {
  round: number;
  turnResolutions: number;
  /** Legacy save compatibility. New games use turnResolutions. */
  roundResolutions?: number;
  won: boolean;
  season: Season;
  phase: "actions" | "production" | "season";
  resources: ResourcePool;
  decks: Record<DeckKey, DeckState>;
  hand: Card[];
  prophecies: Prophecy[];
  log: GameLogEntry[];
  village: VillageState;
  seed: number;
  passed: boolean;
  events: GameEvent[];
}

export const RESOURCE_INFO: Record<Resource, { label: string; icon: string }> = {
  water: { label: "Acqua", icon: "💧" }, millet: { label: "Miglio", icon: "🌾" }, goat: { label: "Capre", icon: "🐐" },
  cow: { label: "Mucche", icon: "🐄" }, wood: { label: "Legno", icon: "🪵" }, stone: { label: "Pietra", icon: "🪨" },
  gold: { label: "Oro", icon: "🪙" }, blood: { label: "Sangue", icon: "🩸" }, incense: { label: "Incenso", icon: "🕯️" },
};

export const DECK_INFO: Record<DeckKey, { label: string; short: string; accent: string }> = {
  when: { label: "Quando", short: "QUANDO", accent: "#df8c4f" },
  if: { label: "Se", short: "SE", accent: "#8e9fe8" },
  gain1: { label: "Ottieni I", short: "OTTIENI I", accent: "#78b981" },
  gain2: { label: "Ottieni II", short: "OTTIENI II", accent: "#c9a85a" },
  gain3: { label: "Ottieni III", short: "OTTIENI III", accent: "#c96c79" },
  advanced: { label: "Avanzate", short: "AVANZATE", accent: "#b876cc" },
};

export const EMPTY_RESOURCES: ResourcePool = { water: 0, millet: 0, goat: 0, cow: 0, wood: 0, stone: 0, gold: 0, blood: 0, incense: 0 };
