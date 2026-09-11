import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import ClimateControl from "./ClimateControl";
import DeviceControls from "./DeviceControls";
import type { Area, EntityRegistryEntry, Hass } from "./types";
import {
  activateEntity,
  deactivateEntities,
  displayName,
  getFavorites,
  setCoverPosition,
  setFavorites,
  setLightBrightness,
  setLightColorTemperature,
} from "./ha";
import { getWhiteTemperature, whiteTemperatureAccent } from "./light-temperature";
import type { Language } from "./i18n";

const CONTROL_DOMAINS = new Set(["light", "switch", "cover", "climate", "fan", "media_player", "lock", "vacuum"]);
const ACTIVE_STATES = new Set(["on", "open", "heat", "cool", "heat_cool", "auto", "fan_only", "dry", "playing", "unlocked", "cleaning"]);
type Overlay = "routines" | "batteries" | "climate" | "sensors" | "cameras" | "media" | "vacuum" | "car" | "cover" | null;
type LightControlMode = "brightness" | "temperature";

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
  allIds: string[];
  controllableIds: string[];
  passiveIds: string[];
  temperature?: number;
};

export default function HomeView({ hass, areas, entities, now, demo, language }: HomeViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [favorites, setFavoriteIds] = useState<string[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [roomClimateEntityId, setRoomClimateEntityId] = useState<string | null>(null);
  const copy = language === "it" ? itCopy : enCopy;

  useEffect(() => {
    let active = true;
    void getFavorites(hass).then((ids) => { if (active) setFavoriteIds(ids); }).catch(console.error);
    return () => { active = false; };
  }, [hass]);

  const rooms = useMemo<RoomModel[]>(() => areas.map((area) => {
    const allIds = entities
      .filter((entry) => entry.area_id === area.area_id)
      .map((entry) => entry.entity_id)
      .filter((id) => hass.states[id]);
    const controllableIds = allIds.filter((id) => CONTROL_DOMAINS.has(domainOf(id)) && !isPassive(hass, id));
    const passiveIds = allIds.filter((id) => !controllableIds.includes(id));
    return { area, allIds, controllableIds, passiveIds, temperature: findTemperature(hass, allIds) };
  }), [areas, entities, hass]);

  const selected = selectedRoom ? rooms.find((room) => room.area.area_id === selectedRoom) ?? null : null;
  const allActionable = useMemo(() => rooms.flatMap((room) => room.controllableIds), [rooms]);
  const temperatures = rooms.map((room, index) => room.temperature ?? (demo ? 21.7 + index * 0.3 : undefined));
  const knownTemperatures = temperatures.filter((value): value is number => typeof value === "number");
  const climateIds = allActionable.filter((id) => domainOf(id) === "climate");
  const weather = Object.values(hass.states).find((state) => state.entity_id.startsWith("weather."));
  const outside = Number(weather?.attributes.temperature ?? 24.5);

  async function toggleFavorite(entityId: string) {
    const next = favorites.includes(entityId) ? favorites.filter((id) => id !== entityId) : [...favorites, entityId];
    setFavoriteIds(next);
    await setFavorites(hass, next);
  }

  function openHeaderAction(kind: "alarm" | "notifications") {
    document.dispatchEvent(new CustomEvent("family-calendar-header-action", { detail: kind }));
  }

  async function runScene(name: "night" | "guest" | "movie") {
    const keys = name === "night" ? ["buonanotte", "good_night", "night"] : name === "guest" ? ["ospiti", "guest"] : ["film", "movie"];
    const scene = Object.keys(hass.states).find((id) => id.startsWith("scene.") && keys.some((key) => id.includes(key)));
    if (scene) await hass.callService("scene", "turn_on", { entity_id: scene });
  }

  return (
    <section className="reel-home home-refactor-v4">
      <div className="reel-dashboard">
        <div className="reel-room-grid">
          {rooms.map((room) => (
            <RoomCard
              key={room.area.area_id}
              hass={hass}
              room={room}
              language={language}
              onClimate={(entityId) => setRoomClimateEntityId(entityId)}
            />
          ))}
        </div>

        <aside className="reel-side">
          <section className="reel-side-card home-message-card">
            <span className="reel-kicker">{copy.houseSays}</span>
            <div className="house-message"><CheckIcon /><div><strong>{copy.allClear}</strong><span>{copy.allClearDetail}</span></div></div>
          </section>

          <button className="reel-side-card alarm-row" onClick={() => openHeaderAction("alarm")}>
            <span className="side-icon mint"><ShieldIcon /></span><div><strong>{copy.alarm}</strong><small>{copy.disarmed} · {copy.homeFree}</small></div><b>{copy.manage}</b>
          </button>

          <button className="reel-side-card thermostat-card thermostat-card-v4" onClick={() => setOverlay("climate")}>
            <div className="thermostat-v4-head"><span><ThermometerIcon />{copy.climate}</span><b>{copy.manage}</b></div>
            <div className="thermostat-v4-body">
              <div className="thermostat-v4-ring" style={{ "--thermostat-progress": `${Math.min(100, Math.max(0, ((average(knownTemperatures.length ? knownTemperatures : [22]) - 16) / 14) * 100))}%` } as CSSProperties}>
                <div><strong>{average(knownTemperatures.length ? knownTemperatures : [22]).toFixed(1)}°</strong><span>{copy.inside}</span></div>
              </div>
              <div className="thermostat-v4-stats">
                <span><small>{copy.outside}</small><strong>{outside.toFixed(1)}°</strong></span>
                <span><small>{copy.zones}</small><strong>{climateIds.length}</strong></span>
                <span><small>{copy.status}</small><strong>{climateIds.some((id) => isActive(hass, id)) ? copy.active : copy.idle}</strong></span>
              </div>
            </div>
          </button>

          <section className="reel-side-card waste-card">
            <div className="side-heading"><span><RecycleIcon /> {copy.waste}</span><b>{copy.today}</b></div>
            <div className="waste-value"><span className="side-icon mint"><TrashBinIcon /></span><div><strong>{copy.residual}</strong><small>{copy.collectionReady}</small></div></div>
          </section>

          <div className="reel-tools-grid">
            <ToolButton icon={<SparklesIcon />} label={copy.routines} onClick={() => setOverlay("routines")} />
            <ToolButton icon={<BatteryIcon />} label={copy.batteries} onClick={() => setOverlay("batteries")} />
            <ToolButton icon={<RadarIcon />} label={copy.sensors} onClick={() => setOverlay("sensors")} />
            <ToolButton icon={<ClimateIcon />} label={copy.climate} onClick={() => setOverlay("climate")} />
            <ToolButton icon={<CameraIcon />} label={copy.cameras} onClick={() => setOverlay("cameras")} />
            <ToolButton icon={<MediaIcon />} label={copy.media} onClick={() => setOverlay("media")} />
            <ToolButton icon={<VacuumIcon />} label={copy.vacuum} onClick={() => setOverlay("vacuum")} />
            <ToolButton icon={<CarIcon />} label={copy.car} onClick={() => setOverlay("car")} />
            <ToolButton icon={<CoverIcon />} label={copy.covers} onClick={() => setOverlay("cover")} />
          </div>
        </aside>
      </div>

      {roomClimateEntityId && hass.states[roomClimateEntityId] && (
        <div className="home-calendar-device-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) setRoomClimateEntityId(null); }}>
          <DeviceControls hass={hass} entityId={roomClimateEntityId} language={language} onClose={() => setRoomClimateEntityId(null)} />
        </div>
      )}

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

      {overlay && (
        <FeatureOverlay
          kind={overlay}
          hass={hass}
          language={language}
          rooms={rooms}
          onClose={() => setOverlay(null)}
          onRunScene={runScene}
          onAllOff={() => void deactivateEntities(hass, allActionable)}
        />
      )}
    </section>
  );
}

function RoomCard({ hass, room, language, onClimate }: { hass: Hass; room: RoomModel; language: Language; onClimate: (entityId: string) => void }) {
  const visibleControlIds = room.controllableIds.filter((id) => domainOf(id) !== "climate");
  const editableIds = visibleControlIds.filter((id) => ["light", "cover"].includes(domainOf(id)));
  const climateId = room.controllableIds.find((id) => domainOf(id) === "climate");
  const climateActive = Boolean(climateId && isActive(hass, climateId));
  const visiblePassiveIds = room.passiveIds.filter((id) => !isRoomTemperatureSensor(hass, id)).slice(0, climateActive ? 3 : 4);
  const [selectedControl, setSelectedControl] = useState<string | null>(() => editableIds[0] ?? null);
  const [lightMode, setLightMode] = useState<LightControlMode>("brightness");
  const selectedState = selectedControl ? hass.states[selectedControl] : undefined;
  const selectedDomain = selectedControl ? domainOf(selectedControl) : null;

  useEffect(() => {
    if (selectedControl && editableIds.includes(selectedControl)) return;
    setSelectedControl(editableIds[0] ?? null);
  }, [room.area.area_id, editableIds.join("|"), selectedControl]);

  const runEntity = (entityId: string) => {
    if (editableIds.includes(entityId)) setSelectedControl(entityId);
    if (domainOf(entityId) === "cover") return;
    void activateEntity(hass, entityId);
  };

  return (
    <article className="reel-room room-card-v4">
      <div className="reel-room-head room-head-v4">
        <span className="room-title-v4"><i>{roomIcon(room.area.name)}</i><strong>{room.area.name}</strong></span>
        <button
          type="button"
          className="room-temperature-button"
          disabled={!climateId}
          aria-label={climateId ? `${language === "it" ? "Apri clima" : "Open climate"} ${room.area.name}` : undefined}
          onClick={() => { if (climateId) onClimate(climateId); }}
        >
          <b>{typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}</b>
        </button>
      </div>

      <div className="room-device-section room-device-active-section">
        <span className="room-section-label">{language === "it" ? "Controlli" : "Controls"}</span>
        <div className="room-device-grid-v4">
          {visibleControlIds.slice(0, 4).map((id) => (
            <RoomDeviceButton
              key={id}
              hass={hass}
              entityId={id}
              selected={selectedControl === id}
              onClick={() => runEntity(id)}
            />
          ))}
          {!visibleControlIds.length && <small className="room-empty-v4">{language === "it" ? "Nessun dispositivo controllabile" : "No controllable devices"}</small>}
        </div>
      </div>

      {selectedState && (selectedDomain === "light" || selectedDomain === "cover") && (
        <RoomQuickControl
          hass={hass}
          entityId={selectedControl!}
          language={language}
          lightMode={lightMode}
          onLightMode={setLightMode}
        />
      )}

      <div className="room-device-section room-passive-section-v4">
        <span className="room-section-label">{language === "it" ? "Sensori e stato" : "Sensors & status"}</span>
        <div className="room-passive-grid-v4">
          {visiblePassiveIds.map((id) => (
            <div className="room-passive-device-v4" key={id}>
              <span>{iconForEntity(hass, id)}</span>
              <div><strong>{shortName(displayName(hass, id), room.area.name)}</strong><small>{entityStatus(hass, id, language)}</small></div>
            </div>
          ))}
          {climateActive && climateId && (
            <div className="room-passive-device-v4 room-climate-status-v6">
              <span><ClimateIcon /></span>
              <div><strong>{language === "it" ? "Clima acceso" : "Climate on"}</strong><small>{climateTargetLabel(hass, climateId, language)}</small></div>
            </div>
          )}
          {!visiblePassiveIds.length && !climateActive && <small className="room-empty-v4">{language === "it" ? "Nessun sensore" : "No sensors"}</small>}
        </div>
      </div>
    </article>
  );
}

function RoomDeviceButton({ hass, entityId, selected, onClick }: { hass: Hass; entityId: string; selected: boolean; onClick: () => void }) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const active = isActive(hass, entityId);
  const unavailable = ["unavailable", "unknown"].includes(state?.state ?? "unknown");
  const style = domain === "light" ? ({ "--room-device-accent": whiteTemperatureAccent(getWhiteTemperature(state.attributes)) } as CSSProperties) : undefined;
  return (
    <button
      className={`room-device-button-v4 domain-${domain} ${active ? "active" : ""} ${selected ? "selected" : ""}`}
      style={style}
      onClick={onClick}
      disabled={unavailable}
    >
      <span>{iconForEntity(hass, entityId)}</span>
      <div><strong>{displayName(hass, entityId)}</strong><small>{unavailable ? "Non disponibile" : entityStatus(hass, entityId, "it")}</small></div>
    </button>
  );
}

