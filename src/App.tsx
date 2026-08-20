import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, CircleHelp, FlaskConical, Hammer, HandCoins, RefreshCw, ScrollText, Sparkles, Sun, Wheat, X } from "lucide-react";
import { CARD_COSTS, OMEN_COST, TRADE_RATES, VICTORY_RESOLUTIONS_PER_ROUND } from "./game/balance";
import { DECK_INFO, RESOURCE_INFO, type Card, type DeckKey, type GameState, type InteractionMode, type Resource, type Prophecy } from "./game/types";
import { addProphecy, canUseSacrifice, freeSacrifice, resolveProphecy, triggerProphecies } from "./game/prophecyEngine";
import { canPay, cloneState, costFor, createInitialState, makeLog, pay } from "./game/gameState";
import { buyMarketCard, refreshMarketCategory } from "./game/market";
import { produceVillage } from "./game/productionEngine";
import { advanceSeason } from "./game/seasonEngine";
import { trade } from "./game/tradeEngine";
import { validateProphecy, prophecyLabel } from "./game/prophecyValidator";
import { performAction } from "./game/engine/actionEngine";
import { actionEvent } from "./game/engine/eventQueue";
import { triggerMatches } from "./game/prophecyEngine";
import type { BaseActionId } from "./game/types";
import { ActionsPanel } from "./components/ActionsPanel";

type Pending =
  | { kind: "buy"; category: DeckKey; card: Card }
  | { kind: "consult"; category: DeckKey }
  | { kind: "trade"; resource: Resource }
  | { kind: "sacrifice"; animal: "cow" }
  | { kind: "build"; selected: Card[] }
  | { kind: "modify"; prophecyId: string; card?: Card; animal?: "cow"; targetId?: string }
  | null;

type PresageDraft = { step: "when" | "if" | "gain"; when?: Card; condition?: Card; gain?: Card };

const STORAGE_KEY = "profezie-engine-builder-state";

function loadSavedState(): GameState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return createInitialState();
  try {
    const parsed = JSON.parse(saved) as GameState & { resources: Record<string, number>; village?: { goats?: number } };
    const resourceSchemaChanged = ["goat", "stone", "incense"].some((resource) => !(resource in parsed.resources));
    const needsMigration = resourceSchemaChanged || parsed.village?.goats === undefined || !parsed.events;
    return needsMigration ? createInitialState() : parsed;
  } catch {
    return createInitialState();
  }
}

function icon(resource: Resource) { return RESOURCE_INFO[resource].icon; }
function resourceName(resource: Resource) { return RESOURCE_INFO[resource].label.toLowerCase(); }
function costText(cost: Partial<Record<Resource, number>>) { return Object.entries(cost).map(([resource, amount]) => `${amount} ${icon(resource as Resource)}`).join("  "); }
function seasonLabel(season: GameState["season"]) { return season === "rainy" ? "Stagione delle piogge" : "Stagione secca"; }
function categoryFor(card: Card): DeckKey { return card.type; }

function CardView({ card, selected, disabled, onClick, compact = false }: { card: Card; selected?: boolean; disabled?: boolean; onClick?: () => void; compact?: boolean }) {
  const info = DECK_INFO[card.type];
  return <button className={`card ${selected ? "selected" : ""} ${disabled ? "disabled" : ""} ${compact ? "compact" : ""}`} style={{ "--card-accent": info.accent } as React.CSSProperties} onClick={onClick} disabled={disabled}>
    <span className="card-type">{info.short}</span>
    <strong>{card.title}</strong>
    {!compact && <span className="card-text">{card.text}</span>}
    {!compact && <span className="card-cost">{costText(card.cost)}</span>}
  </button>;
}

function ResourceBar({ state, mode, onResource }: { state: GameState; mode: InteractionMode; onResource: (resource: Resource) => void }) {
  const relevant = mode === "trade";
  return <div className="resources-bar">
    {(Object.keys(RESOURCE_INFO) as Resource[]).map((resource) => <button key={resource} className={`resource ${relevant ? "resource-selectable" : ""}`} onClick={() => onResource(resource)}>
      <span>{icon(resource)}</span><b>{state.resources[resource]}</b><small>{RESOURCE_INFO[resource].label}</small>
    </button>)}
  </div>;
}

