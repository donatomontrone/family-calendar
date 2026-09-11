import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import ClimateControl from "./ClimateControl";
import SharedHeader from "./SharedHeader";
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
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [favorites, setFavoriteIds] = useState<string[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
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

  useEffect(() => {
    if (!rooms.length) return;
    if (!activeRoomId || !rooms.some((room) => room.area.area_id === activeRoomId)) {
      setActiveRoomId(rooms[0].area.area_id);
    }
  }, [rooms, activeRoomId]);

  const activeRoom = rooms.find((room) => room.area.area_id === activeRoomId) ?? rooms[0] ?? null;
  const detailRoom = detailRoomId ? rooms.find((room) => room.area.area_id === detailRoomId) ?? null : null;
  const allActionable = useMemo(() => rooms.flatMap((room) => room.controllableIds), [rooms]);
  const temperatures = rooms.map((room, index) => room.temperature ?? (demo ? 21.7 + index * 0.3 : undefined));
  const knownTemperatures = temperatures.filter((value): value is number => typeof value === "number");
  const climateIds = allActionable.filter((id) => domainOf(id) === "climate");
  const lightIds = allActionable.filter((id) => domainOf(id) === "light");
  const coverIds = allActionable.filter((id) => domainOf(id) === "cover");
  const activeLights = lightIds.filter((id) => isActive(hass, id)).length;
  const openCovers = coverIds.filter((id) => Number(hass.states[id]?.attributes.current_position ?? 0) > 0).length;
  const alarm = Object.values(hass.states).find((state) => state.entity_id.startsWith("alarm_control_panel."));
  const weather = Object.values(hass.states).find((state) => state.entity_id.startsWith("weather."));
  const outside = Number(weather?.attributes.temperature ?? 24.5);
  const isNight = typeof document !== "undefined" && document.querySelector(".app-shell.night") !== null;

  useEffect(() => {
    if (!activeRoom) {
      setSelectedControl(null);
      return;
    }
    const configurable = activeRoom.controllableIds.filter((id) => ["light", "cover", "climate"].includes(domainOf(id)));
    if (selectedControl && configurable.includes(selectedControl)) return;
    setSelectedControl(configurable[0] ?? null);
  }, [activeRoom, selectedControl]);

  async function toggleFavorite(entityId: string) {
    const next = favorites.includes(entityId) ? favorites.filter((id) => id !== entityId) : [...favorites, entityId];
    setFavoriteIds(next);
    await setFavorites(hass, next);
  }

  function openHeaderAction(kind: "alarm" | "notifications") {
    document.dispatchEvent(new CustomEvent("family-calendar-header-action", { detail: kind }));
  }

  function toggleTheme() {
    document.querySelector<HTMLButtonElement>(".global-theme-switch.home-header-theme-switch")?.click();
  }

  async function runScene(name: "night" | "guest" | "movie") {
    const keys = name === "night" ? ["buonanotte", "good_night", "night"] : name === "guest" ? ["ospiti", "guest"] : ["film", "movie"];
    const scene = Object.keys(hass.states).find((id) => id.startsWith("scene.") && keys.some((key) => id.includes(key)));
    if (scene) await hass.callService("scene", "turn_on", { entity_id: scene });
  }

  async function turnOffRoom() {
    if (!activeRoom) return;
    await deactivateEntities(hass, activeRoom.controllableIds);
  }

  const averageInside = average(knownTemperatures.length ? knownTemperatures : [22]);
  const climateActive = climateIds.some((id) => isActive(hass, id));

  return (
    <section className="reel-home home-refactor-v5">
      <SharedHeader
        hass={hass}
        now={now}
        language={language}
        onAlarm={() => openHeaderAction("alarm")}
        onNotifications={() => openHeaderAction("notifications")}
        onThemeToggle={toggleTheme}
        isNight={isNight}
        themeLabel={language === "it" ? "Cambia aspetto" : "Change appearance"}
      />

      <div className="home-v5-dashboard">
        <aside className="home-v5-left-column">
          <section className="card home-v5-overview-card">
            <div className="card-heading home-v5-card-heading">
              <span className="section-kicker">{copy.home}</span>
              <h2>{copy.atAGlance}</h2>
            </div>
            <div className="home-v5-overview-status">
              <span className="home-v5-status-symbol"><CheckIcon /></span>
              <div><strong>{copy.allClear}</strong><small>{copy.allClearDetail}</small></div>
            </div>
            <div className="home-v5-category-list">
              <StatusRow icon={<BulbIcon />} label={copy.lights} value={`${activeLights}/${lightIds.length}`} tone="yellow" />
              <StatusRow icon={<ThermometerIcon />} label={copy.climate} value={`${averageInside.toFixed(1)}°`} tone="orange" />
              <StatusRow icon={<ShieldIcon />} label={copy.security} value={alarm && alarm.state !== "disarmed" ? copy.armed : copy.disarmed} tone="green" />
              <StatusRow icon={<CoverIcon />} label={copy.covers} value={`${openCovers}/${coverIds.length}`} tone="blue" />
            </div>
          </section>

          <section className="card home-v5-scenes-card">
            <div className="card-heading home-v5-card-heading">
              <span className="section-kicker">{copy.routines}</span>
              <h2>{copy.scenes}</h2>
            </div>
            <div className="home-v5-scene-list">
              <SceneButton icon={<MoonIcon />} label={copy.goodNight} onClick={() => void runScene("night")} />
              <SceneButton icon={<UsersIcon />} label={copy.guestMode} onClick={() => void runScene("guest")} />
              <SceneButton icon={<MediaIcon />} label={copy.movieNight} onClick={() => void runScene("movie")} />
            </div>
          </section>
        </aside>

        <section className="card home-v5-room-panel">
          <div className="card-heading split home-v5-room-heading">
            <div>
              <span className="section-kicker">{copy.rooms}</span>
              <h1>{activeRoom?.area.name ?? copy.home}</h1>
            </div>
            <div className="home-v5-room-actions">
              {activeRoom && typeof activeRoom.temperature === "number" && <span className="home-v5-temperature-pill"><ThermometerIcon />{activeRoom.temperature.toFixed(1)}°</span>}
              <button className="power-all" type="button" onClick={() => void turnOffRoom()} aria-label={copy.turnOffRoom} title={copy.turnOffRoom}><PowerIcon /></button>
              {activeRoom && <button className="home-v5-detail-button" type="button" onClick={() => setDetailRoomId(activeRoom.area.area_id)}>{copy.details}<ChevronIcon /></button>}
            </div>
          </div>

          <div className="room-switcher room-chip-strip home-v5-room-switcher" role="tablist" aria-label={copy.rooms}>
            {rooms.map((room) => (
              <button
                key={room.area.area_id}
                role="tab"
                aria-selected={activeRoom?.area.area_id === room.area.area_id}
                className={activeRoom?.area.area_id === room.area.area_id ? "active" : ""}
                onClick={() => { setActiveRoomId(room.area.area_id); setSelectedControl(null); }}
              >
                <span className="home-v5-room-chip-icon">{roomIcon(room.area.name)}</span>
                {room.area.name}
              </button>
            ))}
          </div>

          <div className="home-v5-room-content">
            <div className="home-v5-section-title"><div><span className="section-kicker">{copy.controls}</span><h3>{copy.accessories}</h3></div><span>{activeRoom?.controllableIds.length ?? 0}</span></div>

            <div className="entity-grid home-v5-device-grid">
              {activeRoom?.controllableIds.map((entityId) => (
                <HomeAccessoryTile
                  key={entityId}
                  hass={hass}
                  entityId={entityId}
                  language={language}
                  favorite={favorites.includes(entityId)}
                  selected={selectedControl === entityId}
                  onToggleFavorite={() => void toggleFavorite(entityId)}
                  onSelectControl={() => setSelectedControl(selectedControl === entityId ? null : entityId)}
                />
              ))}
              {activeRoom && activeRoom.controllableIds.length === 0 && <div className="empty-state">{copy.noControllable}</div>}
            </div>

            {selectedControl && hass.states[selectedControl] && (
              <InlineDeviceControl hass={hass} entityId={selectedControl} language={language} onClose={() => setSelectedControl(null)} />
            )}

            <div className="home-v5-passive-section">
              <div className="home-v5-section-title"><div><span className="section-kicker">{copy.status}</span><h3>{copy.sensorsAndStatus}</h3></div><span>{activeRoom?.passiveIds.length ?? 0}</span></div>
              <div className="home-v5-passive-grid">
                {activeRoom?.passiveIds.slice(0, 6).map((entityId) => (
                  <div className="home-v5-passive-item" key={entityId}>
                    <span className="entity-icon">{iconForEntity(hass, entityId)}</span>
                    <div><strong>{shortName(displayName(hass, entityId), activeRoom.area.name)}</strong><small>{entityStatus(hass, entityId, language)}</small></div>
                  </div>
                ))}
                {activeRoom && activeRoom.passiveIds.length === 0 && <div className="empty-state">{copy.noSensors}</div>}
              </div>
            </div>
          </div>
        </section>

        <aside className="home-v5-right-column">
          <button className="card home-v5-climate-card" type="button" onClick={() => setOverlay("climate")}>
            <div className="home-v5-climate-header"><div><span className="section-kicker">{copy.climate}</span><h2>{copy.temperature}</h2></div><span className={`home-v5-climate-state ${climateActive ? "active" : ""}`}>{climateActive ? copy.active : copy.idle}</span></div>
            <div className="home-v5-climate-value"><strong>{averageInside.toFixed(1)}°</strong><small>{copy.inside}</small></div>
            <div className="home-v5-climate-meta">
              <span><small>{copy.outside}</small><strong>{Number.isFinite(outside) ? outside.toFixed(1) : "—"}°</strong></span>
              <span><small>{copy.zones}</small><strong>{climateIds.length}</strong></span>
            </div>
          </button>

          <section className="card home-v5-services-card">
            <div className="card-heading home-v5-card-heading"><span className="section-kicker">{copy.home}</span><h2>{copy.services}</h2></div>
            <div className="home-v5-service-grid">
              <ServiceButton icon={<RadarIcon />} label={copy.sensors} onClick={() => setOverlay("sensors")} />
              <ServiceButton icon={<CameraIcon />} label={copy.cameras} onClick={() => setOverlay("cameras")} />
              <ServiceButton icon={<MediaIcon />} label={copy.media} onClick={() => setOverlay("media")} />
              <ServiceButton icon={<VacuumIcon />} label={copy.vacuum} onClick={() => setOverlay("vacuum")} />
              <ServiceButton icon={<CoverIcon />} label={copy.covers} onClick={() => setOverlay("cover")} />
              <ServiceButton icon={<BatteryIcon />} label={copy.batteries} onClick={() => setOverlay("batteries")} />
            </div>
          </section>
        </aside>
      </div>

      {detailRoom && (
        <RoomSheet
          hass={hass}
          room={detailRoom}
          language={language}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onClose={() => setDetailRoomId(null)}
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

function HomeAccessoryTile({ hass, entityId, language, favorite, selected, onToggleFavorite, onSelectControl }: {
  hass: Hass;
  entityId: string;
  language: Language;
  favorite: boolean;
  selected: boolean;
  onToggleFavorite: () => void;
  onSelectControl: () => void;
}) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const active = isActive(hass, entityId);
  const unavailable = ["unavailable", "unknown"].includes(state?.state ?? "unknown");
  const configurable = ["light", "cover", "climate"].includes(domain);
  const style = domain === "light" ? ({ "--accessory-active": whiteTemperatureAccent(getWhiteTemperature(state.attributes)) } as CSSProperties) : undefined;

  return (
    <article className={`entity-tile domain-${domain} ${active ? "active" : ""} ${selected ? "selected" : ""} ${unavailable ? "unavailable" : ""}`} style={style}>
      <button className="entity-main" type="button" onClick={() => !unavailable && void activateEntity(hass, entityId)} disabled={unavailable}>
        <span className="entity-icon">{iconForEntity(hass, entityId)}</span>
        <strong>{displayName(hass, entityId)}</strong>
        <small>{unavailable ? (language === "it" ? "Non disponibile" : "Unavailable") : entityStatus(hass, entityId, language)}</small>
      </button>
      <button className={`favorite-button ${favorite ? "selected" : ""}`} type="button" onClick={onToggleFavorite} aria-label={favorite ? (language === "it" ? "Rimuovi dai preferiti" : "Remove from favorites") : (language === "it" ? "Aggiungi ai preferiti" : "Add to favorites")}><StarIcon /></button>
      {configurable && !unavailable && <button className="control-button" type="button" onClick={onSelectControl} aria-label={language === "it" ? "Controlli" : "Controls"}><SlidersIcon /></button>}
    </article>
  );
}

function InlineDeviceControl({ hass, entityId, language, onClose }: { hass: Hass; entityId: string; language: Language; onClose: () => void }) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const brightness = Math.round((Number(state.attributes.brightness ?? 200) / 255) * 100);
  const position = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  const white = getWhiteTemperature(state.attributes);

  return (
    <section className={`home-v5-inline-control device-controls device-controls-${domain}`}>
      <div className="device-controls-heading">
        <div><span className="section-kicker">{language === "it" ? "Controlli" : "Controls"}</span><strong>{displayName(hass, entityId)}</strong></div>
        <button type="button" onClick={onClose} aria-label={language === "it" ? "Chiudi" : "Close"}><CloseIcon /></button>
      </div>
      {domain === "light" && (
        <>
          <ControlRow label={language === "it" ? "Luminosità" : "Brightness"} value={`${brightness}%`}>
            <input type="range" min="1" max="100" value={brightness} onChange={(event) => void setLightBrightness(hass, entityId, Number(event.target.value))} />
          </ControlRow>
          <ControlRow label={language === "it" ? "Temperatura bianco" : "White temperature"} value={`${Math.round(white.currentKelvin)} K`}>
            <input className="white-temperature-control" type="range" min={white.minKelvin} max={white.maxKelvin} step="50" value={white.currentKelvin} onChange={(event) => void setLightColorTemperature(hass, entityId, Number(event.target.value))} />
          </ControlRow>
        </>
      )}
      {domain === "cover" && (
        <ControlRow label={language === "it" ? "Posizione" : "Position"} value={`${Math.round(position)}%`}>
          <input type="range" min="0" max="100" value={position} onChange={(event) => void setCoverPosition(hass, entityId, Number(event.target.value))} />
        </ControlRow>
      )}
      {domain === "climate" && <ClimateControl hass={hass} entityId={entityId} language={language} variant="compact" showName={false} />}
    </section>
  );
}

function ControlRow({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return <div className="control-row"><div className="control-meta"><span>{label}</span><strong>{value}</strong></div>{children}</div>;
}

function StatusRow({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return <div className={`home-v5-status-row tone-${tone}`}><span>{icon}</span><strong>{label}</strong><b>{value}</b></div>;
}

function SceneButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="home-v5-scene-button" type="button" onClick={onClick}><span>{icon}</span><strong>{label}</strong><ChevronIcon /></button>;
}

function ServiceButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="home-v5-service-button" type="button" onClick={onClick}><span>{icon}</span><strong>{label}</strong></button>;
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
function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function shortName(name: string, roomName: string) { const cleaned = name.replace(new RegExp(roomName, "ig"), "").replace(/^[\s_-]+|[\s_-]+$/g, ""); return cleaned || name; }

function findTemperature(hass: Hass, ids: string[]) {
  const state = ids.map((id) => hass.states[id]).find((item) => item?.attributes.device_class === "temperature" || item?.attributes.unit_of_measurement === "°C");
  const value = Number(state?.state);
  return Number.isFinite(value) ? value : undefined;
}

function entityStatus(hass: Hass, entityId: string, language: Language) {
  const state = hass.states[entityId];
  if (!state) return "—";
  const domain = domainOf(entityId);
  const unit = String(state.attributes.unit_of_measurement ?? "");
  if (unit && Number.isFinite(Number(state.state))) return `${state.state}${unit === "%" || unit.startsWith("°") ? "" : " "}${unit}`;
  const deviceClass = String(state.attributes.device_class ?? "").toLowerCase();
  if (domain === "binary_sensor") {
    const on = state.state === "on";
    if (["motion", "occupancy", "presence"].includes(deviceClass)) return language === "it" ? (on ? "Presenza rilevata" : "Nessuna presenza") : (on ? "Presence detected" : "No presence");
    if (["door", "window", "opening"].includes(deviceClass)) return language === "it" ? (on ? "Aperto" : "Chiuso") : (on ? "Open" : "Closed");
  }
  if (domain === "cover") return `${Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0))}%`;
  if (domain === "light") return state.state === "on" ? `${Math.round((Number(state.attributes.brightness ?? 255) / 255) * 100)}%` : (language === "it" ? "Spenta" : "Off");
  if (domain === "climate") {
    const current = Number(state.attributes.current_temperature);
    const target = Number(state.attributes.temperature);
    if (Number.isFinite(current) && Number.isFinite(target)) return `${current.toFixed(1)}° → ${target.toFixed(target % 1 === 0 ? 0 : 1)}°`;
    if (Number.isFinite(current)) return `${current.toFixed(1)}°`;
  }
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

function overlayTitle(kind: Exclude<Overlay, null>, copy: typeof itCopy) { const labels: Record<Exclude<Overlay, null>, string> = { routines: copy.routines, batteries: copy.batteries, climate: copy.climate, sensors: copy.sensors, cameras: copy.cameras, media: copy.media, vacuum: copy.vacuum, car: copy.car, cover: copy.covers }; return labels[kind]; }

const itCopy = {
  home: "Casa",
  atAGlance: "A colpo d’occhio",
  allClear: "Tutto tranquillo",
  allClearDetail: "Nessuna anomalia rilevata",
  lights: "Luci",
  climate: "Clima",
  security: "Sicurezza",
  covers: "Tapparelle",
  armed: "Inserito",
  disarmed: "Disinserito",
  routines: "Routine",
  scenes: "Scene",
  goodNight: "Buonanotte",
  guestMode: "Ospiti",
  movieNight: "Film",
  rooms: "Stanze",
  controls: "Controlli",
  accessories: "Dispositivi",
  status: "Stato",
  sensorsAndStatus: "Sensori e stato",
  details: "Dettagli",
  turnOffRoom: "Spegni stanza",
  noControllable: "Nessun dispositivo controllabile",
  noSensors: "Nessun sensore",
  temperature: "Temperatura",
  inside: "Interno",
  outside: "Esterno",
  zones: "Zone",
  active: "Attivo",
  idle: "Inattivo",
  services: "Servizi",
  sensors: "Sensori",
  cameras: "Telecamere",
  media: "Media",
  vacuum: "Aspirapolvere",
  batteries: "Batterie",
  roomControls: "Controlli stanza",
  turnOffAll: "Spegni tutto",
  close: "Chiudi",
  noThermostat: "Nessun termostato",
  car: "Auto",
};

const enCopy: typeof itCopy = {
  home: "Home",
  atAGlance: "At a glance",
  allClear: "All clear",
  allClearDetail: "No issues detected",
  lights: "Lights",
  climate: "Climate",
  security: "Security",
  covers: "Covers",
  armed: "Armed",
  disarmed: "Disarmed",
  routines: "Routines",
  scenes: "Scenes",
  goodNight: "Good night",
  guestMode: "Guests",
  movieNight: "Movie",
  rooms: "Rooms",
  controls: "Controls",
  accessories: "Accessories",
  status: "Status",
  sensorsAndStatus: "Sensors & status",
  details: "Details",
  turnOffRoom: "Turn room off",
  noControllable: "No controllable devices",
  noSensors: "No sensors",
  temperature: "Temperature",
  inside: "Inside",
  outside: "Outside",
  zones: "Zones",
  active: "Active",
  idle: "Idle",
  services: "Services",
  sensors: "Sensors",
  cameras: "Cameras",
  media: "Media",
  vacuum: "Vacuum",
  batteries: "Batteries",
  roomControls: "Room controls",
  turnOffAll: "Turn off all",
  close: "Close",
  noThermostat: "No thermostat",
  car: "Car",
};

function Icon({ children }: { children: ReactNode }) { return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>; }
function StrokeIcon({ children }: { children: ReactNode }) { return <Icon><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</g></Icon>; }
function ShieldIcon() { return <StrokeIcon><path d="M12 3.2 18.7 6v5c0 4.8-2.6 7.9-6.7 9.8C7.9 18.9 5.3 15.8 5.3 11V6Z"/><path d="m9.2 12 1.7 1.7 3.9-3.9"/></StrokeIcon>; }
function CheckIcon() { return <StrokeIcon><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></StrokeIcon>; }
function ThermometerIcon() { return <StrokeIcon><path d="M10 14.5V5.8a2 2 0 1 1 4 0v8.7a4 4 0 1 1-4 0Z"/><path d="M12 8v8"/></StrokeIcon>; }
function BatteryIcon() { return <StrokeIcon><rect x="4" y="7" width="15" height="10" rx="2"/><path d="M19 10h2v4h-2M7 10h6v4H7z"/></StrokeIcon>; }
function RadarIcon() { return <StrokeIcon><circle cx="12" cy="12" r="2"/><path d="M7.1 16.9a7 7 0 0 1 0-9.8M16.9 7.1a7 7 0 0 1 0 9.8M4.2 19.8a11 11 0 0 1 0-15.6M19.8 4.2a11 11 0 0 1 0 15.6"/></StrokeIcon>; }
function ClimateIcon() { return <StrokeIcon><path d="M12 3v18M5 7l14 10M19 7 5 17"/></StrokeIcon>; }
function CameraIcon() { return <StrokeIcon><rect x="3" y="7" width="18" height="12" rx="3"/><circle cx="12" cy="13" r="3"/><path d="m7 7 1.5-2h7L17 7"/></StrokeIcon>; }
function MediaIcon() { return <StrokeIcon><rect x="4" y="5" width="16" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/></StrokeIcon>; }
function VacuumIcon() { return <StrokeIcon><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 4v3M6 17l2-2"/></StrokeIcon>; }
function CoverIcon() { return <StrokeIcon><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M7.5 7h9M7.5 10h9M7.5 13h9M7.5 16h9"/></StrokeIcon>; }
function BulbIcon() { return <StrokeIcon><path d="M8.2 9.5a3.8 3.8 0 1 1 7.6 0c0 2-1.3 2.8-2 4H10c-.5-1.2-1.8-2-1.8-4Z"/><path d="M10 16h4M10.8 19h2.4"/></StrokeIcon>; }
function PowerIcon() { return <StrokeIcon><path d="M12 3v8M7.1 6.6A7 7 0 1 0 17 6.6"/></StrokeIcon>; }
function LockIcon() { return <StrokeIcon><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></StrokeIcon>; }
function StarIcon() { return <StrokeIcon><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></StrokeIcon>; }
function SlidersIcon() { return <StrokeIcon><path d="M5 7h8m4 0h2M5 17h3m4 0h7M13 4v6M8 14v6"/></StrokeIcon>; }
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
