import { useEffect, useMemo, useState } from "react";
import type { Area, EntityRegistryEntry, Hass } from "./types";
import {
  activateEntity,
  deactivateEntities,
  displayName,
  getFavorites,
  setCoverPosition,
  setFavorites,
  setLightBrightness,
} from "./ha";
import type { Language } from "./i18n";

const ACTIONABLE_DOMAINS = new Set(["light", "switch", "cover", "climate", "fan", "media_player", "lock"]);
const ACTIVE_STATES = new Set(["on", "open", "heat", "cool", "playing", "unlocked"]);

type HomeViewProps = {
  hass: Hass;
  areas: Area[];
  entities: EntityRegistryEntry[];
  now: Date;
  demo: boolean;
  language: Language;
};

type RoomModel = {
  area: Area;
  entityIds: string[];
  temperature?: number;
  activeCount: number;
  accent: "amber" | "rose" | "mint" | "blue" | "violet";
};

const accentOrder: RoomModel["accent"][] = ["amber", "rose", "mint", "blue", "violet"];

export default function HomeView({ hass, areas, entities, now, demo, language }: HomeViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [favorites, setFavoriteIds] = useState<string[]>([]);
  const copy = language === "it" ? itCopy : enCopy;

  useEffect(() => {
    let active = true;
    void getFavorites(hass)
      .then((ids) => { if (active) setFavoriteIds(ids); })
      .catch((error) => console.error("Unable to load Family Calendar favorites", error));
    return () => { active = false; };
  }, [hass]);

  const roomModels = useMemo<RoomModel[]>(() => areas.map((area, index) => {
    const allInArea = entities.filter((entry) => entry.area_id === area.area_id).map((entry) => entry.entity_id);
    const entityIds = allInArea.filter((entityId) => ACTIONABLE_DOMAINS.has(domainOf(entityId)) && hass.states[entityId]);
    return {
      area,
      entityIds,
      temperature: findTemperature(hass, allInArea),
      activeCount: entityIds.filter((entityId) => isActive(hass, entityId)).length,
      accent: accentOrder[index % accentOrder.length],
    };
  }), [areas, entities, hass]);

  const allActionable = useMemo(() => roomModels.flatMap((room) => room.entityIds), [roomModels]);
  const favoriteEntities = useMemo(
    () => favorites.filter((entityId) => hass.states[entityId] && ACTIONABLE_DOMAINS.has(domainOf(entityId))),
    [favorites, hass.states],
  );

  const temperatures = roomModels.map((room, index) => room.temperature ?? (demo ? 21.8 + index * 0.7 : undefined));
  const availableTemperatures = temperatures.filter((value): value is number => typeof value === "number");
  const selected = selectedRoom ? roomModels.find((room) => room.area.area_id === selectedRoom) ?? null : null;
  const alarm = Object.values(hass.states).find((state) => state.entity_id.startsWith("alarm_control_panel."));
  const greeting = greetingForHour(now.getHours(), copy);

  async function toggleFavorite(entityId: string) {
    const next = favorites.includes(entityId)
      ? favorites.filter((id) => id !== entityId)
      : [...favorites, entityId];
    setFavoriteIds(next);
    await setFavorites(hass, next);
  }

  async function runScene(name: "relax" | "away" | "night") {
    const keywords = name === "night" ? ["buonanotte", "good_night", "night"] : name === "away" ? ["esco", "away", "leave"] : ["relax"];
    const scene = Object.keys(hass.states).find((entityId) => entityId.startsWith("scene.") && keywords.some((keyword) => entityId.includes(keyword)));
    if (scene) await hass.callService("scene", "turn_on", { entity_id: scene });
  }

  return (
    <section className="home-overview">
      <header className="home-overview-header">
        <div className="home-greeting">
          <span>{greeting}</span>
          <small>{now.toLocaleDateString(language === "it" ? "it-IT" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}</small>
        </div>
        <div className="home-clock">{now.toLocaleTimeString(language === "it" ? "it-IT" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
        <div className="home-header-status">
          {demo && <span className="home-mini-pill neutral">Demo</span>}
          <span className="home-mini-pill online"><i />{copy.online}</span>
        </div>
      </header>

      {favoriteEntities.length > 0 && (
        <section className="favorite-accessories-section" aria-label={copy.favoriteAccessories}>
          <div className="favorite-accessories-heading">
            <h2>{copy.favoriteAccessories}</h2>
            <span>{favoriteEntities.length}</span>
          </div>
          <div className="favorite-accessories-rail">
            {favoriteEntities.map((entityId) => (
              <AccessoryTile
                key={entityId}
                hass={hass}
                entityId={entityId}
                language={language}
                favorite
                onToggleFavorite={() => void toggleFavorite(entityId)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="home-overview-layout">
        <div className="room-board">
          {roomModels.map((room) => (
            <RoomCard key={room.area.area_id} hass={hass} room={room} language={language} onOpen={() => setSelectedRoom(room.area.area_id)} />
          ))}
          {roomModels.length === 0 && <div className="room-board-empty">{copy.noRooms}</div>}
        </div>

        <aside className="home-insights">
          <section className="home-info-card home-message-card">
            <span className="home-info-kicker">{copy.houseSays}</span>
            <strong>{copy.allClear}</strong>
            <p>{copy.allClearDetail}</p>
          </section>

          <section className="home-info-card home-alarm-card">
            <div className="home-info-heading"><span>{copy.alarm}</span><strong>{alarm ? humanState(alarm.state, language) : copy.disarmed}</strong></div>
            <div className={`alarm-orb ${alarm && alarm.state !== "disarmed" ? "armed" : ""}`}><ShieldIcon /></div>
          </section>

          <section className="home-info-card home-temp-card">
            <div className="home-info-heading"><span>{copy.temperatures}</span><strong>{availableTemperatures.length ? `${average(availableTemperatures).toFixed(1)}°` : "—"}</strong></div>
            <TemperatureSparkline values={availableTemperatures.length ? availableTemperatures : [22.1, 22.6, 22.3, 23.0]} />
            <div className="temperature-room-list">
              {roomModels.slice(0, 4).map((room, index) => (
                <span key={room.area.area_id}><i className={room.accent} />{room.area.name}<strong>{(temperatures[index] ?? 22 + index * 0.4).toFixed(1)}°</strong></span>
              ))}
            </div>
          </section>

          <section className="home-info-card home-scenes-card">
            <div className="home-info-heading"><span>{copy.quickActions}</span></div>
            <div className="scene-grid">
              <button onClick={() => void runScene("relax")}><SparklesIcon /><span>{copy.relax}</span></button>
              <button onClick={() => void runScene("away")}><AwayIcon /><span>{copy.away}</span></button>
              <button onClick={() => void runScene("night")}><MoonIcon /><span>{copy.goodNight}</span></button>
              <button className="scene-danger" onClick={() => void deactivateEntities(hass, allActionable)}><PowerIcon /><span>{copy.turnOffAll}</span></button>
            </div>
          </section>
        </aside>
      </div>

      {selected && (
        <RoomSheet
          hass={hass}
          room={selected}
          language={language}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </section>
  );
}

function RoomCard({ hass, room, language, onOpen }: { hass: Hass; room: RoomModel; language: Language; onOpen: () => void }) {
  const quick = room.entityIds.slice(0, 3);
  const accessories = room.entityIds.slice(0, 4);
  const temp = room.temperature;
  const activity = room.entityIds.length ? Math.max(8, Math.round((room.activeCount / room.entityIds.length) * 100)) : 8;

  return (
    <article className={`room-card room-${room.accent}`}>
      <button className="room-card-open" onClick={onOpen} aria-label={`${language === "it" ? "Apri" : "Open"} ${room.area.name}`}>
        <span className="room-name"><RoomIcon /><strong>{room.area.name}</strong></span>
        <span className="room-temp">{typeof temp === "number" ? `${temp.toFixed(1)}°` : "—"}</span>
      </button>

      <div className="room-quick-row">
        {quick.map((entityId) => (
          <button key={entityId} className={`room-round-control ${isActive(hass, entityId) ? "active" : ""}`} onClick={() => void activateEntity(hass, entityId)} title={displayName(hass, entityId)}>
            {iconForDomain(domainOf(entityId))}
          </button>
        ))}
      </div>

      <div className="room-activity-track"><i style={{ width: `${activity}%` }} /></div>

      <div className="room-accessories">
        {accessories.map((entityId) => (
          <button key={entityId} className={isActive(hass, entityId) ? "active" : ""} onClick={() => void activateEntity(hass, entityId)}>
            {iconForDomain(domainOf(entityId))}<span>{shortName(displayName(hass, entityId), room.area.name)}</span>
          </button>
        ))}
      </div>

      <button className="room-more" onClick={onOpen}>{language === "it" ? "Accessori" : "Accessories"}<ChevronIcon /></button>
    </article>
  );
}

function RoomSheet({ hass, room, language, favorites, onToggleFavorite, onClose }: {
  hass: Hass;
  room: RoomModel;
  language: Language;
  favorites: string[];
  onToggleFavorite: (entityId: string) => Promise<void>;
  onClose: () => void;
}) {
  const copy = language === "it" ? itCopy : enCopy;
  return (
    <div className="home-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="home-room-sheet" role="dialog" aria-modal="true" aria-label={room.area.name}>
        <div className="home-sheet-heading">
          <div>
            <span className="home-info-kicker">{copy.roomControls}</span>
            <h2>{room.area.name}</h2>
          </div>
          <div className="home-sheet-actions">
            <button className="sheet-off" onClick={() => void deactivateEntities(hass, room.entityIds)}><PowerIcon />{copy.turnOffAll}</button>
            <button className="sheet-close" onClick={onClose} aria-label={copy.close}>×</button>
          </div>
        </div>

        <div className="home-sheet-grid">
          {room.entityIds.map((entityId) => (
            <AccessoryTile
              hass={hass}
              entityId={entityId}
              language={language}
              favorite={favorites.includes(entityId)}
              onToggleFavorite={() => void onToggleFavorite(entityId)}
              key={entityId}
              detailed
            />
          ))}
          {room.entityIds.length === 0 && <div className="sheet-empty">{copy.noDevices}</div>}
        </div>
      </section>
    </div>
  );
}

function AccessoryTile({ hass, entityId, language, favorite, onToggleFavorite, detailed = false }: {
  hass: Hass;
  entityId: string;
  language: Language;
  favorite: boolean;
  onToggleFavorite: () => void;
  detailed?: boolean;
}) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const active = isActive(hass, entityId);
  const unavailable = state.state === "unavailable" || state.state === "unknown";
  const brightness = Math.round((Number(state.attributes.brightness ?? 180) / 255) * 100);
  const position = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  const favoriteLabel = favorite
    ? (language === "it" ? "Rimuovi dai preferiti" : "Remove from favorites")
    : (language === "it" ? "Aggiungi ai preferiti" : "Add to favorites");

  return (
    <article className={`apple-accessory-tile ${active ? "active" : ""} ${unavailable ? "unavailable" : ""} ${detailed ? "detailed" : ""}`}>
      <button className="apple-accessory-main" onClick={() => !unavailable && void activateEntity(hass, entityId)} disabled={unavailable}>
        <span className="apple-accessory-icon">{iconForDomain(domain)}</span>
        <span className="apple-accessory-copy">
          <strong>{displayName(hass, entityId)}</strong>
          <small className={unavailable ? "danger" : ""}>{unavailable ? (language === "it" ? "Non risponde" : "No response") : accessoryState(hass, entityId, language)}</small>
        </span>
      </button>

      <button className={`apple-favorite-toggle ${favorite ? "selected" : ""}`} onClick={onToggleFavorite} aria-label={favoriteLabel} title={favoriteLabel}>
        <StarIcon />
      </button>

      {unavailable && <span className="apple-accessory-warning" aria-hidden="true">!</span>}

      {detailed && !unavailable && domain === "light" && (
        <label className="sheet-slider">
          <span>{language === "it" ? "Intensità" : "Brightness"}<strong>{brightness}%</strong></span>
          <input type="range" min="1" max="100" defaultValue={brightness} onChange={(event) => void setLightBrightness(hass, entityId, Number(event.target.value))} />
        </label>
      )}
      {detailed && !unavailable && domain === "cover" && (
        <label className="sheet-slider">
          <span>{language === "it" ? "Posizione" : "Position"}<strong>{position}%</strong></span>
          <input type="range" min="0" max="100" defaultValue={position} onChange={(event) => void setCoverPosition(hass, entityId, Number(event.target.value))} />
        </label>
      )}
    </article>
  );
}

function findTemperature(hass: Hass, entityIds: string[]): number | undefined {
  for (const entityId of entityIds) {
    const state = hass.states[entityId];
    if (!state) continue;
    const deviceClass = String(state.attributes.device_class ?? "");
    const unit = String(state.attributes.unit_of_measurement ?? "");
    if (domainOf(entityId) === "sensor" && (deviceClass === "temperature" || unit.includes("°"))) {
      const value = Number(state.state);
      if (Number.isFinite(value)) return value;
    }
    if (domainOf(entityId) === "climate") {
      const value = Number(state.attributes.current_temperature);
      if (Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

function TemperatureSparkline({ values }: { values: number[] }) {
  const points = values.length > 1 ? values : [values[0] ?? 22, values[0] ?? 22];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(0.5, max - min);
  const polyline = points.map((value, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 34 - ((value - min) / range) * 24;
    return `${x},${y}`;
  }).join(" ");
  return <svg className="home-temp-sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

function greetingForHour(hour: number, copy: typeof itCopy) {
  if (hour < 5) return copy.goodNight;
  if (hour < 12) return copy.goodMorning;
  if (hour < 18) return copy.goodAfternoon;
  return copy.goodEvening;
}

function accessoryState(hass: Hass, entityId: string, language: Language) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  if (domain === "light" && state.state === "on") return `${Math.round((Number(state.attributes.brightness ?? 255) / 255) * 100)}%`;
  if (domain === "cover") return `${Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0))}%`;
  return humanState(state.state, language);
}

function humanState(value: string, language: Language) {
  const it: Record<string, string> = { on: "Acceso", off: "Spento", open: "Aperto", closed: "Chiuso", heat: "Riscaldamento", cool: "Raffrescamento", playing: "In riproduzione", unavailable: "Non risponde", unknown: "Non disponibile", unlocked: "Sbloccata", locked: "Bloccata", disarmed: "Disattivato", armed_home: "Inserito", armed_away: "Inserito" };
  const en: Record<string, string> = { on: "On", off: "Off", open: "Open", closed: "Closed", heat: "Heating", cool: "Cooling", playing: "Playing", unavailable: "No response", unknown: "Unavailable", unlocked: "Unlocked", locked: "Locked", disarmed: "Disarmed", armed_home: "Armed", armed_away: "Armed" };
  return (language === "it" ? it : en)[value] ?? value;
}

function shortName(name: string, roomName: string) {
  const cleaned = name.replace(new RegExp(roomName, "ig"), "").trim();
  return cleaned || name;
}

function domainOf(entityId: string) { return entityId.split(".")[0] ?? ""; }
function isActive(hass: Hass, entityId: string) { return ACTIVE_STATES.has(hass.states[entityId]?.state ?? ""); }
function average(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / values.length; }

const itCopy = {
  online: "Casa online",
  noRooms: "Nessuna stanza disponibile",
  favoriteAccessories: "Accessori preferiti",
  houseSays: "La casa ti dice",
  allClear: "Tutto tranquillo",
  allClearDetail: "Nessuna anomalia rilevata. Le funzioni principali sono operative.",
  alarm: "Allarme",
  disarmed: "Disattivato",
  temperatures: "Temperature",
  quickActions: "Azioni rapide",
  relax: "Relax",
  away: "Esco",
  goodNight: "Buonanotte",
  turnOffAll: "Spegni tutto",
  roomControls: "Accessori stanza",
  close: "Chiudi",
  noDevices: "Nessun dispositivo disponibile",
  goodMorning: "Buongiorno",
  goodAfternoon: "Buon pomeriggio",
  goodEvening: "Buonasera",
};

const enCopy: typeof itCopy = {
  online: "Home online",
  noRooms: "No rooms available",
  favoriteAccessories: "Favorite accessories",
  houseSays: "Home says",
  allClear: "All clear",
  allClearDetail: "No issues detected. Main home functions are operating normally.",
  alarm: "Alarm",
  disarmed: "Disarmed",
  temperatures: "Temperatures",
  quickActions: "Quick actions",
  relax: "Relax",
  away: "Away",
  goodNight: "Good night",
  turnOffAll: "Turn off all",
  roomControls: "Room accessories",
  close: "Close",
  noDevices: "No devices available",
  goodMorning: "Good morning",
  goodAfternoon: "Good afternoon",
  goodEvening: "Good evening",
};

function iconForDomain(domain: string) {
  if (domain === "light") return <BulbIcon />;
  if (domain === "cover") return <CoverIcon />;
  if (domain === "climate") return <ClimateIcon />;
  if (domain === "lock") return <LockIcon />;
  if (domain === "media_player") return <MediaIcon />;
  if (domain === "fan") return <FanIcon />;
  return <PowerIcon />;
}

function RoomIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.8 11.1 12 4.5l8.2 6.6v8.3c0 .6-.5 1.1-1.1 1.1h-4.7v-5.7H9.6v5.7H4.9c-.6 0-1.1-.5-1.1-1.1v-8.3Z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round"/></svg>; }
function PowerIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2v8.5M7.2 5.9a8 8 0 1 0 9.6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function BulbIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 17.7h5.6M10 20.5h4M12 2.6a6.7 6.7 0 0 0-3.9 12.1c.7.5 1.1 1.4 1.1 2.4h5.6c0-1 .4-1.9 1.1-2.4A6.7 6.7 0 0 0 12 2.6Z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CoverIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.55"/><path d="M5 8h14M8 11h8M8 14h8M8 17h8" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>; }
function ClimateIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 14.9V5.5a2.5 2.5 0 0 0-5 0v9.4a4.5 4.5 0 1 0 5 0Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function LockIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 10.5V8.2a4.8 4.8 0 0 1 9.6 0v2.3M6 10.5h12v10H6v-10Z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="15.2" r="1" fill="currentColor"/></svg>; }
function MediaIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="13" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.55"/><path d="M9 9.3h6M9 12h6M9 14.7h4" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>; }
function FanIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1.7" fill="currentColor"/><path d="M12 10.3c-1.8-4.7 1.8-6.8 4-4.8 1.4 1.3-.1 4.5-4 6.5M10.5 12.8C5.8 14.7 4 11.1 6 9c1.4-1.4 4.5 0 6.2 3.6M13.4 13.2c2.8 4.2-.3 6.9-2.9 5.4-1.7-1-1.2-4.5 1.6-6.6" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/></svg>; }
function ShieldIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 18.8 6v5c0 4.8-2.7 8-6.8 9.8C7.9 19 5.2 15.8 5.2 11V6L12 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="m9.3 12 1.7 1.7 3.8-3.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function SparklesIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.45 4.45L18 9l-4.55 1.55L12 15l-1.55-4.45L6 9l4.45-1.55L12 3Zm6 11 .75 2.2L21 17l-2.25.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" fill="currentColor"/></svg>; }
function AwayIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h10m-3-4 4 4-4 4M5 5h14v14H5" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function MoonIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.8 15.5A8 8 0 0 1 8.5 5.2a8 8 0 1 0 10.3 10.3Z" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round"/></svg>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function StarIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.2 2.65 5.38 5.94.86-4.3 4.2 1.02 5.92L12 16.77l-5.31 2.79 1.02-5.92-4.3-4.2 5.94-.86L12 3.2Z" fill="currentColor"/></svg>; }