function RoomQuickControl({ hass, entityId, language, lightMode, onLightMode }: { hass: Hass; entityId: string; language: Language; lightMode: LightControlMode; onLightMode: (mode: LightControlMode) => void }) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const temperature = domain === "light" ? getWhiteTemperature(state.attributes) : null;
  const brightness = Math.round((Number(state.attributes.brightness ?? 180) / 255) * 100);
  const coverPosition = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  const value = domain === "cover" ? coverPosition : lightMode === "brightness" ? brightness : temperature!.currentKelvin;
  const min = domain === "cover" ? 0 : lightMode === "brightness" ? 1 : temperature!.minKelvin;
  const max = domain === "cover" ? 100 : lightMode === "brightness" ? 100 : temperature!.maxKelvin;
  const step = domain === "light" && lightMode === "temperature" ? 50 : 1;
  const label = domain === "cover"
    ? (language === "it" ? "Posizione" : "Position")
    : lightMode === "brightness"
      ? (language === "it" ? "Luminosità" : "Brightness")
      : (language === "it" ? "Temperatura bianco" : "White temperature");
  const formatted = domain === "light" && lightMode === "temperature" ? `${Math.round(value)} K` : `${Math.round(value)}%`;

  return (
    <div className={`room-quick-control-v4 domain-${domain}`}>
      <div className="room-quick-control-head">
        <div><small>{displayName(hass, entityId)}</small><strong>{label}<b>{formatted}</b></strong></div>
        {domain === "light" && (
          <div className="room-light-mode-v4">
            <button className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")} aria-label={language === "it" ? "Luminosità" : "Brightness"}><SunIcon /></button>
            <button className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")} aria-label={language === "it" ? "Temperatura bianco" : "White temperature"}><ThermometerIcon /></button>
          </div>
        )}
      </div>
      <input
        className={domain === "light" && lightMode === "temperature" ? "white-temperature-range" : ""}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (domain === "cover") void setCoverPosition(hass, entityId, next);
          else if (lightMode === "brightness") void setLightBrightness(hass, entityId, next);
          else void setLightColorTemperature(hass, entityId, next);
        }}
      />
    </div>
  );
}

