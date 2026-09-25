import { createPortal } from "react-dom";
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
const ROOM_ACCENTS = ["#4f8cff", "#34c759", "#30b0c7", "#ff9f0a", "#8e7dff", "#ff6482", "#32ade6"];
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
  const [desktopRoomId, setDesktopRoomId] = useState<string | null>(null);
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
  const desktopRoom = rooms.find((room) => room.area.area_id === desktopRoomId) ?? rooms[0] ?? null;
  const desktopRoomIndex = Math.max(0, rooms.findIndex((room) => room.area.area_id === desktopRoom?.area.area_id));
  const desktopRoomAccent = ROOM_ACCENTS[desktopRoomIndex % ROOM_ACCENTS.length];
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
      <LargeHomeV70
        hass={hass}
        rooms={rooms}
        language={language}
        copy={copy}
        knownTemperatures={knownTemperatures}
        outside={outside}
        climateIds={climateIds}
        onClimate={(entityId) => setRoomClimateEntityId(entityId)}
        onAlarm={() => openHeaderAction("alarm")}
        onOverlay={setOverlay}
      />

      <LargeHomeWorkspaceV60
        hass={hass}
        rooms={rooms}
        selectedRoom={desktopRoom}
        selectedRoomAccent={desktopRoomAccent}
        favorites={favorites}
        language={language}
        copy={copy}
        knownTemperatures={knownTemperatures}
        outside={outside}
        climateIds={climateIds}
        onSelectRoom={setDesktopRoomId}
        onToggleFavorite={toggleFavorite}
        onClimate={(entityId) => setRoomClimateEntityId(entityId)}
        onAlarm={() => openHeaderAction("alarm")}
        onOverlay={setOverlay}
        onTurnOffRoom={(room) => void deactivateEntities(hass, room.controllableIds)}
      />

      <div className="reel-dashboard phone-home-layout-v60">
        <div className="desktop-room-workspace-v26">
          <div
            className="desktop-room-strip-v26"
            role="tablist"
            aria-label={language === "it" ? "Seleziona stanza" : "Select room"}
          >
            {rooms.map((room) => {
              const activeCount = room.controllableIds.filter((id) => isActive(hass, id)).length;
              const isSelected = desktopRoom?.area.area_id === room.area.area_id;
              return (
                <button
                  key={room.area.area_id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={isSelected ? "active" : ""}
                  onClick={() => setDesktopRoomId(room.area.area_id)}
                >
                  <span className="desktop-room-tab-icon-v26">{roomIcon(room.area.name)}</span>
                  <span className="desktop-room-tab-copy-v26">
                    <strong>{room.area.name}</strong>
                    <small>{activeCount > 0 ? `${activeCount} ${language === "it" ? "attivi" : "active"}` : (language === "it" ? "Tutto spento" : "All off")}</small>
                  </span>
                  <b>{typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}</b>
                </button>
              );
            })}
          </div>

          <div className="desktop-room-stage-v26">
            {desktopRoom && (
              <DesktopRoomPanel
                key={`desktop-${desktopRoom.area.area_id}`}
                hass={hass}
                room={desktopRoom}
                language={language}
                accent={desktopRoomAccent}
                onClimate={(entityId) => setRoomClimateEntityId(entityId)}
              />
            )}
          </div>
        </div>

        <div className="reel-room-grid mobile-room-grid-v26">
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



function LargeHomeV70({
  hass,
  rooms,
  language,
  copy,
  knownTemperatures,
  outside,
  climateIds,
  onClimate,
  onAlarm,
  onOverlay,
}: {
  hass: Hass;
  rooms: RoomModel[];
  language: Language;
  copy: typeof itCopy;
  knownTemperatures: number[];
  outside: number;
  climateIds: string[];
  onClimate: (entityId: string) => void;
  onAlarm: () => void;
  onOverlay: (kind: Overlay) => void;
}) {
  const inside = average(knownTemperatures.length ? knownTemperatures : [22]);
  const climateActive = climateIds.some((id) => isActive(hass, id));
  const climateProgress = Math.min(100, Math.max(0, ((inside - 16) / 14) * 100));

  return (
    <div className="home-large-v70">
      <main className="h70-rooms" aria-label={language === "it" ? "Stanze" : "Rooms"}>
        {rooms.map((room, index) => (
          <LargeRoomCardV70
            key={`h70-${room.area.area_id}`}
            hass={hass}
            room={room}
            language={language}
            accent={ROOM_ACCENTS[index % ROOM_ACCENTS.length]}
            orphan={rooms.length % 2 === 1 && index === rooms.length - 1}
            onClimate={onClimate}
          />
        ))}
      </main>

      <aside className="h70-side" aria-label={language === "it" ? "Stato casa" : "Home status"}>
        <section className="h70-side-card h70-summary">
          <span className="h70-kicker">{copy.houseSays}</span>
          <div className="h70-summary-main"><span><CheckIcon /></span><div><strong>{copy.allClear}</strong><small>{copy.allClearDetail}</small></div></div>
        </section>

        <button type="button" className="h70-side-card h70-alarm" onClick={onAlarm}>
          <span className="h70-side-icon"><ShieldIcon /></span>
          <span className="h70-side-copy"><small>{copy.alarm}</small><strong>{copy.disarmed}</strong><b>{copy.homeFree}</b></span>
          <i>{copy.manage}</i>
        </button>

        <button type="button" className="h70-side-card h70-climate" onClick={() => onOverlay("climate")}>
          <div className="h70-side-heading"><span><ThermometerIcon />{copy.climate}</span><b>{copy.manage}</b></div>
          <div className="h70-climate-body">
            <div className="h70-climate-ring" style={{ "--h70-climate-progress": `${climateProgress}%` } as CSSProperties}>
              <div><strong>{inside.toFixed(1)}°</strong><small>{copy.inside}</small></div>
            </div>
            <div className="h70-climate-stats">
              <span><small>{copy.outside}</small><strong>{outside.toFixed(1)}°</strong></span>
              <span><small>{copy.zones}</small><strong>{climateIds.length}</strong></span>
              <span><small>{copy.status}</small><strong>{climateActive ? copy.active : copy.idle}</strong></span>
            </div>
          </div>
        </button>

        <section className="h70-side-card h70-waste">
          <div className="h70-side-heading"><span><RecycleIcon />{copy.waste}</span><b>{copy.today}</b></div>
          <div className="h70-waste-main"><span className="h70-side-icon"><TrashBinIcon /></span><div><strong>{copy.residual}</strong><small>{copy.collectionReady}</small></div></div>
        </section>

        <div className="h70-tools" aria-label={language === "it" ? "Strumenti casa" : "Home tools"}>
          <H70ToolButton icon={<SparklesIcon />} label={copy.routines} onClick={() => onOverlay("routines")} />
          <H70ToolButton icon={<BatteryIcon />} label={copy.batteries} onClick={() => onOverlay("batteries")} />
          <H70ToolButton icon={<RadarIcon />} label={copy.sensors} onClick={() => onOverlay("sensors")} />
          <H70ToolButton icon={<ClimateIcon />} label={copy.climate} onClick={() => onOverlay("climate")} />
          <H70ToolButton icon={<CameraIcon />} label={copy.cameras} onClick={() => onOverlay("cameras")} />
          <H70ToolButton icon={<MediaIcon />} label={copy.media} onClick={() => onOverlay("media")} />
          <H70ToolButton icon={<VacuumIcon />} label={copy.vacuum} onClick={() => onOverlay("vacuum")} />
          <H70ToolButton icon={<CarIcon />} label={copy.car} onClick={() => onOverlay("car")} />
          <H70ToolButton icon={<CoverIcon />} label={copy.covers} onClick={() => onOverlay("cover")} />
        </div>
      </aside>
    </div>
  );
}

function H70ToolButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" className="h70-tool" aria-label={label} title={label} onClick={onClick}>
      <span className="h70-tool-icon" aria-hidden="true">{icon}</span>
      <span className="h70-tool-label">{label}</span>
    </button>
  );
}

