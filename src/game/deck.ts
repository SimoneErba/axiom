import type { Card, DeckState } from "./types";

export function shuffle<T>(items: T[], seed = Date.now()): { items: T[]; seed: number } {
  const result = [...items];
  let value = seed >>> 0;
  const random = () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return { items: result, seed: value };
}

export function createDeck(cards: Card[], seed: number): { deck: DeckState; seed: number } {
  const shuffled = shuffle(cards, seed);
  return { deck: { drawPile: shuffled.items, market: [], discardPile: [] }, seed: shuffled.seed };
}

export function draw(deck: DeckState, amount: number, seed: number): { cards: Card[]; seed: number } {
  const cards: Card[] = [];
  let nextSeed = seed;
  for (let i = 0; i < amount; i += 1) {
    if (deck.drawPile.length === 0 && deck.discardPile.length > 0) {
      const reshuffled = shuffle(deck.discardPile, nextSeed);
      deck.drawPile = reshuffled.items;
      deck.discardPile = [];
      nextSeed = reshuffled.seed;
    }
    const card = deck.drawPile.shift();
    if (card) cards.push(card);
  }
  return { cards, seed: nextSeed };
}

export function discard(deck: DeckState, card: Card) { deck.discardPile.push(card); }