function RoomSheet({ hass, room, language, favorites, onToggleFavorite, onClose }: { hass: Hass; room: RoomModel; language: Language; favorites: string[]; onToggleFavorite: (id: string) => Promise<void>; onClose: () => void }) {
  const copy = language === "it" ? itCopy : enCopy;
  return (
    <div className="reel-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="reel-modal room-modal">
        <div className="modal-head"><div><span className="reel-kicker">{copy.roomControls}</span><h2>{room.area.name}</h2></div><div><button className="modal-danger" onClick={() => void deactivateEntities(hass, room.controllableIds)}><PowerIcon />{copy.turnOffAll}</button><button className="modal-close" onClick={onClose} aria-label={copy.close}><CloseIcon /></button></div></div>
        <div className="room-modal-grid home-room-modal-grid-v4">
          {room.allIds.map((id) => <AccessoryTile key={id} hass={hass} entityId={id} language={language} favorite={favorites.includes(id)} onToggleFavorite={() => void onToggleFavorite(id)} />)}
        </div>
      </section>
    </div>
  );
}

function AccessoryTile({ hass, entityId, language, favorite, onToggleFavorite }: { hass: Hass; entityId: string; language: Language; favorite: boolean; onToggleFavorite: () => void }) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const passive = isPassive(hass, entityId);
  const active = !passive && isActive(hass, entityId);
  const unavailable = ["unavailable", "unknown"].includes(state.state);
  const style = domain === "light" ? ({ "--accessory-accent": whiteTemperatureAccent(getWhiteTemperature(state.attributes)) } as CSSProperties) : undefined;
  return (
    <article className={`apple-accessory-tile domain-${domain} ${passive ? "passive" : ""} ${active ? "active" : ""} ${unavailable ? "unavailable" : ""}`} style={style}>
      {passive ? (
        <div className="apple-accessory-main"><span className="apple-accessory-icon">{iconForEntity(hass, entityId)}</span><span className="apple-accessory-copy"><strong>{displayName(hass, entityId)}</strong><small>{entityStatus(hass, entityId, language)}</small></span></div>
      ) : (
        <button className="apple-accessory-main" onClick={() => !unavailable && void activateEntity(hass, entityId)} disabled={unavailable}><span className="apple-accessory-icon">{iconForEntity(hass, entityId)}</span><span className="apple-accessory-copy"><strong>{displayName(hass, entityId)}</strong><small>{entityStatus(hass, entityId, language)}</small></span></button>
      )}
      <button className={`apple-favorite-toggle ${favorite ? "selected" : ""}`} onClick={onToggleFavorite} aria-label={favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}><StarIcon /></button>
      {!passive && !unavailable && domain === "light" && <InlineLightControls hass={hass} entityId={entityId} language={language} />}
      {!passive && !unavailable && domain === "cover" && <InlineCoverControl hass={hass} entityId={entityId} language={language} />}
      {!passive && !unavailable && domain === "climate" && <ClimateControl hass={hass} entityId={entityId} language={language} variant="compact" showName={false} />}
    </article>
  );
}

