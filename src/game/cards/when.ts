import type { Card, Trigger } from "../types";

const triggers: Array<[Trigger, string]> = [
  ["rain-start", "quando inizia la stagione delle piogge"], ["dry-start", "quando inizia la stagione secca"], ["rain", "quando piove"],
  ["gather_water", "quando raccogli acqua"], ["gather_millet", "quando raccogli miglio"], ["gather_wood", "quando raccogli legno"],
  ["gather_stone", "quando estrai pietra"], ["breed_goat", "quando allevi una capra"], ["breed_cow", "quando allevi una mucca"],
  ["trade", "quando commerci"], ["buy_incense", "quando compri incenso"], ["sacrifice", "quando sacrifichi"],
  ["gain-water", "quando ottieni acqua"], ["gain-millet", "quando ottieni miglio"], ["gain-wood", "quando ottieni legno"],
  ["gain-stone", "quando ottieni pietra"], ["gain-goat", "quando ottieni una capra"], ["gain-cow", "quando ottieni una mucca"],
  ["gain-gold", "quando ottieni oro"], ["gain-blood", "quando ottieni sangue"],
];

export const whenCards: Card[] = triggers.map(([trigger, phrase], index) => ({
  id: `when-${index + 1}`, type: "when", title: phrase, text: `QUANDO ${phrase}, attiva questa profezia.`, cost: { gold: 1 }, trigger,
}));
