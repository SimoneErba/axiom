import type { Card, CardType, Prophecy } from "./types";

export interface ProphecyDraft { when?: Card; condition?: Card; gain?: Card }

export function validateProphecy(draft: ProphecyDraft): { valid: boolean; message: string } {
  if (!draft.gain) return { valid: false, message: "Serve una carta OTTIENI." };
  if (draft.when && draft.when.type !== "when") return { valid: false, message: "Il primo modulo deve essere QUANDO." };
  if (draft.condition && draft.condition.type !== "if") return { valid: false, message: "Il modulo SE non è valido." };
  if (!draft.when && !draft.condition) return { valid: false, message: "Aggiungi QUANDO oppure SE." };
  const expected: CardType = draft.when && draft.condition ? "gain3" : draft.when ? "gain2" : "gain1";
  if (draft.gain.type !== expected) return { valid: false, message: `Questa forma richiede normalmente OTTIENI ${expected.replace("gain", "")}.` };
  return { valid: true, message: "Profezia valida." };
}

export function prophecyLabel(prophecy: Prophecy) {
  return [prophecy.when?.title, prophecy.condition?.title, prophecy.gain.title].filter(Boolean).join(" → ");
}