function InlineLightControls({ hass, entityId, language }: { hass: Hass; entityId: string; language: Language }) {
  const state = hass.states[entityId];
  const white = getWhiteTemperature(state.attributes);
  const brightness = Math.round((Number(state.attributes.brightness ?? 180) / 255) * 100);
  return <div className="home-inline-light-v4"><label><span>{language === "it" ? "Luminosità" : "Brightness"}<b>{brightness}%</b></span><input type="range" min="1" max="100" value={brightness} onChange={(e) => void setLightBrightness(hass, entityId, Number(e.target.value))} /></label><label><span>{language === "it" ? "Temperatura bianco" : "White temperature"}<b>{Math.round(white.currentKelvin)} K</b></span><input className="white-temperature-range" type="range" min={white.minKelvin} max={white.maxKelvin} step="50" value={white.currentKelvin} onChange={(e) => void setLightColorTemperature(hass, entityId, Number(e.target.value))} /></label></div>;
}

function InlineCoverControl({ hass, entityId, language }: { hass: Hass; entityId: string; language: Language }) {
  const state = hass.states[entityId];
  const position = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  return <label className="home-inline-cover-v4"><span>{language === "it" ? "Posizione" : "Position"}<b>{position}%</b></span><input type="range" min="0" max="100" value={position} onChange={(e) => void setCoverPosition(hass, entityId, Number(e.target.value))} /></label>;
}

