import { BASE_ACTIONS } from "../game/actions";
import { previewAction } from "../game/engine/actionEngine";
import type { BaseActionId, GameState, Resource } from "../game/types";
import { ActionButton } from "./ActionButton";

const actionOrder: BaseActionId[] = ["gather_water", "gather_millet", "gather_wood", "gather_stone", "breed_goat", "breed_cow", "trade", "buy_incense", "sacrifice"];

export function ActionsPanel({ state, selectedAction, selectedTarget, highlightedProphecies, onSelect, onTarget, onConfirm, onCancel }: {
  state: GameState;
  selectedAction: BaseActionId | null;
  selectedTarget?: Resource;
  highlightedProphecies: string[];
  onSelect: (action: BaseActionId) => void;
  onTarget: (target: Resource) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const action = selectedAction ? BASE_ACTIONS[selectedAction] : undefined;
  const preview = selectedAction ? previewAction(state, selectedAction, selectedTarget) : undefined;
  const targetResources: Resource[] = selectedAction === "sacrifice" ? ["goat", "cow"] : selectedAction === "trade" ? ["millet", "water", "wood", "stone"] : [];
  return <section className="actions-panel">
    <div className="actions-heading"><div><span className="eyebrow">AZIONI BASE</span><h2>Fai agire il villaggio</h2></div>{selectedAction && <button className="action-cancel" onClick={onCancel}>Annulla</button>}</div>
    <div className="actions-grid">{actionOrder.map((id) => <ActionButton key={id} action={BASE_ACTIONS[id]} season={state.season} selected={selectedAction === id} disabled={!!selectedAction && selectedAction !== id} onClick={() => onSelect(id)} />)}</div>
    {selectedAction && action && <div className="action-preview"><div><span className="eyebrow">PREVIEW · {action.label.toUpperCase()}</span><strong>{preview?.label}</strong><small>Base e stagione: {state.season === "rainy" ? "piogge" : "secca"} · {Object.entries(preview?.gain ?? {}).map(([resource, amount]) => `${amount} ${resource}`).join(", ")}</small></div>{targetResources.length > 0 && <div className="action-targets"><span>Scegli:</span>{targetResources.map((target) => <button key={target} className={selectedTarget === target ? "selected" : ""} onClick={() => onTarget(target)}>{target === "goat" ? "🐐 capra" : target === "cow" ? "🐄 mucca" : target === "millet" ? "🌾 miglio" : target === "water" ? "💧 acqua" : target === "wood" ? "🪵 legno" : "🪨 pietra"}</button>)}</div>}<div className="action-preview-end"><span>{highlightedProphecies.length ? `Profezie attive: ${highlightedProphecies.join(", ")}` : "Nessuna profezia compatibile"}</span><button className="confirm-action" disabled={targetResources.length > 0 && !selectedTarget} onClick={onConfirm}>Conferma azione</button></div></div>}
  </section>;
}
