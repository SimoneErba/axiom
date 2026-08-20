import type { Card, Effect, Resource } from "../types";

const simple: Array<[Resource, number]> = [
  ["water", 1], ["millet", 1], ["wood", 1], ["gold", 1], ["cow", 1], ["water", 1], ["millet", 1], ["wood", 1],
  ["gold", 1], ["blood", 1], ["water", 2], ["millet", 2], ["wood", 2], ["gold", 2], ["cow", 1], ["water", 1],
  ["millet", 1], ["wood", 1], ["gold", 1], ["blood", 1],
];

const medium: Array<{ title: string; text: string; effect: Effect }> = [
  { title: "+2 acqua", text: "Ottieni 2 acqua.", effect: { kind: "gain", resource: "water", amount: 2 } },
  { title: "+3 miglio", text: "Ottieni 3 miglio.", effect: { kind: "gain", resource: "millet", amount: 3 } },
  { title: "+2 legno", text: "Ottieni 2 legno.", effect: { kind: "gain", resource: "wood", amount: 2 } },
  { title: "+2 oro", text: "Ottieni 2 oro.", effect: { kind: "gain", resource: "gold", amount: 2 } },
  { title: "+1 mucca", text: "Ottieni 1 mucca.", effect: { kind: "gain", resource: "cow", amount: 1 } },
  { title: "+1 mucca e +1 miglio", text: "Ottieni 1 mucca e 1 miglio.", effect: { kind: "gain", resource: "cow", amount: 1 } },
  { title: "Pesca una carta", text: "Pesca 1 carta base.", effect: { kind: "draw", amount: 1, tier: "gain1" } },
  { title: "Raccolto immediato", text: "Produci immediatamente dai campi.", effect: { kind: "produce", building: "fields" } },
  { title: "Acqua immediata", text: "Produci immediatamente dai pozzi.", effect: { kind: "produce", building: "wells" } },
  { title: "+2 sangue", text: "Ottieni 2 sangue.", effect: { kind: "gain", resource: "blood", amount: 2 } },
  { title: "+2 acqua", text: "Ottieni 2 acqua.", effect: { kind: "gain", resource: "water", amount: 2 } },
  { title: "+3 miglio", text: "Ottieni 3 miglio.", effect: { kind: "gain", resource: "millet", amount: 3 } },
  { title: "+2 legno", text: "Ottieni 2 legno.", effect: { kind: "gain", resource: "wood", amount: 2 } },
  { title: "+2 oro", text: "Ottieni 2 oro.", effect: { kind: "gain", resource: "gold", amount: 2 } },
  { title: "+1 mucca", text: "Ottieni 1 mucca.", effect: { kind: "gain", resource: "cow", amount: 1 } },
  { title: "Produzione campi", text: "Produci dai campi.", effect: { kind: "produce", building: "fields" } },
  { title: "Produzione pozzi", text: "Produci dai pozzi.", effect: { kind: "produce", building: "wells" } },
  { title: "Pesca una carta", text: "Pesca 1 carta base.", effect: { kind: "draw", amount: 1, tier: "gain1" } },
  { title: "+2 sangue", text: "Ottieni 2 sangue.", effect: { kind: "gain", resource: "blood", amount: 2 } },
  { title: "+1 mucca", text: "Ottieni 1 mucca.", effect: { kind: "gain", resource: "cow", amount: 1 } },
];

const strong: Array<{ title: string; text: string; effect: Effect }> = [
  { title: "+5 miglio", text: "Ottieni 5 miglio.", effect: { kind: "gain", resource: "millet", amount: 5 } },
  { title: "+3 acqua", text: "Ottieni 3 acqua.", effect: { kind: "gain", resource: "water", amount: 3 } },
  { title: "+3 oro", text: "Ottieni 3 oro.", effect: { kind: "gain", resource: "gold", amount: 3 } },
  { title: "+2 mucche", text: "Ottieni 2 mucche.", effect: { kind: "gain", resource: "cow", amount: 2 } },
  { title: "+1 mucca e +1 oro", text: "Ottieni 1 mucca e 1 oro.", effect: { kind: "gain", resource: "cow", amount: 1 } },
  { title: "Raccolto raddoppiato", text: "Ripeti la produzione dei campi.", effect: { kind: "repeat-production", building: "fields" } },
  { title: "Acqua raddoppiata", text: "Ripeti la produzione dei pozzi.", effect: { kind: "repeat-production", building: "wells" } },
  { title: "Attiva un'altra profezia", text: "Attiva un'altra profezia.", effect: { kind: "activate" } },
  { title: "Pesca 2 carte", text: "Pesca 2 carte base.", effect: { kind: "draw", amount: 2, tier: "gain1" } },
  { title: "+5 miglio", text: "Ottieni 5 miglio.", effect: { kind: "gain", resource: "millet", amount: 5 } },
  { title: "+3 acqua", text: "Ottieni 3 acqua.", effect: { kind: "gain", resource: "water", amount: 3 } },
  { title: "+3 oro", text: "Ottieni 3 oro.", effect: { kind: "gain", resource: "gold", amount: 3 } },
  { title: "+2 mucche", text: "Ottieni 2 mucche.", effect: { kind: "gain", resource: "cow", amount: 2 } },
  { title: "+1 mucca e +1 oro", text: "Ottieni 1 mucca e 1 oro.", effect: { kind: "gain", resource: "cow", amount: 1 } },
  { title: "Produzione campi", text: "Produci due volte dai campi.", effect: { kind: "produce", building: "fields", multiplier: 2 } },
  { title: "Produzione pozzi", text: "Produci due volte dai pozzi.", effect: { kind: "produce", building: "wells", multiplier: 2 } },
  { title: "Attiva un'altra profezia", text: "Attiva un'altra profezia.", effect: { kind: "activate" } },
  { title: "Pesca 3 carte", text: "Pesca 3 carte base.", effect: { kind: "draw", amount: 3, tier: "gain1" } },
  { title: "+3 sangue", text: "Ottieni 3 sangue.", effect: { kind: "gain", resource: "blood", amount: 3 } },
  { title: "+2 mucche", text: "Ottieni 2 mucche.", effect: { kind: "gain", resource: "cow", amount: 2 } },
];
medium.push({ title: "+1 stessa risorsa", text: "Ottieni +1 della risorsa generata dall'azione.", effect: { kind: "gain-same", amount: 1 } });
strong.push({ title: "Amplifica il raccolto", text: "Raddoppia la risorsa generata dall'azione.", effect: { kind: "multiply-gain", multiplier: 2 } });

export const gain1Cards: Card[] = simple.map(([resource, amount], index) => ({ id: `gain1-${index + 1}`, type: "gain1", title: `+${amount} ${resource}`, text: `Ottieni ${amount} ${resource}.`, cost: { gold: 1 }, effect: { kind: "gain", resource, amount } }));
gain1Cards.push({ id: "gain1-same-resource", type: "gain1", title: "+1 stessa risorsa", text: "Ottieni +1 della risorsa generata dall'azione.", cost: { gold: 1 }, effect: { kind: "gain-same", amount: 1 } });
export const gain2Cards: Card[] = medium.map((card, index) => ({ id: `gain2-${index + 1}`, type: "gain2", ...card, cost: { gold: 2 } }));
export const gain3Cards: Card[] = strong.map((card, index) => ({ id: `gain3-${index + 1}`, type: "gain3", ...card, cost: { gold: 2 } }));