function FeatureOverlay({ kind, hass, language, rooms, onClose, onRunScene, onAllOff }: { kind: Exclude<Overlay, null>; hass: Hass; language: Language; rooms: RoomModel[]; onClose: () => void; onRunScene: (name: "night" | "guest" | "movie") => Promise<void>; onAllOff: () => void }) {
  const copy = language === "it" ? itCopy : enCopy;
  return <div className="reel-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className={`reel-modal feature-modal ${kind}-modal`}><div className="modal-head"><div><span className="reel-kicker">{copy.home}</span><h2>{overlayTitle(kind, copy)}</h2></div><button className="modal-close" onClick={onClose} aria-label={copy.close}><CloseIcon /></button></div>{kind === "climate" && <div className="climate-grid home-climate-grid-v4">{rooms.map((room) => { const climate = room.controllableIds.find((id) => domainOf(id) === "climate"); return climate ? <ClimateControl key={room.area.area_id} hass={hass} entityId={climate} language={language} variant="full" /> : <article className="climate-empty-card" key={room.area.area_id}><span className="climate-empty-icon"><ThermometerIcon /></span><div><strong>{room.area.name}</strong><small>{copy.noThermostat}</small></div><b>{typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}</b></article>; })}</div>}{kind === "routines" && <div className="routine-list"><RoutineRow icon={<MoonIcon />} title={copy.goodNight} onClick={() => void onRunScene("night")} /><RoutineRow icon={<UsersIcon />} title={copy.guestMode} onClick={() => void onRunScene("guest")} /><RoutineRow icon={<MediaIcon />} title={copy.movieNight} onClick={() => void onRunScene("movie")} /><button className="routine-all-off" onClick={onAllOff}><PowerIcon />{copy.turnOffAll}</button></div>}{kind !== "climate" && kind !== "routines" && <GenericFeaturePanel hass={hass} kind={kind} language={language} />}</section></div>;
}

function GenericFeaturePanel({ hass, kind, language }: { hass: Hass; kind: Exclude<Overlay, null | "climate" | "routines">; language: Language }) {
  const domainMap: Partial<Record<typeof kind, string[]>> = { sensors: ["sensor", "binary_sensor"], cameras: ["camera"], media: ["media_player"], vacuum: ["vacuum"], cover: ["cover"] };
  const domains = domainMap[kind] ?? [];
  const items = Object.values(hass.states).filter((state) => domains.includes(domainOf(state.entity_id))).slice(0, 12);
  if (!items.length) return <div className="feature-empty">{language === "it" ? "Nessun elemento disponibile" : "No items available"}</div>;
  return <div className="home-generic-grid-v4">{items.map((state) => <article key={state.entity_id}><span>{iconForEntity(hass, state.entity_id)}</span><div><strong>{displayName(hass, state.entity_id)}</strong><small>{entityStatus(hass, state.entity_id, language)}</small></div></article>)}</div>;
}

function ToolButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick}>{icon}<span>{label}</span></button>; }
function RoutineRow({ icon, title, onClick }: { icon: ReactNode; title: string; onClick: () => void }) { return <button className="routine-row" onClick={onClick}><span>{icon}</span><div><strong>{title}</strong></div><ChevronIcon /></button>; }

function isPassive(hass: Hass, entityId: string) {
  const domain = domainOf(entityId);
  if (["sensor", "binary_sensor", "camera", "person", "device_tracker", "weather", "sun"].includes(domain)) return true;
  if (domain !== "media_player") return false;
  const state = hass.states[entityId];
  const deviceClass = String(state?.attributes.device_class ?? "").toLowerCase();
  const name = displayName(hass, entityId).toLowerCase();
  return deviceClass === "speaker" || name.includes("homepod");
}