function ProphecyCard({ prophecy, selected, highlighted, onClick }: { prophecy: Prophecy; selected?: boolean; highlighted?: boolean; onClick: () => void }) {
  return <button className={`prophecy ${selected ? "selected" : ""} ${highlighted ? "highlighted" : ""} ${prophecy.active ? "active" : "inactive"}`} onClick={onClick}>
    <div className="prophecy-chain">
      {prophecy.when && <span className="module when">QUANDO · {prophecy.when.title}</span>}
      {prophecy.condition && <span className="module condition">SE · {prophecy.condition.title.replace(/^se /, "")}</span>}
      <span className="module gain">{DECK_INFO[prophecy.gain.type].short} · {prophecy.gain.title}</span>
    </div>
    <div className="prophecy-meta"><span>{prophecy.active ? "● attiva" : "○ dormiente"}</span><span>risolta {prophecy.timesResolved}×</span></div>
    {prophecy.upgrades.length > 0 && <div className="upgrade-pills">{prophecy.upgrades.map((upgrade) => <span key={upgrade.id}>{upgrade.advanced?.toUpperCase()}</span>)}</div>}
  </button>;
}

function App() {
  const [game, setGame] = useState<GameState>(loadSavedState);
  const [mode, setMode] = useState<InteractionMode>("idle");
  const [pending, setPending] = useState<Pending>(null);
  const [logOpen, setLogOpen] = useState(true);
  const [debugOpen, setDebugOpen] = useState(false);
  const [presageDraft, setPresageDraft] = useState<PresageDraft | null>(null);
  const [selectedAction, setSelectedAction] = useState<BaseActionId | null>(null);
  const [actionTarget, setActionTarget] = useState<Resource | undefined>();
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); }, [game]);

  const selectedBuild = pending?.kind === "build" ? pending.selected : [];
  const buildValidation = useMemo(() => {
    if (pending?.kind !== "build") return { valid: false, message: "" };
    return validateProphecy({ when: pending.selected.find((card) => card.type === "when"), condition: pending.selected.find((card) => card.type === "if"), gain: pending.selected.find((card) => ["gain1", "gain2", "gain3"].includes(card.type)) });
  }, [pending]);
  const presageValidation = presageDraft ? validateProphecy(presageDraft) : { valid: false, message: "" };
  const presageCards = presageDraft ? [presageDraft.when, presageDraft.condition, presageDraft.gain].filter(Boolean) as Card[] : [];
  const presageCost: Partial<Record<Resource, number>> = {};
  presageCards.forEach((card) => Object.entries(costFor(card)).forEach(([resource, amount]) => { presageCost[resource as Resource] = (presageCost[resource as Resource] ?? 0) + (amount ?? 0); }));
  const presageCanPay = canPay(game.resources, presageCost);
  const presageCategory: DeckKey | null = !presageDraft ? null : presageDraft.step === "when" ? "when" : presageDraft.step === "if" ? "if" : presageDraft.condition ? "gain3" : "gain2";
  const highlightedProphecies = selectedAction ? game.prophecies.filter((prophecy) => triggerMatches(prophecy.when, actionEvent(selectedAction, game.season, actionTarget))).map((prophecy) => `#${prophecy.id.slice(-3)}`) : [];

  function update(mutator: (draft: GameState) => void) { setGame((current) => { const draft = cloneState(current); mutator(draft); return draft; }); }
  function cancel() { setMode("idle"); setPending(null); }
  function cancelBaseAction() { setSelectedAction(null); setActionTarget(undefined); }
  function selectBaseAction(action: BaseActionId) { if (!game.won) { setSelectedAction(action); setActionTarget(undefined); } }
  function confirmBaseAction() {
    if (!selectedAction) return;
    update((draft) => { performAction(draft, selectedAction, actionTarget); });
    cancelBaseAction();
  }
  function closePresage() { setPresageDraft(null); }
  function openPresage() { cancel(); setPresageDraft({ step: "when" }); }
  function start(modeToSet: InteractionMode) {
    setMode(modeToSet);
    if (modeToSet === "build-prophecy") setPending({ kind: "build", selected: [] });
  }

  function selectMarket(category: DeckKey, card: Card) {
    if (presageDraft) return;
    if (mode === "consult-omens") { setPending({ kind: "consult", category }); return; }
    if (mode !== "idle" && mode !== "buy-card") return;
    setMode("buy-card"); setPending({ kind: "buy", category, card });
  }

  function selectPresageCard(category: DeckKey, card: Card) {
    if (!presageDraft) return;
    if (presageDraft.step === "when" && category === "when") setPresageDraft({ step: "if", when: card });
    else if (presageDraft.step === "if" && category === "if") setPresageDraft({ step: "gain", when: presageDraft.when, condition: card });
    else if (presageDraft.step === "gain" && ["gain1", "gain2", "gain3"].includes(category)) setPresageDraft({ ...presageDraft, gain: card });
  }

  function skipPresageCondition() {
    if (presageDraft?.step === "if") setPresageDraft({ step: "gain", when: presageDraft.when });
  }

  function confirmPresage() {
    if (!presageDraft?.when || !presageDraft.gain) return;
    const validation = validateProphecy(presageDraft);
    if (!validation.valid) return;
    const when = presageDraft.when;
    const gain = presageDraft.gain;
    const condition = presageDraft.condition;
    const selected = [when, condition, gain].filter(Boolean) as Card[];
    update((draft) => {
      const totalCost: Partial<Record<Resource, number>> = {};
      selected.forEach((card) => Object.entries(costFor(card)).forEach(([resource, amount]) => { totalCost[resource as Resource] = (totalCost[resource as Resource] ?? 0) + (amount ?? 0); }));
      if (!canPay(draft.resources, totalCost)) return;
      pay(draft.resources, totalCost);
      selected.forEach((card) => buyMarketCard(draft, categoryFor(card), card.id));
      addProphecy(draft, { id: `${draft.round}-${draft.prophecies.length + 1}-${Date.now()}`, when, condition, gain, upgrades: [], active: true, timesResolved: 0 });
    });
    closePresage();
  }

  function selectHandCard(card: Card) {
    if (mode === "build-prophecy" && pending?.kind === "build") {
      const selected = pending.selected;
      if (selected.some((item) => item.id === card.id)) setPending({ kind: "build", selected: selected.filter((item) => item.id !== card.id) });
      else if (!["when", "if", "gain1", "gain2", "gain3"].includes(card.type)) return;
      else if (selected.some((item) => item.type === card.type)) return;
      else setPending({ kind: "build", selected: [...selected, card] });
      return;
    }
    if (mode === "modify-prophecy" && pending?.kind === "modify" && (card.type === "advanced" || card.type === "if" || card.type === "gain1" || card.type === "gain2" || card.type === "gain3")) {
      setPending({ ...pending, card });
    }
  }

  function confirm() {
    if (!pending) return;
    if (pending.kind === "buy") {
      update((draft) => {
        const cost = costFor(pending.card);
        if (!canPay(draft.resources, cost)) return;
        pay(draft.resources, cost);
        const card = buyMarketCard(draft, pending.category, pending.card.id);
        if (!card) return;
        draft.hand.push(card); draft.log.push(makeLog(draft.round, `Acquistata una carta ${DECK_INFO[pending.category].short}.`, "good"));
        triggerProphecies(draft, "buy-card");
      });
    } else if (pending.kind === "consult") {
      update((draft) => { if (!canPay(draft.resources, OMEN_COST)) return; pay(draft.resources, OMEN_COST); refreshMarketCategory(draft, pending.category); draft.log.push(makeLog(draft.round, `Hai consultato i presagi: rinnovate 3 carte ${DECK_INFO[pending.category].short}.`, "ritual")); });
    } else if (pending.kind === "trade") {
      update((draft) => { trade(draft, pending.resource); });
    } else if (pending.kind === "sacrifice") {
      update((draft) => { freeSacrifice(draft, pending.animal); });
    } else if (pending.kind === "build") {
      const when = pending.selected.find((card) => card.type === "when"); const condition = pending.selected.find((card) => card.type === "if"); const gain = pending.selected.find((card) => ["gain1", "gain2", "gain3"].includes(card.type));
      if (!buildValidation.valid || !gain) return;
      update((draft) => {
        draft.hand = draft.hand.filter((card) => !pending.selected.some((selected) => selected.id === card.id));
        addProphecy(draft, { id: `${draft.round}-${draft.prophecies.length + 1}-${Date.now()}`, when, condition, gain, upgrades: [], active: true, timesResolved: 0 });
      });
    } else if (pending.kind === "modify") {
      if (!pending.card && !pending.animal && !pending.targetId) return;
      update((draft) => {
        const prophecy = draft.prophecies.find((item) => item.id === pending.prophecyId); if (!prophecy) return;
        if (pending.animal) {
          const amount = 2;
          if (draft.resources[pending.animal] < 1 || prophecy.gain.type === "gain3") return;
          prophecy.upgrades.push({ id: `ritual-${Date.now()}`, type: "advanced", title: "SACRIFICA", text: `Sacrifica ${pending.animal} per +${amount} tier`, cost: {}, advanced: "sacrifice", sacrificeTier: amount, sacrificeAnimal: pending.animal });
          draft.log.push(makeLog(draft.round, `Sacrificio rituale aggiunto alla profezia #${prophecy.id.slice(-3)}.`, "ritual"));
        } else if (pending.card) {
          draft.hand = draft.hand.filter((card) => card.id !== pending.card?.id);
          if (pending.card.type === "if" && !prophecy.condition) {
            prophecy.condition = pending.card;
            draft.log.push(makeLog(draft.round, `Aggiunta una condizione alla profezia #${prophecy.id.slice(-3)}.`, "ritual"));
          } else if (["gain1", "gain2", "gain3"].includes(pending.card.type)) {
            prophecy.gain = pending.card;
            draft.log.push(makeLog(draft.round, `Sostituito l'effetto della profezia #${prophecy.id.slice(-3)}.`, "ritual"));
          } else {
            prophecy.upgrades.push(pending.card);
            draft.log.push(makeLog(draft.round, `${pending.card.title} aggiunta alla profezia #${prophecy.id.slice(-3)}.`, "ritual"));
          }
        } else if (pending.targetId && pending.targetId !== pending.prophecyId) {
          prophecy.upgrades.push({ id: `link-${Date.now()}`, type: "advanced", title: "ATTIVA", text: `Collega #${pending.targetId.slice(-3)}`, cost: {}, advanced: "activate", targetProphecyId: pending.targetId });
          draft.log.push(makeLog(draft.round, `Profezia #${prophecy.id.slice(-3)} collegata a #${pending.targetId.slice(-3)}.`, "ritual"));
        }
      });
    }
    cancel();
  }

  function selectProphecy(prophecy: Prophecy) {
    if (mode === "choose-prophecy-target" && pending?.kind === "modify") { setPending({ ...pending, targetId: prophecy.id }); setMode("modify-prophecy"); return; }
    if (mode === "idle") { setMode("modify-prophecy"); setPending({ kind: "modify", prophecyId: prophecy.id }); }
  }

  function passRound() {
    if (game.won) return;
    update((draft) => { draft.phase = "production"; produceVillage(draft); advanceSeason(draft); draft.round += 1; draft.phase = "actions"; draft.passed = true; if (!draft.won) draft.turnResolutions = 0; draft.log.push(makeLog(draft.round, `Turno ${draft.round}: puoi continuare a interpretare i presagi.`, "ritual")); });
    cancel();
  }

  function resetGame() { localStorage.removeItem(STORAGE_KEY); setGame(createInitialState()); cancel(); }
  function exportGame() { const blob = new Blob([JSON.stringify(game, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "profezie-gamestate.json"; anchor.click(); URL.revokeObjectURL(url); }
  function importGame(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { setGame(JSON.parse(String(reader.result)) as GameState); cancel(); } catch { /* invalid import is ignored */ } }; reader.readAsText(file); event.target.value = ""; }

  function onResource(resource: Resource) {
    if (mode === "trade") { if (TRADE_RATES.some((rate) => rate.from === resource)) setPending({ kind: "trade", resource }); return; }
    if (mode === "sacrifice" && resource === "cow" && canUseSacrifice(game, resource)) setPending({ kind: "sacrifice", animal: resource });
  }

  function chooseModifyAnimal(animal: "cow") { if (pending?.kind === "modify") setPending({ ...pending, animal }); }

  const actionInstruction = pending?.kind === "buy" ? `Acquistare ${pending.card.title}?` : pending?.kind === "consult" ? `Rinnovare il mercato ${DECK_INFO[pending.category].short}?` : pending?.kind === "trade" ? "Confermare il commercio?" : pending?.kind === "sacrifice" ? "Sacrificare una mucca?" : pending?.kind === "build" ? (buildValidation.message || "Scegli i moduli") : pending?.kind === "modify" ? "Confermare la modifica?" : "Scegli un'azione";

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">✦</div><div><strong>PROFEZIE</strong><span>engine builder</span></div></div>
      <div className="round-status"><span>TURNO {game.round}</span><b>{seasonLabel(game.season)}</b><small className="victory-progress">Profezie nel turno: {game.turnResolutions ?? game.roundResolutions ?? 0}/{VICTORY_RESOLUTIONS_PER_ROUND}</small></div>
      <div className="instruction"><span>{mode === "idle" ? "Il villaggio attende il tuo prossimo presagio" : actionInstruction}</span></div>
      <div className="top-actions"><button className="ghost" onClick={cancel} disabled={mode === "idle"}><X size={15} /> Annulla</button><button className="confirm" onClick={confirm} disabled={!pending || (pending.kind === "build" && !buildValidation.valid)}><Sparkles size={15} /> Conferma</button><button className="pass" onClick={passRound} disabled={game.won}>Passa <span>→</span></button></div>
    </header>
    <ResourceBar state={game} mode={mode} onResource={onResource} />

    <main className="game-layout">
      <section className="table-column">
        <div className="section-heading"><div><span className="eyebrow">IL TUO DESTINO</span><h1>Profezie attive <span>{game.prophecies.length}</span></h1></div><div className="heading-actions"><button className={presageDraft ? "active-action" : ""} onClick={openPresage}><ScrollText size={16} /> Ottieni un presagio</button></div></div>
        <ActionsPanel state={game} selectedAction={selectedAction} selectedTarget={actionTarget} highlightedProphecies={highlightedProphecies} onSelect={selectBaseAction} onTarget={setActionTarget} onConfirm={confirmBaseAction} onCancel={cancelBaseAction} />
        <div className="prophecy-board">
          {game.prophecies.length === 0 ? <div className="empty-board"><div className="empty-symbol">☽</div><strong>Il destino è ancora vuoto</strong><span>Ottieni un presagio e combina QUANDO, SE e OTTIENI.</span></div> : game.prophecies.map((prophecy) => <ProphecyCard key={prophecy.id} prophecy={prophecy} selected={pending?.kind === "modify" && pending.prophecyId === prophecy.id} highlighted={highlightedProphecies.includes(`#${prophecy.id.slice(-3)}`)} onClick={() => selectProphecy(prophecy)} />)}
        </div>

        <div className="lower-grid">
          <section className="village-panel"><div className="panel-heading"><div><span className="eyebrow">PRODUZIONE</span><h2>Il villaggio</h2></div><button className="icon-button" title="Produzione debug" onClick={() => update((draft) => produceVillage(draft))}><RefreshCw size={16} /></button></div><div className="village-assets"><div><span className="asset-icon">🌾</span><b>{game.village.fields}</b><small>campi · +miglio</small></div><div><span className="asset-icon">🪣</span><b>{game.village.wells}</b><small>pozzi · +acqua</small></div><div><span className="asset-icon">🐄</span><b>{game.village.cows}</b><small>mucche</small></div></div></section>
        </div>
      </section>

      <aside className="side-column">
        {pending?.kind === "build" && <section className="context-card ritual-card"><div className="context-title"><ScrollText size={17} /><strong>Nuova profezia</strong></div><div className="preview-chain">{pending.selected.length === 0 ? <span className="placeholder">Scegli le carte dalla mano</span> : pending.selected.map((card) => <span className="preview-module" key={card.id}>{DECK_INFO[card.type].short}<b>{card.title}</b></span>)}</div><p className={buildValidation.valid ? "valid-text" : "hint-text"}>{buildValidation.message || "Forma: QUANDO → OTTIENI oppure QUANDO → SE → OTTIENI"}</p></section>}
        {pending?.kind === "modify" && <section className="context-card ritual-card"><div className="context-title"><Hammer size={17} /><strong>Modifica profezia</strong></div><p className="hint-text">{pending.card ? pending.card.text : pending.animal ? "Sacrificio selezionato." : pending.targetId ? "Bersaglio selezionato." : "Scegli una mucca da sacrificare o una profezia bersaglio."}</p><div className="modify-buttons"><button onClick={() => chooseModifyAnimal("cow")} disabled={game.resources.cow < 1}>🐄 +2 tier</button><button onClick={() => setMode("choose-prophecy-target")}>ATTIVA → bersaglio</button></div></section>}
        <section className="context-card action-card"><div className="context-title"><Sun size={17} /><strong>Azioni del villaggio</strong></div><div className="quick-actions"><button onClick={openPresage}><CircleHelp size={15} /> Ottieni un presagio</button><button onClick={() => selectBaseAction("trade")}><HandCoins size={15} /> Commercia risorse</button><button onClick={() => selectBaseAction("sacrifice")}><FlaskConical size={15} /> Sacrificio libero</button></div></section>
        <section className="log-panel"><button className="log-title" onClick={() => setLogOpen(!logOpen)}><span><ScrollText size={16} /> Cronaca del villaggio</span>{logOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>{logOpen && <div className="log-list">{[...game.log].reverse().slice(0, 12).map((entry) => <div className={`log-entry ${entry.tone ?? ""}`} key={entry.id}><small>R{entry.round}</small><span>{entry.text}</span></div>)}</div>}</section>
        <section className="utility-panel"><button onClick={() => setDebugOpen(!debugOpen)}><span>⚙ Strumenti prototipo</span>{debugOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>{debugOpen && <div className="debug-content"><div className="debug-actions"><button onClick={() => update((draft) => { draft.resources.gold += 1; })}>+1 oro</button><button onClick={() => update((draft) => { draft.resources.blood += 1; })}>+1 sangue</button><button onClick={() => update((draft) => { draft.season = draft.season === "rainy" ? "dry" : "rainy"; })}>Cambia stagione</button><button onClick={() => update((draft) => { draft.log.push(makeLog(draft.round, "Debug: evento RAIN.", "good")); resolveProphecy(draft, { id: "rain", gain: draft.hand.find((card) => card.type === "gain1") ?? game.decks.gain1.market[0], upgrades: [], active: false, timesResolved: 0 }, "rain"); })}>Trigger RAIN</button><button onClick={() => update((draft) => produceVillage(draft))}>Trigger produzione</button></div><div className="debug-json"><span>GameState JSON</span><code>{JSON.stringify(game, null, 2).slice(0, 900)}…</code></div><div className="utility-actions"><button onClick={exportGame}>Esporta JSON</button><button onClick={() => importRef.current?.click()}>Importa JSON</button><button className="danger" onClick={resetGame}>Nuova partita</button><input ref={importRef} type="file" accept="application/json" hidden onChange={importGame} /></div></div>}</section>
      </aside>
    </main>
    {presageDraft && presageCategory && <div className="presage-overlay" role="dialog" aria-modal="true"><div className="presage-modal">
      <div className="presage-modal-header"><div><span className="eyebrow">INTERPRETA I PRESAGI</span><h2>Ottieni un presagio</h2></div><button className="modal-close" onClick={closePresage}><X size={18} /></button></div>
      <div className="presage-steps"><span className={presageDraft.step === "when" ? "current" : "done"}>01 · QUANDO</span><i>→</i><span className={presageDraft.step === "if" ? "current" : presageDraft.condition ? "done" : "muted"}>02 · SE</span><i>→</i><span className={presageDraft.step === "gain" ? "current" : "muted"}>03 · OTTIENI</span></div>
      <p className="presage-instruction">{presageDraft.step === "when" ? "Scegli uno dei 3 QUANDO che il mercato ti offre." : presageDraft.step === "if" ? "Ora interpreta una condizione SE, oppure prosegui senza condizione." : `Scegli uno dei 3 ${DECK_INFO[presageCategory].short} per completare la profezia.`}</p>
      <div className="presage-options">{game.decks[presageCategory].market.map((card) => <CardView key={card.id} card={card} selected={presageCards.some((selected) => selected.id === card.id)} disabled={false} onClick={() => selectPresageCard(presageCategory, card)} />)}</div>
      {presageDraft.step === "if" && <button className="skip-condition" onClick={skipPresageCondition}>Salta SE · crea QUANDO → OTTIENI II</button>}
      {presageDraft.step === "gain" && <div className="presage-footer"><div><span className="eyebrow">COSTO TOTALE</span><strong>{presageCards.length ? costText(presageCost) : "seleziona una carta"}</strong>{!presageCanPay && presageCards.length > 0 && <small>Risorse insufficienti</small>}</div><button className="create-presage" disabled={!presageDraft.gain || !presageValidation.valid || !presageCanPay} onClick={confirmPresage}><Sparkles size={15} /> Crea sulla plancia</button></div>}
    </div></div>}
    {game.won && <div className="victory-overlay" role="dialog" aria-modal="true"><div className="victory-card"><div className="victory-sigil">✦</div><span className="eyebrow">DESTINO COMPIUTO</span><h2>Hai vinto</h2><p>Hai risolto {VICTORY_RESOLUTIONS_PER_ROUND} profezie nello stesso turno.</p><button className="create-presage" onClick={resetGame}>Nuova partita</button></div></div>}
    <footer><span>Prototipo frontend · nessuna partita salvata sul server</span><span>Seed {game.seed}</span></footer>
  </div>;
}

export default App;