function LargeRoomCardV70({
  hass,
  room,
  language,
  accent,
  orphan,
  onClimate,
}: {
  hass: Hass;
  room: RoomModel;
  language: Language;
  accent: string;
  orphan: boolean;
  onClimate: (entityId: string) => void;
}) {
  const visibleControlIds = room.controllableIds.filter((id) => domainOf(id) !== "climate");
  const editableIds = visibleControlIds.filter((id) => ["light", "cover"].includes(domainOf(id)));
  const climateId = room.controllableIds.find((id) => domainOf(id) === "climate");
  const climateActive = Boolean(climateId && isActive(hass, climateId));
  const passiveIds = room.passiveIds.filter((id) => !isRoomTemperatureSensor(hass, id));
  const activeCount = visibleControlIds.filter((id) => isActive(hass, id)).length;
  const [selectedControl, setSelectedControl] = useState<string | null>(() => editableIds[0] ?? null);
  const [lightMode, setLightMode] = useState<LightControlMode>("brightness");
  const selectedState = selectedControl ? hass.states[selectedControl] : undefined;
  const selectedDomain = selectedControl ? domainOf(selectedControl) : null;

  useEffect(() => {
    if (selectedControl && editableIds.includes(selectedControl)) return;
    setSelectedControl(editableIds[0] ?? null);
  }, [room.area.area_id, editableIds.join("|"), selectedControl]);

  const runEntity = (entityId: string) => {
    const domain = domainOf(entityId);
    if (domain === "light" || domain === "cover") {
      setSelectedControl(entityId);
      return;
    }
    void activateEntity(hass, entityId);
  };

  return (
    <article className={`h70-room ${orphan ? "h70-room-orphan" : ""}`} style={{ "--h70-accent": accent } as CSSProperties}>
      <header className="h70-room-head">
        <div className="h70-room-title">
          <span className="h70-room-icon">{roomIcon(room.area.name)}</span>
          <div><small>{language === "it" ? "Stanza" : "Room"}</small><strong>{room.area.name}</strong><b>{activeCount > 0 ? `${activeCount} ${language === "it" ? "attivi" : "active"}` : (language === "it" ? "Tutto spento" : "All off")}</b></div>
        </div>
        <button
          type="button"
          className="h70-room-temperature"
          disabled={!climateId}
          onClick={() => { if (climateId) onClimate(climateId); }}
          aria-label={climateId ? `${language === "it" ? "Apri clima" : "Open climate"} ${room.area.name}` : undefined}
        >
          {typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}
        </button>
      </header>

      <section className="h70-section">
        <div className="h70-section-head"><span>{language === "it" ? "Controlli" : "Controls"}</span><b>{visibleControlIds.length}</b></div>
        <div className="h70-device-grid">
          {visibleControlIds.map((id) => (
            <LargeRoomDeviceV70
              key={id}
              hass={hass}
              entityId={id}
              language={language}
              selected={selectedControl === id}
              onClick={() => runEntity(id)}
            />
          ))}
          {!visibleControlIds.length && <small className="h70-empty">{language === "it" ? "Nessun dispositivo controllabile" : "No controllable devices"}</small>}
        </div>
      </section>

      {selectedState && (selectedDomain === "light" || selectedDomain === "cover") && (
        <LargeQuickControlV70
          hass={hass}
          entityId={selectedControl!}
          language={language}
          lightMode={lightMode}
          onLightMode={setLightMode}
        />
      )}

      <section className="h70-section h70-status-section">
        <div className="h70-section-head"><span>{language === "it" ? "Sensori e stato" : "Sensors & status"}</span><b>{passiveIds.length + (climateActive ? 1 : 0)}</b></div>
        <div className="h70-status-grid">
          {passiveIds.map((id) => (
            <div className="h70-status-item" key={id}>
              <span>{iconForEntity(hass, id)}</span>
              <div><strong>{shortName(displayName(hass, id), room.area.name)}</strong><small>{entityStatus(hass, id, language)}</small></div>
            </div>
          ))}
          {climateActive && climateId && (
            <div className="h70-status-item h70-climate-status">
              <span><ClimateIcon /></span>
              <div><strong>{language === "it" ? "Clima acceso" : "Climate on"}</strong><small>{climateTargetLabel(hass, climateId, language)}</small></div>
            </div>
          )}
          {!passiveIds.length && !climateActive && <small className="h70-empty">{language === "it" ? "Nessun sensore" : "No sensors"}</small>}
        </div>
      </section>
    </article>
  );
}