function isActive(hass: Hass, entityId: string) { return ACTIVE_STATES.has(hass.states[entityId]?.state ?? ""); }
function domainOf(entityId: string) { return entityId.split(".")[0]; }
function locale(language: Language) { return language === "it" ? "it-IT" : "en-GB"; }
function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function shortName(name: string, roomName: string) { const cleaned = name.replace(new RegExp(roomName, "ig"), "").replace(/^[\s_-]+|[\s_-]+$/g, ""); return cleaned || name; }

function isRoomTemperatureSensor(hass: Hass, entityId: string) {
  if (domainOf(entityId) !== "sensor") return false;
  const state = hass.states[entityId];
  const deviceClass = String(state?.attributes.device_class ?? "").toLowerCase();
  const unit = String(state?.attributes.unit_of_measurement ?? "").toLowerCase();
  return deviceClass === "temperature" || unit === "°c" || unit === "°f";
}

function climateTargetLabel(hass: Hass, entityId: string, language: Language) {
  const attributes = hass.states[entityId]?.attributes ?? {};
  const format = (value: number) => value.toLocaleString(locale(language), { minimumFractionDigits: value % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 });
  const target = Number(attributes.temperature);
  if (Number.isFinite(target)) return `${format(target)}°`;
  const low = Number(attributes.target_temp_low);
  const high = Number(attributes.target_temp_high);
  if (Number.isFinite(low) && Number.isFinite(high)) return `${format(low)}–${format(high)}°`;
  return language === "it" ? "Attivo" : "Active";
}

function findTemperature(hass: Hass, ids: string[]) {
  const state = ids.map((id) => hass.states[id]).find((item) => item?.attributes.device_class === "temperature" || item?.attributes.unit_of_measurement === "°C");
  const value = Number(state?.state);
  return Number.isFinite(value) ? value : undefined;
}

function entityStatus(hass: Hass, entityId: string, language: Language) {
  const state = hass.states[entityId];
  if (!state) return "—";
  const unit = String(state.attributes.unit_of_measurement ?? "");
  if (unit && Number.isFinite(Number(state.state))) return `${state.state}${unit}`;
  const deviceClass = String(state.attributes.device_class ?? "");
  if (domainOf(entityId) === "binary_sensor") {
    const on = state.state === "on";
    if (["motion", "occupancy", "presence"].includes(deviceClass)) return language === "it" ? (on ? "Presenza rilevata" : "Nessuna presenza") : (on ? "Presence detected" : "No presence");
    if (["door", "window", "opening"].includes(deviceClass)) return language === "it" ? (on ? "Aperto" : "Chiuso") : (on ? "Open" : "Closed");
  }
  if (domainOf(entityId) === "cover") return `${Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0))}%`;
  if (domainOf(entityId) === "light") return state.state === "on" ? `${Math.round((Number(state.attributes.brightness ?? 255) / 255) * 100)}%` : (language === "it" ? "Spenta" : "Off");
  const mapIt: Record<string, string> = { on: "Acceso", off: "Spento", open: "Aperto", closed: "Chiuso", playing: "In riproduzione", paused: "In pausa", heat: "Riscaldamento", cool: "Raffrescamento", unavailable: "Non disponibile" };
  return language === "it" ? (mapIt[state.state] ?? state.state) : state.state.replaceAll("_", " ");
}

function roomIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes("open") || key.includes("salotto") || key.includes("soggiorno")) return <OpenSpaceIcon />;
  if (key.includes("disimpegno") || key.includes("corridoio") || key.includes("hall")) return <HallIcon />;
  if (key.includes("bagno")) return <BathIcon />;
  if (key.includes("cameretta")) return <KidsRoomIcon />;
  if (key.includes("camera")) return <BedIcon />;
  if (key.includes("esterno") || key.includes("patio") || key.includes("giardino")) return <PatioIcon />;
  return <RoomIcon />;
}

function iconForEntity(hass: Hass, entityId: string) {
  const domain = domainOf(entityId);
  const deviceClass = String(hass.states[entityId]?.attributes.device_class ?? "");
  if (domain === "sensor" && deviceClass === "temperature") return <ThermometerIcon />;
  if (domain === "sensor" && deviceClass === "humidity") return <DropIcon />;
  if (domain === "binary_sensor" && ["motion", "occupancy", "presence"].includes(deviceClass)) return <RadarIcon />;
  if (domain === "binary_sensor" && ["door", "window", "opening"].includes(deviceClass)) return <DoorIcon />;
  if (domain === "camera") return <CameraIcon />;
  return iconForDomain(domain);
}

function iconForDomain(domain: string) {
  if (domain === "light") return <BulbIcon />;
  if (domain === "cover") return <CoverIcon />;
  if (domain === "climate") return <ClimateIcon />;
  if (domain === "switch") return <PowerIcon />;
  if (domain === "media_player") return <MediaIcon />;
  if (domain === "vacuum") return <VacuumIcon />;
  if (domain === "lock") return <LockIcon />;
  return <PowerIcon />;
}

