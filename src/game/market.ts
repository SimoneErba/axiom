import { MARKET_SIZE } from "./balance";
import { draw, discard } from "./deck";
import type { Card, DeckKey, DeckState, GameState } from "./types";

export function refillMarketSlot(deck: DeckState, seed: number, slot?: number): number {
  const result = draw(deck, 1, seed);
  if (!result.cards[0]) return result.seed;
  if (slot === undefined) deck.market.push(result.cards[0]);
  else deck.market[slot] = result.cards[0];
  return result.seed;
}

export function initializeMarket(deck: DeckState, seed: number): number {
  while (deck.market.length < MARKET_SIZE) seed = refillMarketSlot(deck, seed);
  return seed;
}

export function buyMarketCard(state: GameState, category: DeckKey, cardId: string): Card | undefined {
  const deck = state.decks[category];
  const index = deck.market.findIndex((card) => card.id === cardId);
  if (index < 0) return undefined;
  const [card] = deck.market.splice(index, 1);
  state.seed = refillMarketSlot(deck, state.seed, index);
  return card;
}

export function refreshMarketCategory(state: GameState, category: DeckKey): number {
  const deck = state.decks[category];
  deck.market.forEach((card) => discard(deck, card));
  deck.market = [];
  state.seed = initializeMarket(deck, state.seed);
  return state.seed;
}