function LargeRoomDeviceV70({
  hass,
  entityId,
  language,
  selected,
  onClick,
}: {
  hass: Hass;
  entityId: string;
  language: Language;
  selected: boolean;
  onClick: () => void;
}) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const active = isActive(hass, entityId);
  const unavailable = ["unavailable", "unknown"].includes(state?.state ?? "unknown");
  const lightIsOn = domain === "light" && state?.state === "on";

  return (
    <button
      type="button"
      className={`h70-device domain-${domain} ${active ? "active" : ""} ${selected ? "selected" : ""}`}
      disabled={unavailable}
      onClick={(event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (domain === "light" && target?.closest(".h70-device-power")) {
          event.preventDefault();
          event.stopPropagation();
          void hass.callService("light", lightIsOn ? "turn_off" : "turn_on", { entity_id: entityId });
          return;
        }
        onClick();
      }}
    >
      <span className="h70-device-icon">{iconForEntity(hass, entityId)}</span>
      <span className="h70-device-copy"><strong>{displayName(hass, entityId)}</strong><small>{unavailable ? (language === "it" ? "Non disponibile" : "Unavailable") : entityStatus(hass, entityId, language)}</small></span>
      {domain === "light" && <span className={`h70-device-power ${lightIsOn ? "active" : ""}`} aria-hidden="true"><PowerIcon /></span>}
    </button>
  );
}