function greetingForHour(hour: number, copy: typeof itCopy) { return hour < 12 ? copy.goodMorning : hour < 18 ? copy.goodAfternoon : copy.goodEvening; }
function overlayTitle(kind: Exclude<Overlay, null>, copy: typeof itCopy) { const labels: Record<Exclude<Overlay, null>, string> = { routines: copy.routines, batteries: copy.batteries, climate: copy.climate, sensors: copy.sensors, cameras: copy.cameras, media: copy.media, vacuum: copy.vacuum, car: copy.car, cover: copy.covers }; return labels[kind]; }

const itCopy = { goodMorning: "Buongiorno", goodAfternoon: "Buon pomeriggio", goodEvening: "Buonasera", sunny: "Sereno", armed: "Inserito", disarmed: "Disinserito", notifications: "Notifiche", houseSays: "La casa dice", allClear: "Tutto tranquillo", allClearDetail: "Nessuna anomalia rilevata", alarm: "Allarme", homeFree: "Casa libera", manage: "Gestisci", climate: "Clima", inside: "Interno", outside: "Esterno", zones: "Zone", status: "Stato", active: "Attivo", idle: "Inattivo", waste: "Rifiuti", today: "Oggi", residual: "Indifferenziato", collectionReady: "Raccolta pronta", routines: "Routine", batteries: "Batterie", sensors: "Sensori", cameras: "Telecamere", media: "Media", vacuum: "Aspirapolvere", car: "Auto", covers: "Tapparelle", roomControls: "Controlli stanza", turnOffAll: "Spegni tutto", close: "Chiudi", home: "Casa", noThermostat: "Nessun termostato", goodNight: "Buonanotte", guestMode: "Modalità ospiti", movieNight: "Serata film" };
const enCopy: typeof itCopy = { goodMorning: "Good morning", goodAfternoon: "Good afternoon", goodEvening: "Good evening", sunny: "Sunny", armed: "Armed", disarmed: "Disarmed", notifications: "Notifications", houseSays: "Home says", allClear: "All clear", allClearDetail: "No issues detected", alarm: "Alarm", homeFree: "Home clear", manage: "Manage", climate: "Climate", inside: "Inside", outside: "Outside", zones: "Zones", status: "Status", active: "Active", idle: "Idle", waste: "Waste", today: "Today", residual: "Residual", collectionReady: "Collection ready", routines: "Routines", batteries: "Batteries", sensors: "Sensors", cameras: "Cameras", media: "Media", vacuum: "Vacuum", car: "Car", covers: "Covers", roomControls: "Room controls", turnOffAll: "Turn off all", close: "Close", home: "Home", noThermostat: "No thermostat", goodNight: "Good night", guestMode: "Guest mode", movieNight: "Movie night" };

