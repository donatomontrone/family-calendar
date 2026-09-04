import { useMemo, useState } from "react";
import type { Area, EntityRegistryEntry, Hass } from "./types";
import {
  activateEntity,
  deactivateEntities,
  displayName,
  setCoverPosition,
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
  const copy = language === "it" ? itCopy : enCopy;

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

  const allActionable = useMemo(
    () => roomModels.flatMap((room) => room.entityIds),
    [roomModels],
  );

  const temperatures = roomModels.map((room, index) => room.temperature ?? (demo ? 21.8 + index * 0.7 : undefined));
  const availableTemperatures = temperatures.filter((value): value is number => typeof value === "number");
  const selected = selectedRoom ? roomModels.find((room) => room.area.area_id === selectedRoom) ?? null : null;

  const alarm = Object.values(hass.states).find((state) => state.entity_id.startsWith("alarm_control_panel."));
  const greeting = greetingForHour(now.getHours(), copy);

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
        <RoomSheet hass={hass} room={selected} language={language} onClose={() => setSelectedRoom(null)} />
      )}
    </section>
  );
}

function RoomCard({ hass, room, language, onOpen }: { hass: Hass; room: RoomModel; language: Language; onOpen: () => void }) {
  const quick = room.entityIds.slice(0, 3);
  const accessories = room.entityIds.slice(0, 5);
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
          <button
            key={entityId}
            className={`room-round-control ${isActive(hass, entityId) ? "active" : ""}`}
            onClick={() => void activateEntity(hass, entityId)}
            title={displayName(hass, entityId)}
          >
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

      <button className="room-more" onClick={onOpen}>{language === "it" ? "Dettagli" : "Details"}<ChevronIcon /></button>
    </article>
  );
}

function RoomSheet({ hass, room, language, onClose }: { hass: Hass; room: RoomModel; language: Language; onClose: () => void }) {
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
            <SheetAccessory hass={hass} entityId={entityId} language={language} key={entityId} />
          ))}
          {room.entityIds.length === 0 && <div className="sheet-empty">{copy.noDevices}</div>}
        </div>
      </section>
    </div>
  );
}

function SheetAccessory({ hass, entityId, language }: { hass: Hass; entityId: string; language: Language }) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const active = isActive(hass, entityId);
  const brightness = Math.round((Number(state.attributes.brightness ?? 180) / 255) * 100);
  const position = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));

  return (
    <article className={`sheet-accessory ${active ? "active" : ""}`}>
      <button className="sheet-accessory-main" onClick={() => void activateEntity(hass, entityId)}>
        <span>{iconForDomain(domain)}</span>
        <strong>{displayName(hass, entityId)}</strong>
        <small>{accessoryState(hass, entityId, language)}</small>
      </button>
      {domain === "light" && (
        <label className="sheet-slider">
          <span>{language === "it" ? "Intensità" : "Brightness"}<strong>{brightness}%</strong></span>
          <input type="range" min="1" max="100" defaultValue={brightness} onChange={(event) => void setLightBrightness(hass, entityId, Number(event.target.value))} />
        </label>
      )}
      {domain === "cover" && (
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
  const it: Record<string, string> = { on: "Acceso", off: "Spento", open: "Aperto", closed: "Chiuso", heat: "Riscaldamento", cool: "Raffrescamento", playing: "In riproduzione", disarmed: "Disattivato", armed_home: "Inserito", armed_away: "Inserito" };
  const en: Record<string, string> = { on: "On", off: "Off", open: "Open", closed: "Closed", heat: "Heating", cool: "Cooling", playing: "Playing", disarmed: "Disarmed", armed_home: "Armed", armed_away: "Armed" };
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
  roomControls: "Controlli stanza",
  close: "Chiudi",
  noDevices: "Nessun dispositivo disponibile",
  goodMorning: "Buongiorno",
  goodAfternoon: "Buon pomeriggio",
  goodEvening: "Buonasera",
};

const enCopy: typeof itCopy = {
  online: "Home online",
  noRooms: "No rooms available",
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
  roomControls: "Room controls",
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

function RoomIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.8Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>; }
function PowerIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v9M7.1 5.9a8 8 0 1 0 9.8 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function BulbIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6m-5 3h4m-2-19a7 7 0 0 0-4 12.7c.7.5 1 1.2 1 2.3h6c0-1.1.3-1.8 1-2.3A7 7 0 0 0 12 2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CoverIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4Zm0 5h14M8 7h8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function ClimateIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M8 6l4 3 4-3M8 18l4-3 4 3M4.2 7.5l15.6 9M4.2 16.5l15.6-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function LockIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3m-11 0h12v10H6V11Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function MediaIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor"/></svg>; }
function FanIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 10c-2-5 2-7 4-5 1.5 1.7-.3 5-4 7M10.3 13c-5 2.1-7-1.8-4.8-3.8 1.7-1.5 5 .2 6.8 3.8M13.6 13.2c3 4.6-.5 7.3-3.1 5.7-1.9-1.2-1.2-4.9 1.8-7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }
function ShieldIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 5-2.8 8.2-7 10-4.2-1.8-7-5-7-10V6l7-3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="m9.2 12 1.8 1.8 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function SparklesIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Zm6 11 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" fill="currentColor"/></svg>; }
function AwayIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h10m-3-4 4 4-4 4M5 5h14v14H5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function MoonIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 15.5A8 8 0 0 1 8.5 5 8 8 0 1 0 19 15.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