function LargeQuickControlV70({
  hass,
  entityId,
  language,
  lightMode,
  onLightMode,
}: {
  hass: Hass;
  entityId: string;
  language: Language;
  lightMode: LightControlMode;
  onLightMode: (mode: LightControlMode) => void;
}) {
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
    <section className={`h70-quick domain-${domain}`}>
      <div className="h70-quick-head">
        <div><small>{displayName(hass, entityId)}</small><strong>{label}<b>{formatted}</b></strong></div>
        {domain === "light" && (
          <div className="h70-mode-switch">
            <button type="button" className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")} aria-label={language === "it" ? "Luminosità" : "Brightness"}><SunIcon /></button>
            <button type="button" className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")} aria-label={language === "it" ? "Temperatura bianco" : "White temperature"}><ThermometerIcon /></button>
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
    </section>
  );
}

function LargeHomeWorkspaceV60({
  hass,
  rooms,
  selectedRoom,
  selectedRoomAccent,
  favorites,
  language,
  copy,
  knownTemperatures,
  outside,
  climateIds,
  onSelectRoom,
  onToggleFavorite,
  onClimate,
  onAlarm,
  onOverlay,
  onTurnOffRoom,
}: {
  hass: Hass;
  rooms: RoomModel[];
  selectedRoom: RoomModel | null;
  selectedRoomAccent: string;
  favorites: string[];
  language: Language;
  copy: typeof itCopy;
  knownTemperatures: number[];
  outside: number;
  climateIds: string[];
  onSelectRoom: (roomId: string) => void;
  onToggleFavorite: (entityId: string) => void | Promise<void>;
  onClimate: (entityId: string) => void;
  onAlarm: () => void;
  onOverlay: (kind: Overlay) => void;
  onTurnOffRoom: (room: RoomModel) => void;
}) {
  const inside = average(knownTemperatures.length ? knownTemperatures : [22]);
  const climateActive = climateIds.some((id) => isActive(hass, id));

  return (
    <div className="v60-home-workspace">
      <nav className="v60-home-room-strip" aria-label={language === "it" ? "Stanze" : "Rooms"}>
        <div className="v60-home-room-strip-title">
          <span>{language === "it" ? "Casa" : "Home"}</span>
          <strong>{language === "it" ? "Stanze" : "Rooms"}</strong>
        </div>
        <div className="v60-home-room-scroll" role="tablist" aria-label={language === "it" ? "Seleziona stanza" : "Select room"}>
          {rooms.map((room, index) => {
            const activeCount = room.controllableIds.filter((id) => isActive(hass, id)).length;
            const active = selectedRoom?.area.area_id === room.area.area_id;
            const accent = ROOM_ACCENTS[index % ROOM_ACCENTS.length];
            return (
              <button
                key={room.area.area_id}
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? "active" : ""}
                style={{ "--v60-room-accent": accent } as CSSProperties}
                onClick={() => onSelectRoom(room.area.area_id)}
              >
                <span className="v60-home-room-icon">{roomIcon(room.area.name)}</span>
                <span className="v60-home-room-copy">
                  <strong>{room.area.name}</strong>
                  <small>{activeCount > 0 ? `${activeCount} ${language === "it" ? "attivi" : "active"}` : (language === "it" ? "Tutto spento" : "All off")}</small>
                </span>
                <b>{typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}</b>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="v60-home-main">
        <div className="v60-home-room-console-wrap">
          {selectedRoom ? (
            <LargeRoomConsoleV60
              key={selectedRoom.area.area_id}
              hass={hass}
              room={selectedRoom}
              accent={selectedRoomAccent}
              favorites={favorites}
              language={language}
              onToggleFavorite={onToggleFavorite}
              onClimate={onClimate}
              onTurnOff={() => onTurnOffRoom(selectedRoom)}
            />
          ) : (
            <div className="v60-home-empty">{language === "it" ? "Nessuna stanza disponibile" : "No rooms available"}</div>
          )}
        </div>

        <aside className="v60-home-sidecar" aria-label={language === "it" ? "Stato casa" : "Home status"}>
          <section className="v60-home-summary">
            <span>{copy.houseSays}</span>
            <div><CheckIcon /><strong>{copy.allClear}</strong></div>
            <small>{copy.allClearDetail}</small>
          </section>

          <button type="button" className="v60-home-climate-summary" onClick={() => onOverlay("climate")}>
            <div className="v60-home-climate-head"><span><ThermometerIcon />{copy.climate}</span><b>{copy.manage}</b></div>
            <strong>{inside.toFixed(1)}°</strong>
            <div className="v60-home-climate-stats">
              <span><small>{copy.outside}</small><b>{outside.toFixed(1)}°</b></span>
              <span><small>{copy.zones}</small><b>{climateIds.length}</b></span>
              <span><small>{copy.status}</small><b>{climateActive ? copy.active : copy.idle}</b></span>
            </div>
          </button>

          <button type="button" className="v60-home-alarm-summary" onClick={onAlarm}>
            <span><ShieldIcon /></span>
            <div><small>{copy.alarm}</small><strong>{copy.disarmed}</strong><b>{copy.homeFree}</b></div>
            <i>{copy.manage}</i>
          </button>

          <section className="v60-home-waste-summary">
            <div><span><RecycleIcon />{copy.waste}</span><b>{copy.today}</b></div>
            <strong>{copy.residual}</strong>
            <small>{copy.collectionReady}</small>
          </section>
        </aside>
      </div>

      <div className="v60-home-tool-dock" aria-label={language === "it" ? "Strumenti casa" : "Home tools"}>
        <ToolButton icon={<SparklesIcon />} label={copy.routines} onClick={() => onOverlay("routines")} />
        <ToolButton icon={<BatteryIcon />} label={copy.batteries} onClick={() => onOverlay("batteries")} />
        <ToolButton icon={<RadarIcon />} label={copy.sensors} onClick={() => onOverlay("sensors")} />
        <ToolButton icon={<ClimateIcon />} label={copy.climate} onClick={() => onOverlay("climate")} />
        <ToolButton icon={<CameraIcon />} label={copy.cameras} onClick={() => onOverlay("cameras")} />
        <ToolButton icon={<MediaIcon />} label={copy.media} onClick={() => onOverlay("media")} />
        <ToolButton icon={<VacuumIcon />} label={copy.vacuum} onClick={() => onOverlay("vacuum")} />
        <ToolButton icon={<CarIcon />} label={copy.car} onClick={() => onOverlay("car")} />
        <ToolButton icon={<CoverIcon />} label={copy.covers} onClick={() => onOverlay("cover")} />
      </div>
    </div>
  );
}

function LargeRoomConsoleV60({
  hass,
  room,
  accent,
  favorites,
  language,
  onToggleFavorite,
  onClimate,
  onTurnOff,
}: {
  hass: Hass;
  room: RoomModel;
  accent: string;
  favorites: string[];
  language: Language;
  onToggleFavorite: (entityId: string) => void | Promise<void>;
  onClimate: (entityId: string) => void;
  onTurnOff: () => void;
}) {
  const visibleControlIds = room.controllableIds.filter((id) => domainOf(id) !== "climate");
  const editableIds = visibleControlIds.filter((id) => ["light", "cover"].includes(domainOf(id)));
  const climateId = room.controllableIds.find((id) => domainOf(id) === "climate");
  const climateActive = Boolean(climateId && isActive(hass, climateId));
  const passiveIds = room.passiveIds.filter((id) => !isRoomTemperatureSensor(hass, id));
  const [selectedControl, setSelectedControl] = useState<string | null>(() => editableIds[0] ?? null);
  const [lightMode, setLightMode] = useState<LightControlMode>("brightness");
  const activeCount = visibleControlIds.filter((id) => isActive(hass, id)).length;

  useEffect(() => {
    if (selectedControl && editableIds.includes(selectedControl)) return;
    setSelectedControl(editableIds[0] ?? null);
  }, [room.area.area_id, editableIds.join("|"), selectedControl]);

  const handleDevice = (entityId: string) => {
    const domain = domainOf(entityId);
    if (domain === "light" || domain === "cover") {
      setSelectedControl(entityId);
      return;
    }
    void activateEntity(hass, entityId);
  };

  return (
    <article className="v60-room-console" style={{ "--v60-room-accent": accent } as CSSProperties}>
      <header className="v60-room-console-head">
        <div className="v60-room-console-title">
          <span>{roomIcon(room.area.name)}</span>
          <div>
            <small>{language === "it" ? "Stanza" : "Room"}</small>
            <strong>{room.area.name}</strong>
            <b>{activeCount > 0 ? `${activeCount} ${language === "it" ? "dispositivi attivi" : "active devices"}` : (language === "it" ? "Tutto spento" : "All off")}</b>
          </div>
        </div>

        <div className="v60-room-console-actions">
          <button
            type="button"
            className="v60-room-temperature"
            disabled={!climateId}
            onClick={() => { if (climateId) onClimate(climateId); }}
            aria-label={climateId ? `${language === "it" ? "Apri clima" : "Open climate"} ${room.area.name}` : undefined}
          >
            <span>{language === "it" ? "Clima" : "Climate"}</span>
            <strong>{typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}</strong>
          </button>
          <button type="button" className="v60-room-off" onClick={onTurnOff} aria-label={language === "it" ? `Spegni ${room.area.name}` : `Turn off ${room.area.name}`}><PowerIcon /><span>{language === "it" ? "Spegni stanza" : "Room off"}</span></button>
        </div>
      </header>

      <div className="v60-room-console-body">
        <section className="v60-room-accessories">
          <header className="v60-room-section-head">
            <div><span>{language === "it" ? "Accessori" : "Accessories"}</span><strong>{visibleControlIds.length}</strong></div>
            <small>{language === "it" ? "Seleziona una luce o tapparella per i controlli rapidi" : "Select a light or cover for quick controls"}</small>
          </header>
          <div className="v60-room-device-grid">
            {visibleControlIds.map((id) => (
              <LargeRoomDeviceV60
                key={id}
                hass={hass}
                entityId={id}
                language={language}
                selected={selectedControl === id}
                favorite={favorites.includes(id)}
                onToggleFavorite={() => void onToggleFavorite(id)}
                onClick={() => handleDevice(id)}
              />
            ))}
            {!visibleControlIds.length && <div className="v60-room-inline-empty">{language === "it" ? "Nessun dispositivo controllabile" : "No controllable devices"}</div>}
          </div>
        </section>

        <aside className="v60-room-inspector">
          <div className="v60-room-inspector-control">
            {selectedControl && hass.states[selectedControl] ? (
              <LargeRoomQuickControlV60
                hass={hass}
                entityId={selectedControl}
                language={language}
                lightMode={lightMode}
                onLightMode={setLightMode}
              />
            ) : (
              <div className="v60-room-inspector-empty">
                <span>{roomIcon(room.area.name)}</span>
                <div><strong>{language === "it" ? "Nessun controllo selezionato" : "No control selected"}</strong><small>{language === "it" ? "Seleziona una luce o una tapparella." : "Select a light or cover."}</small></div>
              </div>
            )}
          </div>

          <div className="v60-room-status">
            <header className="v60-room-section-head">
              <div><span>{language === "it" ? "Stato stanza" : "Room status"}</span><strong>{passiveIds.length + (climateActive ? 1 : 0)}</strong></div>
            </header>
            <div className="v60-room-status-list">
              {passiveIds.map((id) => (
                <div className="v60-room-status-row" key={id}>
                  <span>{iconForEntity(hass, id)}</span>
                  <div><strong>{shortName(displayName(hass, id), room.area.name)}</strong><small>{entityStatus(hass, id, language)}</small></div>
                </div>
              ))}
              {climateActive && climateId && (
                <button type="button" className="v60-room-status-row climate" onClick={() => onClimate(climateId)}>
                  <span><ClimateIcon /></span>
                  <div><strong>{language === "it" ? "Clima attivo" : "Climate active"}</strong><small>{climateTargetLabel(hass, climateId, language)}</small></div>
                </button>
              )}
              {!passiveIds.length && !climateActive && <div className="v60-room-inline-empty">{language === "it" ? "Nessun sensore" : "No sensors"}</div>}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function LargeRoomDeviceV60({
  hass,
  entityId,
  language,
  selected,
  favorite,
  onToggleFavorite,
  onClick,
}: {
  hass: Hass;
  entityId: string;
  language: Language;
  selected: boolean;
  favorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
}) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const active = isActive(hass, entityId);
  const unavailable = ["unavailable", "unknown"].includes(state?.state ?? "unknown");
  const selectable = domain === "light" || domain === "cover";
  return (
    <article className={`v60-room-device domain-${domain} ${active ? "active" : ""} ${selected ? "selected" : ""} ${unavailable ? "unavailable" : ""}`}>
      <button type="button" className="v60-room-device-main" onClick={onClick} disabled={unavailable} aria-pressed={selectable ? selected : active}>
        <span className="v60-room-device-icon">{iconForEntity(hass, entityId)}</span>
        <span className="v60-room-device-copy"><strong>{displayName(hass, entityId)}</strong><small>{unavailable ? (language === "it" ? "Non disponibile" : "Unavailable") : entityStatus(hass, entityId, language)}</small></span>
      </button>

      <button type="button" className={`v60-room-device-favorite ${favorite ? "selected" : ""}`} onClick={onToggleFavorite} aria-label={favorite ? (language === "it" ? "Rimuovi dai preferiti" : "Remove from favorites") : (language === "it" ? "Aggiungi ai preferiti" : "Add to favorites")}><StarIcon /></button>

      {domain === "light" && (
        <button
          type="button"
          className={`v60-room-device-power ${active ? "active" : ""}`}
          disabled={unavailable}
          aria-label={language === "it" ? (active ? `Spegni ${displayName(hass, entityId)}` : `Accendi ${displayName(hass, entityId)}`) : (active ? `Turn off ${displayName(hass, entityId)}` : `Turn on ${displayName(hass, entityId)}`)}
          onClick={() => void hass.callService("light", active ? "turn_off" : "turn_on", { entity_id: entityId })}
        >
          <PowerIcon />
        </button>
      )}
    </article>
  );
}

function LargeRoomQuickControlV60({
  hass,
  entityId,
  language,
  lightMode,
  onLightMode,
}: {
  hass: Hass;
  entityId: string;
  language: Language;
  lightMode: LightControlMode;
  onLightMode: (mode: LightControlMode) => void;
}) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const temperature = domain === "light" ? getWhiteTemperature(state.attributes) : null;
  const brightness = Math.round((Number(state.attributes.brightness ?? 180) / 255) * 100);
  const coverPosition = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  const value = domain === "cover" ? coverPosition : lightMode === "brightness" ? brightness : temperature!.currentKelvin;
  const min = domain === "cover" ? 0 : lightMode === "brightness" ? 1 : temperature!.minKelvin;
  const max = domain === "cover" ? 100 : lightMode === "brightness" ? 100 : temperature!.maxKelvin;
  const step = domain === "light" && lightMode === "temperature" ? 50 : 1;
  const label = domain === "cover" ? (language === "it" ? "Posizione" : "Position") : lightMode === "brightness" ? (language === "it" ? "Luminosità" : "Brightness") : (language === "it" ? "Temperatura bianco" : "White temperature");
  const formatted = domain === "light" && lightMode === "temperature" ? `${Math.round(value)} K` : `${Math.round(value)}%`;

  return (
    <div className={`v60-room-quick-control domain-${domain}`}>
      <div className="v60-room-quick-title">
        <span>{iconForEntity(hass, entityId)}</span>
        <div><small>{language === "it" ? "Selezionato" : "Selected"}</small><strong>{displayName(hass, entityId)}</strong><b>{entityStatus(hass, entityId, language)}</b></div>
      </div>

      {domain === "light" && (
        <div className="v60-room-light-modes" role="tablist" aria-label={language === "it" ? "Modalità luce" : "Light mode"}>
          <button type="button" role="tab" aria-selected={lightMode === "brightness"} className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")}><SunIcon /><span>{language === "it" ? "Luminosità" : "Brightness"}</span></button>
          <button type="button" role="tab" aria-selected={lightMode === "temperature"} className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")}><ThermometerIcon /><span>{language === "it" ? "Temperatura" : "Temperature"}</span></button>
        </div>
      )}

      <label className="v60-room-range">
        <span><small>{label}</small><b>{formatted}</b></span>
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
      </label>
    </div>
  );
}

function DesktopRoomPanel({ hass, room, language, accent, onClimate }: { hass: Hass; room: RoomModel; language: Language; accent: string; onClimate: (entityId: string) => void }) {
  const visibleControlIds = room.controllableIds.filter((id) => domainOf(id) !== "climate");
  const editableIds = visibleControlIds.filter((id) => ["light", "cover"].includes(domainOf(id)));
  const climateId = room.controllableIds.find((id) => domainOf(id) === "climate");
  const climateActive = Boolean(climateId && isActive(hass, climateId));
  const visiblePassiveIds = room.passiveIds.filter((id) => !isRoomTemperatureSensor(hass, id));
  const [selectedControl, setSelectedControl] = useState<string | null>(() => editableIds[0] ?? null);
  const [lightMode, setLightMode] = useState<LightControlMode>("brightness");
  const selectedState = selectedControl ? hass.states[selectedControl] : undefined;
  const selectedDomain = selectedControl ? domainOf(selectedControl) : null;
  const activeCount = visibleControlIds.filter((id) => isActive(hass, id)).length;

  useEffect(() => {
    if (selectedControl && editableIds.includes(selectedControl)) return;
    setSelectedControl(editableIds[0] ?? null);
  }, [room.area.area_id, editableIds.join("|"), selectedControl]);

  const runEntity = (entityId: string) => {
    const domain = domainOf(entityId);
    if (domain === "light" || domain === "cover") {
      setSelectedControl(entityId);
      return;
    }
    void activateEntity(hass, entityId);
  };

  return (
    <article className="desktop-room-panel-v32" style={{ "--desktop-room-accent": accent } as CSSProperties}>
      <header className="desktop-room-header-v32">
        <div className="desktop-room-title-v32">
          <span>{roomIcon(room.area.name)}</span>
          <div>
            <strong>{room.area.name}</strong>
            <small>{activeCount > 0 ? `${activeCount} ${language === "it" ? "attivi" : "active"}` : (language === "it" ? "Tutto spento" : "All off")}</small>
          </div>
        </div>
        <button
          type="button"
          className="desktop-room-temperature-v32"
          disabled={!climateId}
          onClick={() => { if (climateId) onClimate(climateId); }}
          aria-label={climateId ? `${language === "it" ? "Apri clima" : "Open climate"} ${room.area.name}` : undefined}
        >
          {typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}
        </button>
      </header>

      <div className="desktop-room-content-v32">
        <section className="desktop-room-controls-card-v32">
          <div className="desktop-room-section-head-v32">
            <div><span>{language === "it" ? "Controlli" : "Controls"}</span><small>{visibleControlIds.length} {language === "it" ? "dispositivi" : "devices"}</small></div>
          </div>

          <div className="desktop-room-controls-body-v32">
            <div className="desktop-room-accessory-grid-v32">
              {visibleControlIds.map((id) => (
                <DesktopRoomDeviceButton
                  key={id}
                  hass={hass}
                  entityId={id}
                  language={language}
                  selected={selectedControl === id}
                  onClick={() => runEntity(id)}
                />
              ))}
              {!visibleControlIds.length && <small className="desktop-room-empty-v32">{language === "it" ? "Nessun dispositivo controllabile" : "No controllable devices"}</small>}
            </div>

            {selectedState && (selectedDomain === "light" || selectedDomain === "cover") ? (
              <DesktopRoomQuickControl
                hass={hass}
                entityId={selectedControl!}
                language={language}
                lightMode={lightMode}
                onLightMode={setLightMode}
              />
            ) : (
              <div className="desktop-room-detail-empty-v32">
                <span>{roomIcon(room.area.name)}</span>
                <div><strong>{language === "it" ? "Seleziona un dispositivo" : "Select a device"}</strong><small>{language === "it" ? "Luci e tapparelle mostrano qui i controlli rapidi." : "Lights and covers show quick controls here."}</small></div>
              </div>
            )}
          </div>
        </section>

        <section className="desktop-room-status-card-v32">
          <div className="desktop-room-section-head-v32">
            <div><span>{language === "it" ? "Sensori e stato" : "Sensors & status"}</span><small>{visiblePassiveIds.length + (climateActive ? 1 : 0)} {language === "it" ? "elementi" : "items"}</small></div>
          </div>
          <div className="desktop-room-status-grid-v32">
            {visiblePassiveIds.map((id) => (
              <div className="desktop-room-status-row-v32" key={id}>
                <span className="desktop-room-status-icon-v32">{iconForEntity(hass, id)}</span>
                <div><strong>{shortName(displayName(hass, id), room.area.name)}</strong><small>{entityStatus(hass, id, language)}</small></div>
              </div>
            ))}
            {climateActive && climateId && (
              <div className="desktop-room-status-row-v32 climate-active">
                <span className="desktop-room-status-icon-v32"><ClimateIcon /></span>
                <div><strong>{language === "it" ? "Clima acceso" : "Climate on"}</strong><small>{climateTargetLabel(hass, climateId, language)}</small></div>
              </div>
            )}
            {!visiblePassiveIds.length && !climateActive && <small className="desktop-room-empty-v32">{language === "it" ? "Nessun sensore" : "No sensors"}</small>}
          </div>
        </section>
      </div>
    </article>
  );
}

function DesktopRoomDeviceButton({ hass, entityId, language, selected, onClick }: { hass: Hass; entityId: string; language: Language; selected: boolean; onClick: () => void }) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const active = isActive(hass, entityId);
  const selectable = domain === "light" || domain === "cover";
  const unavailable = ["unavailable", "unknown"].includes(state?.state ?? "unknown");
  const isLight = domain === "light";

  return (
    <div
      className={`desktop-room-device-v32 domain-${domain} ${active ? "active" : ""} ${selected ? "selected" : ""} ${unavailable ? "unavailable" : ""}`}
    >
      <button
        type="button"
        className="desktop-room-device-main-v40"
        onClick={onClick}
        disabled={unavailable}
        aria-pressed={selectable ? selected : active}
      >
        <span className="desktop-room-device-icon-v32">{iconForEntity(hass, entityId)}</span>
        <span className="desktop-room-device-copy-v32"><strong>{displayName(hass, entityId)}</strong><small>{unavailable ? (language === "it" ? "Non disponibile" : "Unavailable") : entityStatus(hass, entityId, language)}</small></span>
      </button>

      {isLight && (
        <button
          type="button"
          className={`desktop-room-device-power-v40 ${active ? "active" : ""}`}
          disabled={unavailable}
          aria-label={language === "it" ? (active ? `Spegni ${displayName(hass, entityId)}` : `Accendi ${displayName(hass, entityId)}`) : (active ? `Turn off ${displayName(hass, entityId)}` : `Turn on ${displayName(hass, entityId)}`)}
          title={language === "it" ? (active ? "Spegni" : "Accendi") : (active ? "Turn off" : "Turn on")}
          onClick={() => void hass.callService("light", active ? "turn_off" : "turn_on", { entity_id: entityId })}
        >
          <PowerIcon />
        </button>
      )}
    </div>
  );
}

function DesktopRoomQuickControl({ hass, entityId, language, lightMode, onLightMode }: { hass: Hass; entityId: string; language: Language; lightMode: LightControlMode; onLightMode: (mode: LightControlMode) => void }) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const temperature = domain === "light" ? getWhiteTemperature(state.attributes) : null;
  const brightness = Math.round((Number(state.attributes.brightness ?? 180) / 255) * 100);
  const coverPosition = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  const value = domain === "cover" ? coverPosition : lightMode === "brightness" ? brightness : temperature!.currentKelvin;
  const min = domain === "cover" ? 0 : lightMode === "brightness" ? 1 : temperature!.minKelvin;
  const max = domain === "cover" ? 100 : lightMode === "brightness" ? 100 : temperature!.maxKelvin;
  const step = domain === "light" && lightMode === "temperature" ? 50 : 1;
  const label = domain === "cover" ? (language === "it" ? "Posizione" : "Position") : lightMode === "brightness" ? (language === "it" ? "Luminosità" : "Brightness") : (language === "it" ? "Temperatura bianco" : "White temperature");
  const formatted = domain === "light" && lightMode === "temperature" ? `${Math.round(value)} K` : `${Math.round(value)}%`;

  return (
    <div className={`desktop-room-detail-v32 domain-${domain}`}>
      <div className="desktop-room-detail-head-v32">
        <div><small>{language === "it" ? "Selezionato" : "Selected"}</small><strong>{displayName(hass, entityId)}</strong><span>{entityStatus(hass, entityId, language)}</span></div>

      </div>

      {domain === "light" && (
        <div className={`desktop-room-mode-v32 ${lightMode === "temperature" ? "temperature-active" : "brightness-active"}`}>
          <button type="button" className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")}><SunIcon /><span>{language === "it" ? "Luminosità" : "Brightness"}</span></button>
          <button type="button" className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")}><ThermometerIcon /><span>{language === "it" ? "Temperatura" : "Temperature"}</span></button>
        </div>
      )}

      <div className="desktop-room-range-v32">
        <div><span>{label}</span><b>{formatted}</b></div>
        <input
          className={domain === "light" && lightMode === "temperature" ? "white-temperature-range" : ""}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (domain === "cover") void setCoverPosition(hass, entityId, next);
            else if (lightMode === "brightness") void setLightBrightness(hass, entityId, next);
            else void setLightColorTemperature(hass, entityId, next);
          }}
        />
      </div>
    </div>
  );
}