function Icon({ children }: { children: ReactNode }) { return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>; }
function StrokeIcon({ children }: { children: ReactNode }) { return <Icon><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</g></Icon>; }
function SunIcon() { return <StrokeIcon><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></StrokeIcon>; }
function ShieldIcon() { return <StrokeIcon><path d="M12 3.2 18.7 6v5c0 4.8-2.6 7.9-6.7 9.8C7.9 18.9 5.3 15.8 5.3 11V6Z"/><path d="m9.2 12 1.7 1.7 3.9-3.9"/></StrokeIcon>; }
function BellIcon() { return <StrokeIcon><path d="M6.7 16.8h10.6l-1.4-2V10a3.9 3.9 0 0 0-7.8 0v4.8Z"/><path d="M10.2 19h3.6"/></StrokeIcon>; }
function CheckIcon() { return <StrokeIcon><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></StrokeIcon>; }
function ThermometerIcon() { return <StrokeIcon><path d="M10 14.5V5.8a2 2 0 1 1 4 0v8.7a4 4 0 1 1-4 0Z"/><path d="M12 8v8"/></StrokeIcon>; }
function RecycleIcon() { return <StrokeIcon><path d="m9 4 2-2 2 2M11 2l2.5 4.4M18.5 10l2.5.5-.5 2.5M21 10.5l-2.7 4.5M7 19l-2.5-.5.5-2.5M4.5 18.5 7 14"/></StrokeIcon>; }
function TrashBinIcon() { return <StrokeIcon><path d="M7 8h10l-.7 11H7.7L7 8ZM9 5h6M10 11v5M14 11v5"/></StrokeIcon>; }
function SparklesIcon() { return <StrokeIcon><path d="m12 2 1.3 3.7L17 7l-3.7 1.3L12 12l-1.3-3.7L7 7l3.7-1.3ZM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8Z"/></StrokeIcon>; }
function BatteryIcon() { return <StrokeIcon><rect x="4" y="7" width="15" height="10" rx="2"/><path d="M19 10h2v4h-2M7 10h6v4H7z"/></StrokeIcon>; }
function RadarIcon() { return <StrokeIcon><circle cx="12" cy="12" r="2"/><path d="M7.1 16.9a7 7 0 0 1 0-9.8M16.9 7.1a7 7 0 0 1 0 9.8M4.2 19.8a11 11 0 0 1 0-15.6M19.8 4.2a11 11 0 0 1 0 15.6"/></StrokeIcon>; }
function ClimateIcon() { return <StrokeIcon><path d="M12 3v18M5 7l14 10M19 7 5 17"/></StrokeIcon>; }
function CameraIcon() { return <StrokeIcon><rect x="3" y="7" width="18" height="12" rx="3"/><circle cx="12" cy="13" r="3"/><path d="m7 7 1.5-2h7L17 7"/></StrokeIcon>; }
function MediaIcon() { return <StrokeIcon><rect x="4" y="5" width="16" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/></StrokeIcon>; }
function VacuumIcon() { return <StrokeIcon><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 4v3M6 17l2-2"/></StrokeIcon>; }
function CarIcon() { return <StrokeIcon><path d="m5 15 1-5h12l1 5M7 10l1.5-3h7L17 10M5 15v3h2v-2h10v2h2v-3Z"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></StrokeIcon>; }
function CoverIcon() { return <StrokeIcon><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M7.5 7h9M7.5 10h9M7.5 13h9M7.5 16h9"/></StrokeIcon>; }
function BulbIcon() { return <StrokeIcon><path d="M8.2 9.5a3.8 3.8 0 1 1 7.6 0c0 2-1.3 2.8-2 4H10c-.5-1.2-1.8-2-1.8-4Z"/><path d="M10 16h4M10.8 19h2.4"/></StrokeIcon>; }
function PowerIcon() { return <StrokeIcon><path d="M12 3v8M7.1 6.6A7 7 0 1 0 17 6.6"/></StrokeIcon>; }
function LockIcon() { return <StrokeIcon><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></StrokeIcon>; }
function StarIcon() { return <StrokeIcon><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></StrokeIcon>; }
function ChevronIcon() { return <StrokeIcon><path d="m9 6 6 6-6 6"/></StrokeIcon>; }
function CloseIcon() { return <StrokeIcon><path d="m7 7 10 10M17 7 7 17"/></StrokeIcon>; }
function MoonIcon() { return <StrokeIcon><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5Z"/></StrokeIcon>; }
function UsersIcon() { return <StrokeIcon><circle cx="9" cy="9" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M3.5 19c.5-3 2.3-5 5.5-5s5 2 5.5 5M14 15c2.7.1 4.3 1.5 4.8 4"/></StrokeIcon>; }
function DropIcon() { return <StrokeIcon><path d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10Z"/></StrokeIcon>; }
function DoorIcon() { return <StrokeIcon><path d="M7 21V4l10-1v18M7 21h12M14 12h.01"/></StrokeIcon>; }
function RoomIcon() { return <StrokeIcon><path d="m4 11 8-7 8 7v9H4Z"/></StrokeIcon>; }
function OpenSpaceIcon() { return <StrokeIcon><path d="M4 15v-3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M5 15h14v5H5zM7 10V7h4v3M13 10V6h4v4"/></StrokeIcon>; }
function HallIcon() { return <StrokeIcon><path d="M5 20V4h14v16M9 20V8h6v12M12 13h.01"/></StrokeIcon>; }
function BathIcon() { return <StrokeIcon><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3ZM7 12V7a3 3 0 0 1 6 0M6 20v1M18 20v1"/></StrokeIcon>; }
function KidsRoomIcon() { return <StrokeIcon><circle cx="12" cy="12" r="5"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="7" r="2"/><path d="M9.5 12h.01M14.5 12h.01M10 15h4"/></StrokeIcon>; }
function BedIcon() { return <StrokeIcon><path d="M4 19v-8M20 19v-6a2 2 0 0 0-2-2H9a3 3 0 0 0-3 3v2h14M6 11V7h5a2 2 0 0 1 2 2v2"/></StrokeIcon>; }
function PatioIcon() { return <StrokeIcon><path d="M12 3v3M5.6 5.6l2.1 2.1M18.4 5.6l-2.1 2.1M3 12h3M18 12h3M8 13a4 4 0 0 1 8 0M4 18h16M7 18v3M17 18v3"/></StrokeIcon>; }
