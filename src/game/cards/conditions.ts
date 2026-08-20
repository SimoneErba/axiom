import type { Card, Condition, Resource, Season } from "../types";

const resourceConditions: Array<[Resource, number]> = [
  ["water", 2], ["millet", 3], ["cow", 1], ["gold", 2], ["blood", 1], ["wood", 2],
  ["water", 4], ["millet", 5], ["gold", 3], ["wood", 3], ["cow", 2], ["blood", 2],
];
const conditions: Array<{ title: string; condition: Condition }> = resourceConditions.map(([resource, amount]) => ({
  title: `hai almeno ${amount} ${resource}`, condition: { kind: "resource", resource, amount },
}));
conditions.push(
  { title: "è la stagione delle piogge", condition: { kind: "season", season: "rainy" as Season } },
  { title: "è la stagione secca", condition: { kind: "season", season: "dry" as Season } },
  { title: "hai più miglio che acqua", condition: { kind: "resource-comparison", left: "millet", right: "water", operator: "more" } },
  { title: "hai più acqua che miglio", condition: { kind: "resource-comparison", left: "water", right: "millet", operator: "more" } },
  { title: "possiedi almeno 3 tipi diversi di risorsa", condition: { kind: "distinct-resources", amount: 3 } },
  { title: "hai almeno 2 legno", condition: { kind: "resource", resource: "wood", amount: 2 } },
  { title: "hai almeno 2 oro", condition: { kind: "resource", resource: "gold", amount: 2 } },
  { title: "hai almeno 1 mucca", condition: { kind: "resource", resource: "cow", amount: 1 } },
);

export const conditionCards: Card[] = conditions.map(({ title, condition }, index) => ({
  id: `if-${index + 1}`, type: "if", title: `se ${title}`, text: `SE ${title}.`, cost: { gold: 1 }, condition,
}));
