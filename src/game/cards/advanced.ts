import type { Card, Resource } from "../types";

const cards: Array<{ title: string; text: string; advanced: Card["advanced"]; repeat?: { resource: Resource; amount: number } }> = [
  { title: "SACRIFICA — rito della mucca", text: "Sacrifica 1 mucca per +2 tier.", advanced: "sacrifice" },
  { title: "RIPETI — legno", text: "Ripeti finché hai almeno 2 legno; ogni iterazione consuma 2 legno.", advanced: "repeat", repeat: { resource: "wood", amount: 2 } },
  { title: "RIPETI — miglio", text: "Ripeti finché hai almeno 3 miglio; ogni iterazione consuma 3 miglio.", advanced: "repeat", repeat: { resource: "millet", amount: 3 } },
  { title: "ATTIVA — legame", text: "Collega questa profezia a un'altra profezia.", advanced: "activate" },
  { title: "SACRIFICA — rito della mucca", text: "Sacrifica 1 mucca per +2 tier.", advanced: "sacrifice" },
  { title: "RIPETI — acqua", text: "Ripeti finché hai almeno 2 acqua; ogni iterazione consuma 2 acqua.", advanced: "repeat", repeat: { resource: "water", amount: 2 } },
  { title: "ATTIVA — legame", text: "Collega questa profezia a un'altra profezia.", advanced: "activate" },
  { title: "SACRIFICA — rito della mucca", text: "Sacrifica 1 mucca per +2 tier.", advanced: "sacrifice" },
  { title: "RIPETI — legno", text: "Ripeti finché hai almeno 2 legno; ogni iterazione consuma 2 legno.", advanced: "repeat", repeat: { resource: "wood", amount: 2 } },
  { title: "ATTIVA — eco", text: "Collega questa profezia a un'altra profezia.", advanced: "activate" },
  { title: "SACRIFICA — rito della mucca", text: "Sacrifica 1 mucca per +2 tier.", advanced: "sacrifice" },
  { title: "RIPETI — miglio", text: "Ripeti finché hai almeno 3 miglio; ogni iterazione consuma 3 miglio.", advanced: "repeat", repeat: { resource: "millet", amount: 3 } },
  { title: "ATTIVA — eco", text: "Collega questa profezia a un'altra profezia.", advanced: "activate" },
  { title: "RIPETI — acqua", text: "Ripeti finché hai almeno 2 acqua; ogni iterazione consuma 2 acqua.", advanced: "repeat", repeat: { resource: "water", amount: 2 } },
  { title: "SACRIFICA — rito della mucca", text: "Sacrifica 1 mucca per +2 tier.", advanced: "sacrifice" },
];

export const advancedCards: Card[] = cards.map((card, index) => ({ id: `advanced-${index + 1}`, type: "advanced", ...card, cost: { blood: 1 } }));
