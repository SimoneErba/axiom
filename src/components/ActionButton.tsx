import type { BaseActionDefinition } from "../game/actions";
import type { Resource, ResourcePool, Season } from "../game/types";

function costText(cost: Partial<ResourcePool>) {
  const icons: Record<Resource, string> = { water: "💧", millet: "🌾", goat: "🐐", cow: "🐄", wood: "🪵", stone: "🪨", gold: "🪙", blood: "🩸", incense: "🕯️" };
  return Object.entries(cost).map(([resource, amount]) => `${amount}${icons[resource as Resource]}`).join(" ");
}

export function ActionButton({ action, season, selected, disabled, onClick }: { action: BaseActionDefinition; season: Season; selected: boolean; disabled: boolean; onClick: () => void }) {
  const gain = action.seasonalGain?.[season] ?? action.gain;
  return <button className={`base-action ${selected ? "selected" : ""}`} disabled={disabled} onClick={onClick}>
    <span className="base-action-icon">{action.icon}</span><strong>{action.label}</strong>
    <small>{costText(action.cost ?? {}) || "nessun costo"} → {costText(gain ?? {}) || "effetto"}</small>
  </button>;
}