function RoomCard({ hass, room, language, onClimate }: { hass: Hass; room: RoomModel; language: Language; onClimate: (entityId: string) => void }) {
  const visibleControlIds = room.controllableIds.filter((id) => domainOf(id) !== "climate");
  const editableIds = visibleControlIds.filter((id) => ["light", "cover"].includes(domainOf(id)));
  const climateId = room.controllableIds.find((id) => domainOf(id) === "climate");
  const climateActive = Boolean(climateId && isActive(hass, climateId));
  const visiblePassiveIds = room.passiveIds.filter((id) => !isRoomTemperatureSensor(hass, id));
  const [selectedControl, setSelectedControl] = useState<string | null>(() => editableIds[0] ?? null);
  const [lightMode, setLightMode] = useState<LightControlMode>("brightness");
  const selectedState = selectedControl ? hass.states[selectedControl] : undefined;
  const selectedDomain = selectedControl ? domainOf(selectedControl) : null;

  useEffect(() => {
    if (selectedControl && editableIds.includes(selectedControl)) return;
    setSelectedControl(editableIds[0] ?? null);
  }, [room.area.area_id, editableIds.join("|"), selectedControl]);

  const runEntity = (entityId: string) => {
    const domain = domainOf(entityId);
    if (domain === "light" || domain === "cover") {
      setSelectedControl(entityId);
      return;
    }
    void activateEntity(hass, entityId);
  };

  return (
    <article className={`reel-room room-card-v4 ${climateActive ? "climate-active" : ""}`}>
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
          {visibleControlIds.map((id) => (
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
  const lightIsOn = domain === "light" && state?.state === "on";
  return (
    <button
      className={`room-device-button-v4 domain-${domain} ${active ? "active" : ""} ${selected ? "selected" : ""}`}
      onClick={(event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (domain === "light" && target?.closest(".room-device-power-v37")) {
          event.preventDefault();
          event.stopPropagation();
          void hass.callService("light", lightIsOn ? "turn_off" : "turn_on", { entity_id: entityId });
          return;
        }
        onClick();
      }}
      disabled={unavailable}
    >
      <span>{iconForEntity(hass, entityId)}</span>
      <div><strong>{displayName(hass, entityId)}</strong><small>{unavailable ? "Non disponibile" : entityStatus(hass, entityId, "it")}</small></div>
      {domain === "light" && (
        <span className={`room-device-power-v37 ${lightIsOn ? "active" : ""}`} aria-hidden="true"><PowerIcon /></span>
      )}
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
          <div className={`room-light-mode-v4 ${lightMode === "temperature" ? "temperature-active" : "brightness-active"}`}>
            <button type="button" className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")} aria-label={language === "it" ? "Luminosità" : "Brightness"}><SunIcon /></button>
            <button type="button" className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")} aria-label={language === "it" ? "Temperatura bianco" : "White temperature"}><ThermometerIcon /></button>
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
  const isNight = typeof document !== "undefined" && document.querySelector("main.app-shell")?.classList.contains("night");
  const isClimate = kind === "climate";

  const dialog = (
    <div
      id="family-shared-device-overlay"
      className={`app-shell home-page-active shared-device-controls-overlay ${isNight ? "night" : "day"}`}
      onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}
    >
      <section
        id="family-shared-device-controls"
        className={`device-controls device-controls-feature ${isClimate ? "device-controls-climate " : ""}feature-modal ${kind}-modal`}
        role="dialog"
        aria-modal="true"
        aria-label={overlayTitle(kind, copy)}
      >
        <div className="device-controls-heading">
          <div><span className="section-kicker">{copy.home}</span><strong>{overlayTitle(kind, copy)}</strong></div>
          <button onClick={onClose} aria-label={copy.close}><CloseIcon /></button>
        </div>

        {isClimate && (
          <div className="climate-grid home-climate-grid-v4">
            {rooms.map((room) => {
              const climate = room.controllableIds.find((id) => domainOf(id) === "climate");
              return climate
                ? <ClimateControl key={room.area.area_id} hass={hass} entityId={climate} language={language} variant="compact" showName />
                : <article className="climate-empty-card" key={room.area.area_id}><span className="climate-empty-icon"><ThermometerIcon /></span><div><strong>{room.area.name}</strong><small>{copy.noThermostat}</small></div><b>{typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}</b></article>;
            })}
          </div>
        )}

        {kind === "routines" && (
          <div className="routine-list">
            <RoutineRow icon={<MoonIcon />} title={copy.goodNight} onClick={() => void onRunScene("night")} />
            <RoutineRow icon={<UsersIcon />} title={copy.guestMode} onClick={() => void onRunScene("guest")} />
            <RoutineRow icon={<MediaIcon />} title={copy.movieNight} onClick={() => void onRunScene("movie")} />
            <button className="routine-all-off" onClick={onAllOff}><PowerIcon />{copy.turnOffAll}</button>
          </div>
        )}

        {!isClimate && kind !== "routines" && <GenericFeaturePanel hass={hass} kind={kind} language={language} />}
      </section>
    </div>
  );

  return typeof document === "undefined" ? dialog : createPortal(dialog, document.body);
}

function GenericFeaturePanel({ hass, kind, language }: { hass: Hass; kind: Exclude<Overlay, null | "climate" | "routines">; language: Language }) {
  const domainMap: Partial<Record<typeof kind, string[]>> = { sensors: ["sensor", "binary_sensor"], cameras: ["camera"], media: ["media_player"], vacuum: ["vacuum"], cover: ["cover"] };
  const domains = domainMap[kind] ?? [];
  const items = Object.values(hass.states).filter((state) => domains.includes(domainOf(state.entity_id))).slice(0, 12);
  if (!items.length) return <div className="feature-empty">{language === "it" ? "Nessun elemento disponibile" : "No items available"}</div>;
  return <div className="home-generic-grid-v4">{items.map((state) => <article key={state.entity_id}><span>{iconForEntity(hass, state.entity_id)}</span><div><strong>{displayName(hass, state.entity_id)}</strong><small>{entityStatus(hass, state.entity_id, language)}</small></div></article>)}</div>;
}

function ToolButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) { return <button type="button" aria-label={label} title={label} onClick={onClick}>{icon}<span>{label}</span></button>; }
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
  if (domain === "light") return <CalendarAccessoryBulbIcon />;
  if (domain === "cover") return <CalendarAccessoryCoverIcon />;
  if (domain === "climate") return <CalendarAccessoryClimateIcon />;
  if (domain === "sensor") {
    const deviceClass = String(hass.states[entityId]?.attributes.device_class ?? "");
    if (deviceClass === "temperature") return <CalendarAccessoryClimateIcon />;
    if (deviceClass === "humidity") return <CalendarAccessoryDropletIcon />;
    return <CalendarAccessorySensorIcon />;
  }
  if (domain === "binary_sensor") return <CalendarAccessoryPresenceIcon />;
  if (domain === "media_player") return <CalendarAccessorySpeakerIcon />;
  if (domain === "camera") return <CalendarAccessoryCameraIcon />;
  return <CalendarAccessoryPowerIcon />;
}

function CalendarAccessoryBulbIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.3 17.3h5.4M10.2 20h3.6M12 3.2a6.3 6.3 0 0 0-3.7 11.4c.7.5 1 1.3 1 2.2h5.4c0-.9.3-1.7 1-2.2A6.3 6.3 0 0 0 12 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CalendarAccessoryCoverIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="1.7" fill="none" stroke="currentColor" strokeWidth="1.55"/><path d="M5 9h14M8 12h8M8 15h8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function CalendarAccessoryClimateIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.4 14.8V5.6a2.4 2.4 0 0 0-4.8 0v9.2a4.4 4.4 0 1 0 4.8 0Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function CalendarAccessoryDropletIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.7c3.1 4.1 5.2 6.8 5.2 9.8a5.2 5.2 0 0 1-10.4 0c0-3 2.1-5.7 5.2-9.8Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/><path d="M9.5 14.2a2.8 2.8 0 0 0 2.7 2.1" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>;
}
function CalendarAccessorySensorIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.55"/><path d="M7.7 7.7a6.1 6.1 0 0 0 0 8.6M16.3 7.7a6.1 6.1 0 0 1 0 8.6M5 5a9.9 9.9 0 0 0 0 14M19 5a9.9 9.9 0 0 1 0 14" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>;
}
function CalendarAccessoryPresenceIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M7.7 19c.45-3.4 1.9-5.6 4.3-5.6s3.85 2.2 4.3 5.6M5 9.4a8.1 8.1 0 0 0 0 5.2M19 9.4a8.1 8.1 0 0 1 0 5.2" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>;
}
function CalendarAccessorySpeakerIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 10h3.2l4.5-3.7v11.4L8.4 14H5.2Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/><path d="M16 9.1a4.3 4.3 0 0 1 0 5.8M18.4 6.8a7.5 7.5 0 0 1 0 10.4" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>;
}
function CalendarAccessoryCameraIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="6.5" width="11.5" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m16 10 4-2.1v8.2L16 14Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;
}
function CalendarAccessoryPowerIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6v7.9" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/><path d="M7.65 6.55a7.35 7.35 0 1 0 8.7 0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>;
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
