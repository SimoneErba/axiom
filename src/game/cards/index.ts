import { advancedCards } from "./advanced";
import { conditionCards } from "./conditions";
import { gain1Cards, gain2Cards, gain3Cards } from "./gains";
import { whenCards } from "./when";
import type { Card, DeckKey } from "../types";

export const CARD_DATA: Record<DeckKey, Card[]> = { when: whenCards, if: conditionCards, gain1: gain1Cards, gain2: gain2Cards, gain3: gain3Cards, advanced: advancedCards };
