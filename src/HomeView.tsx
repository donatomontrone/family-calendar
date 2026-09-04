import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import ClimateControl from "./ClimateControl";
import RoomInsights from "./RoomInsights";
import type { Area, EntityRegistryEntry, Hass } from "./types";
import {
  activateEntity,
  deactivateEntities,
  displayName,
  getFavorites,
  setCoverPosition,
  setFavorites,
  setLightBrightness,
  setLightColor,
} from "./ha";
import type { Language } from "./i18n";

const ACTIONABLE_DOMAINS = new Set(["light", "switch", "cover", "climate", "fan", "media_player", "lock", "vacuum"]);
const ACTIVE_STATES = new Set(["on", "open", "heat", "cool", "heat_cool", "auto", "fan_only", "dry", "playing", "unlocked", "cleaning"]);
type Overlay = "alarm" | "routines" | "batteries" | "climate" | "sensors" | "cameras" | "media" | "vacuum" | "car" | "cover" | null;

type HomeViewProps = { hass: Hass; areas: Area[]; entities: EntityRegistryEntry[]; now: Date; demo: boolean; language: Language };
type RoomModel = { area: Area; entityIds: string[]; allIds: string[]; temperature?: number; activeCount: number; accent: "amber" | "rose" | "mint" | "blue" | "violet" };
const accentOrder: RoomModel["accent"][] = ["amber", "rose", "mint", "blue", "violet"];

export default function HomeView({ hass, areas, entities, now, demo, language }: HomeViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [favorites, setFavoriteIds] = useState<string[]>([]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const copy = language === "it" ? itCopy : enCopy;

  useEffect(() => {
    let active = true;
    void getFavorites(hass).then((ids) => { if (active) setFavoriteIds(ids); }).catch(console.error);
    return () => { active = false; };
  }, [hass]);

  const rooms = useMemo<RoomModel[]>(() => areas.map((area, index) => {
    const allIds = entities.filter((entry) => entry.area_id === area.area_id).map((entry) => entry.entity_id).filter((id) => hass.states[id]);
    const entityIds = allIds.filter((id) => ACTIONABLE_DOMAINS.has(domainOf(id)));
    return {
      area,
      allIds,
      entityIds,
      temperature: findTemperature(hass, allIds),
      activeCount: entityIds.filter((id) => isActive(hass, id)).length,
      accent: accentOrder[index % accentOrder.length],
    };
  }), [areas, entities, hass]);

  const allActionable = useMemo(() => rooms.flatMap((room) => room.entityIds), [rooms]);
  const selected = selectedRoom ? rooms.find((room) => room.area.area_id === selectedRoom) ?? null : null;
  const temperatures = rooms.map((room, index) => room.temperature ?? (demo ? 21.8 + index * 0.6 : undefined));
  const knownTemperatures = temperatures.filter((value): value is number => typeof value === "number");
  const alarm = Object.values(hass.states).find((state) => state.entity_id.startsWith("alarm_control_panel."));
  const weather = Object.values(hass.states).find((state) => state.entity_id.startsWith("weather."));
  const outside = Number(weather?.attributes.temperature ?? 24.5);

  async function toggleFavorite(entityId: string) {
    const next = favorites.includes(entityId) ? favorites.filter((id) => id !== entityId) : [...favorites, entityId];
    setFavoriteIds(next);
    await setFavorites(hass, next);
  }

  async function runScene(name: "night" | "guest" | "movie") {
    const keys = name === "night" ? ["buonanotte", "good_night", "night"] : name === "guest" ? ["ospiti", "guest"] : ["film", "movie"];
    const scene = Object.keys(hass.states).find((id) => id.startsWith("scene.") && keys.some((key) => id.includes(key)));
    if (scene) await hass.callService("scene", "turn_on", { entity_id: scene });
  }

  return (
    <section className="reel-home">
      <header className="reel-topbar">
        <div className="reel-greeting">
          <strong>{greetingForHour(now.getHours(), copy)}</strong>
          <span>{now.toLocaleDateString(locale(language), { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
        <div className="reel-clock">{now.toLocaleTimeString(locale(language), { hour: "2-digit", minute: "2-digit" })}</div>
        <div className="reel-top-actions">
          <span className="weather-pill"><SunIcon /><strong>{outside.toFixed(1)}°</strong><small>{copy.sunny}</small></span>
          <span className="avatar-stack"><i>G</i><i>A</i></span>
          <button className="security-pill" onClick={() => setOverlay("alarm")}><ShieldIcon /><span>{alarm && alarm.state !== "disarmed" ? copy.armed : copy.disarmed}</span></button>
          <button className="round-top" aria-label={copy.notifications}><BellIcon /></button>
        </div>
      </header>

      <div className="reel-dashboard">
        <div className="reel-room-grid">
          {rooms.map((room) => (
            <RoomCard
              key={room.area.area_id}
              hass={hass}
              room={room}
              language={language}
              onOpen={() => setSelectedRoom(room.area.area_id)}
              onQuickDetail={(kind) => setOverlay(kind)}
            />
          ))}
        </div>

        <aside className="reel-side">
          <section className="reel-side-card home-message-card">
            <span className="reel-kicker">{copy.houseSays}</span>
            <div className="house-message"><CheckIcon /><div><strong>{copy.allClear}</strong><span>{copy.allClearDetail}</span></div></div>
          </section>

          <button className="reel-side-card alarm-row" onClick={() => setOverlay("alarm")}>
            <span className="side-icon mint"><ShieldIcon /></span><div><strong>{copy.alarm}</strong><small>{copy.disarmed} — {copy.homeFree}</small></div><b>{copy.arm}</b>
          </button>

          <button className="reel-side-card thermostat-card" onClick={() => setOverlay("climate")}>
            <div className="side-heading"><span><ThermometerIcon /> {copy.thermostat}</span><b>{copy.manage}</b></div>
            <TemperatureSparkline values={knownTemperatures.length ? knownTemperatures : [21.9, 22.1, 22.0, 22.4, 22.6, 22.3, 22.5]} />
            <div className="thermo-meta"><span>{copy.inside} <strong>{average(knownTemperatures.length ? knownTemperatures : [22]).toFixed(1)}°</strong></span><span>{copy.outside} <strong>{outside.toFixed(1)}°</strong></span></div>
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
        <ReelOverlay
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

function RoomCard({ hass, room, language, onOpen, onQuickDetail }: { hass: Hass; room: RoomModel; language: Language; onOpen: () => void; onQuickDetail: (kind: Overlay) => void }) {
  const quick = room.entityIds.slice(0, 3);
  const accessories = room.entityIds.slice(0, 5);
  const temp = room.temperature;

  const runEntity = (entityId: string) => {
    const domain = domainOf(entityId);
    if (domain === "climate") return onQuickDetail("climate");
    if (domain === "cover") return onQuickDetail("cover");
    void activateEntity(hass, entityId);
  };

  return (
    <article className={`reel-room room-${room.accent}`}>
      <button className="reel-room-head" onClick={onOpen}>
        <span><RoomIcon /><strong>{room.area.name}</strong></span>
        <b>{typeof temp === "number" ? `${temp.toFixed(1)}°` : "—"}</b>
      </button>
      <div className="room-scene-row">
        {quick.map((id) => (
          <button key={id} className={isActive(hass, id) ? "active" : ""} onClick={() => runEntity(id)}>
            <span>{iconForDomain(domainOf(id))}</span><small>{shortName(displayName(hass, id), room.area.name)}</small>
          </button>
        ))}
      </div>
      <div className="room-level"><i style={{ width: `${room.entityIds.length ? Math.max(5, room.activeCount / room.entityIds.length * 100) : 5}%` }} /></div>
      <RoomInsights hass={hass} entityIds={room.allIds} language={language} />
      <div className="room-accessory-row">
        {accessories.map((id) => (
          <button key={id} className={isActive(hass, id) ? "active" : ""} onClick={() => runEntity(id)}>
            {iconForDomain(domainOf(id))}<span>{shortName(displayName(hass, id), room.area.name)}</span>
          </button>
        ))}
      </div>
      <button className="room-open-detail" onClick={onOpen}>{language === "it" ? "Dettagli" : "Details"}<ChevronIcon /></button>
    </article>
  );
}

function RoomSheet({ hass, room, language, favorites, onToggleFavorite, onClose }: { hass: Hass; room: RoomModel; language: Language; favorites: string[]; onToggleFavorite: (id: string) => Promise<void>; onClose: () => void }) {
  const copy = language === "it" ? itCopy : enCopy;
  return (
    <div className="reel-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="reel-modal room-modal">
        <div className="modal-head">
          <div><span className="reel-kicker">{copy.roomControls}</span><h2>{room.area.name}</h2></div>
          <div>
            <button className="modal-danger" onClick={() => void deactivateEntities(hass, room.entityIds)}><PowerIcon />{copy.turnOffAll}</button>
            <button className="modal-close" onClick={onClose} aria-label={copy.close}><CloseIcon /></button>
          </div>
        </div>
        <div className="room-modal-grid">
          {room.entityIds.map((id) => (
            <AccessoryTile
              key={id}
              hass={hass}
              entityId={id}
              language={language}
              favorite={favorites.includes(id)}
              detailed
              onToggleFavorite={() => void onToggleFavorite(id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AccessoryTile({ hass, entityId, language, favorite, onToggleFavorite, detailed = false }: { hass: Hass; entityId: string; language: Language; favorite: boolean; onToggleFavorite: () => void; detailed?: boolean }) {
  const state = hass.states[entityId];
  const domain = domainOf(entityId);
  const active = isActive(hass, entityId);
  const unavailable = ["unavailable", "unknown"].includes(state.state);
  const brightness = Math.round((Number(state.attributes.brightness ?? 180) / 255) * 100);
  const position = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  const color = lightColor(state.attributes);
  const style = active && domain === "light" ? ({ "--accessory-accent": color } as CSSProperties) : undefined;
  const favoriteLabel = favorite ? (language === "it" ? "Rimuovi dai preferiti" : "Remove from favorites") : (language === "it" ? "Aggiungi ai preferiti" : "Add to favorites");

  return (
    <article className={`apple-accessory-tile domain-${domain} ${active ? "active" : ""} ${unavailable ? "unavailable" : ""} ${detailed ? "detailed" : ""}`} style={style}>
      <button className="apple-accessory-main" onClick={() => !unavailable && void activateEntity(hass, entityId)} disabled={unavailable}>
        <span className="apple-accessory-icon">{iconForDomain(domain)}</span>
        <span className="apple-accessory-copy">
          <strong>{displayName(hass, entityId)}</strong>
          <small className={unavailable ? "danger" : ""}>{unavailable ? (language === "it" ? "Non risponde" : "No response") : accessoryState(hass, entityId, language)}</small>
        </span>
      </button>
      <button className={`apple-favorite-toggle ${favorite ? "selected" : ""}`} onClick={onToggleFavorite} aria-label={favoriteLabel} title={favoriteLabel}><StarIcon /></button>
      {unavailable && <span className="apple-accessory-warning">!</span>}
      {detailed && !unavailable && domain === "light" && (
        <>
          <label className="sheet-slider"><span>{language === "it" ? "Intensità" : "Brightness"}<strong>{brightness}%</strong></span><input type="range" min="1" max="100" defaultValue={brightness} onChange={(event) => void setLightBrightness(hass, entityId, Number(event.target.value))} /></label>
          <label className="sheet-color"><span>{language === "it" ? "Colore" : "Color"}</span><input type="color" defaultValue={color} onChange={(event) => void setLightColor(hass, entityId, event.target.value)} /></label>
        </>
      )}
      {detailed && !unavailable && domain === "cover" && (
        <label className="sheet-slider"><span>{language === "it" ? "Posizione" : "Position"}<strong>{position}%</strong></span><input type="range" min="0" max="100" defaultValue={position} onChange={(event) => void setCoverPosition(hass, entityId, Number(event.target.value))} /></label>
      )}
      {detailed && !unavailable && domain === "climate" && (
        <ClimateControl hass={hass} entityId={entityId} language={language} variant="compact" showName={false} />
      )}
    </article>
  );
}

function ReelOverlay({ kind, hass, language, rooms, onClose, onRunScene, onAllOff }: { kind: Exclude<Overlay, null>; hass: Hass; language: Language; rooms: RoomModel[]; onClose: () => void; onRunScene: (name: "night" | "guest" | "movie") => Promise<void>; onAllOff: () => void }) {
  const copy = language === "it" ? itCopy : enCopy;
  return (
    <div className="reel-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className={`reel-modal feature-modal ${kind}-modal`}>
        <div className="modal-head">
          <div><span className="reel-kicker">{copy.home}</span><h2>{overlayTitle(kind, copy)}</h2></div>
          <button className="modal-close" onClick={onClose} aria-label={copy.close}><CloseIcon /></button>
        </div>
        {kind === "alarm" && <AlarmPanel hass={hass} language={language} />}
        {kind === "routines" && (
          <div className="routine-list">
            <RoutineRow icon={<MoonIcon />} title={copy.goodNight} detail={copy.goodNightDetail} onClick={() => void onRunScene("night")} />
            <RoutineRow icon={<UsersIcon />} title={copy.guestMode} detail={copy.guestDetail} onClick={() => void onRunScene("guest")} />
            <RoutineRow icon={<MediaIcon />} title={copy.movieNight} detail={copy.movieDetail} onClick={() => void onRunScene("movie")} />
            <button className="routine-all-off" onClick={onAllOff}><PowerIcon />{copy.turnOffAll}</button>
          </div>
        )}
        {kind === "batteries" && <BatteryPanel language={language} />}
        {kind === "climate" && <ClimatePanel rooms={rooms} language={language} hass={hass} />}
        {kind === "sensors" && <SensorPanel hass={hass} language={language} />}
        {kind === "cameras" && <CameraPanel hass={hass} language={language} />}
        {kind === "media" && <MediaPanel hass={hass} language={language} />}
        {kind === "vacuum" && <VacuumPanel language={language} />}
        {kind === "car" && <CarPanel language={language} />}
        {kind === "cover" && <CoverPanel hass={hass} language={language} />}
      </section>
    </div>
  );
}

function AlarmPanel({ hass, language }: { hass: Hass; language: Language }) {
  const copy = language === "it" ? itCopy : enCopy;
  const [pin, setPin] = useState("");
  const alarm = Object.keys(hass.states).find((id) => id.startsWith("alarm_control_panel."));
  const keys: Array<number | "" | "backspace"> = [1,2,3,4,5,6,7,8,9,"",0,"backspace"];
  return (
    <div className="alarm-panel">
      <div className="alarm-shield"><ShieldIcon /></div>
      <strong>{copy.alarmReady}</strong>
      <small>{copy.alarmPinHint}</small>
      <div className="pin-dots">{[0,1,2,3].map((index) => <i key={index} className={index < pin.length ? "filled" : ""} />)}</div>
      <div className="pin-grid">
        {keys.map((key, index) => (
          <button key={index} disabled={key === ""} onClick={() => {
            if (key === "backspace") setPin(pin.slice(0, -1));
            else if (key !== "" && pin.length < 4) setPin(pin + key);
          }}>{key === "backspace" ? <BackspaceIcon /> : key}</button>
        ))}
      </div>
      <button className="primary-action" disabled={pin.length < 4 || !alarm} onClick={() => alarm && void hass.callService("alarm_control_panel", "alarm_arm_away", { entity_id: alarm, code: pin })}>{copy.arm}</button>
    </div>
  );
}

function BatteryPanel({ language }: { language: Language }) {
  const copy = language === "it" ? itCopy : enCopy;
  const rows = [[copy.wallTablet,48],[copy.doorSensor,60],[copy.motionKitchen,70],[copy.remoteLiving,73],[copy.vacuum,98],[copy.lock,100],[copy.camera,100],[copy.thermostat,92]] as [string,number][];
  return <div className="battery-grid">{rows.map(([name,value]) => <div className="battery-item" key={name}><span>{name}</span><strong>{value}%</strong><div><i style={{ width: `${value}%` }} /></div></div>)}</div>;
}

function ClimatePanel({ rooms, language, hass }: { rooms: RoomModel[]; language: Language; hass: Hass }) {
  const copy = language === "it" ? itCopy : enCopy;
  return (
    <div className="climate-grid">
      {rooms.map((room) => {
        const climate = room.entityIds.find((id) => domainOf(id) === "climate");
        if (climate) return <ClimateControl key={room.area.area_id} hass={hass} entityId={climate} language={language} variant="full" />;
        return (
          <article className="climate-empty-card" key={room.area.area_id}>
            <span className="climate-empty-icon"><ThermometerIcon /></span>
            <div><strong>{room.area.name}</strong><small>{copy.noThermostat}</small></div>
            <b>{typeof room.temperature === "number" ? `${room.temperature.toFixed(1)}°` : "—"}</b>
          </article>
        );
      })}
    </div>
  );
}

function SensorPanel({ hass, language }: { hass: Hass; language: Language }) {
  const copy = language === "it" ? itCopy : enCopy;
  const sensors = Object.values(hass.states).filter((state) => {
    if (!state.entity_id.startsWith("binary_sensor.")) return false;
    const deviceClass = String(state.attributes.device_class ?? "");
    return ["door", "window", "opening", "motion", "occupancy", "presence"].includes(deviceClass);
  }).slice(0, 12);

  if (!sensors.length) return <div className="feature-empty">{copy.noSensors}</div>;
  return (
    <div className="sensor-grid">
      {sensors.map((sensor) => {
        const deviceClass = String(sensor.attributes.device_class ?? "");
        const active = sensor.state === "on";
        return (
          <article className={active ? "active" : ""} key={sensor.entity_id}>
            <span>{["motion", "occupancy", "presence"].includes(deviceClass) ? <MotionIcon /> : <DoorIcon />}</span>
            <div><strong>{displayName(hass, sensor.entity_id)}</strong><small>{sensorLabel(deviceClass, active, copy)}</small></div>
          </article>
        );
      })}
    </div>
  );
}

function CameraPanel({ hass, language }: { hass: Hass; language: Language }) {
  const copy = language === "it" ? itCopy : enCopy;
  const cameras = Object.values(hass.states).filter((state) => state.entity_id.startsWith("camera.")).slice(0, 6);
  if (!cameras.length) return <div className="feature-empty">{copy.noCameras}</div>;
  return (
    <div className="camera-grid">
      {cameras.map((camera) => {
        const picture = typeof camera.attributes.entity_picture === "string" ? camera.attributes.entity_picture : undefined;
        return (
          <article key={camera.entity_id}>
            <div className="camera-preview">{picture ? <img src={picture} alt="" /> : <CameraIcon />}</div>
            <div><strong>{displayName(hass, camera.entity_id)}</strong><small>{camera.state === "unavailable" ? copy.unavailable : copy.online}</small></div>
          </article>
        );
      })}
    </div>
  );
}

function MediaPanel({ hass, language }: { hass: Hass; language: Language }) {
  const copy = language === "it" ? itCopy : enCopy;
  const players = Object.values(hass.states).filter((state) => state.entity_id.startsWith("media_player.")).slice(0, 8);
  if (!players.length) return <div className="feature-empty">{copy.noMedia}</div>;
  return (
    <div className="media-list">
      {players.map((player) => {
        const volume = Math.round(Number(player.attributes.volume_level ?? 0.35) * 100);
        const playing = player.state === "playing";
        return (
          <article key={player.entity_id}>
            <span className={`media-device-icon ${playing ? "active" : ""}`}><MediaIcon /></span>
            <div className="media-copy"><strong>{displayName(hass, player.entity_id)}</strong><small>{playing ? copy.playing : humanState(player.state, language)}</small></div>
            <button className="media-play" onClick={() => void hass.callService("media_player", "media_play_pause", { entity_id: player.entity_id })} aria-label={playing ? copy.pause : copy.play}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
            <input type="range" min="0" max="100" value={volume} aria-label={copy.volume} onChange={(event) => void hass.callService("media_player", "volume_set", { entity_id: player.entity_id, volume_level: Number(event.target.value) / 100 })} />
          </article>
        );
      })}
    </div>
  );
}

function VacuumPanel({ language }: { language: Language }) {
  const copy = language === "it" ? itCopy : enCopy;
  const rooms = [copy.bathroom,copy.kitchen,copy.bedroom,copy.living,copy.study,copy.hall];
  const consumables = [[copy.mainBrush,98],[copy.sideBrush,99],[copy.filter,84],[copy.sensorsClean,83]] as [string,number][];
  return (
    <div className="vacuum-panel">
      <div className="vacuum-hero"><div className="vacuum-disc"><VacuumIcon /></div><div><strong>Dreame</strong><span>100% · {copy.ready}</span></div></div>
      <div className="vacuum-actions">
        <button><DockIcon /><span>{copy.homeBase}</span></button>
        <button><PauseIcon /><span>{copy.pause}</span></button>
        <button><StopIcon /><span>{copy.stop}</span></button>
        <button><EmptyIcon /><span>{copy.empty}</span></button>
      </div>
      <h3>{copy.suction}</h3>
      <div className="mode-segment"><button>{copy.silent}</button><button className="active">{copy.normal}</button><button>{copy.strong}</button><button>{copy.turbo}</button></div>
      <h3>{copy.cleanRoom}</h3>
      <div className="vacuum-rooms">{rooms.map((room,index) => <button key={room} className={index === 1 ? "active" : ""}>{room}</button>)}</div>
      <h3>{copy.consumables}</h3>
      <div className="consumables">{consumables.map(([name,value]) => <div key={name}><span>{name}<strong>{value}%</strong></span><i><b style={{width:`${value}%`}} /></i></div>)}</div>
      <div className="vacuum-footer"><button>{copy.washMop}</button><button>{copy.emptyDust}</button><button>{copy.dryMop}</button></div>
    </div>
  );
}

function CarPanel({ language }: { language: Language }) {
  const copy = language === "it" ? itCopy : enCopy;
  return (
    <div className="car-panel">
      <div className="car-visual"><CarIcon /><div className="car-wheels"><i/><i/></div></div>
      <div className="car-title"><strong>Leapmotor T03</strong><span>● {copy.boxAlarm}</span></div>
      <div className="car-stats"><Stat value="57%" label={copy.battery}/><Stat value="176 km" label={copy.range}/><Stat value={copy.parked} label={copy.status}/><Stat value="0" label={copy.openDoors}/><Stat value={copy.closed} label={copy.windows}/><Stat value="786 km" label={copy.odometer}/></div>
    </div>
  );
}

function CoverPanel({ hass, language }: { hass: Hass; language: Language }) {
  const copy = language === "it" ? itCopy : enCopy;
  const cover = Object.keys(hass.states).find((id) => id.startsWith("cover."));
  const state = cover ? hass.states[cover] : undefined;
  const value = Number(state?.attributes.current_position ?? 100);
  return (
    <div className="cover-panel">
      <div className="cover-icon"><CoverIcon /></div><strong>{cover ? displayName(hass, cover) : copy.cover}</strong><b>{value}%</b>
      <input type="range" min="0" max="100" defaultValue={value} onChange={(event) => cover && void setCoverPosition(hass, cover, Number(event.target.value))}/>
      <div>
        <button onClick={() => cover && void hass.callService("cover","open_cover",{entity_id:cover})} aria-label={copy.open}><ChevronUpIcon /></button>
        <button onClick={() => cover && void hass.callService("cover","stop_cover",{entity_id:cover})} aria-label={copy.stop}><StopIcon /></button>
        <button onClick={() => cover && void hass.callService("cover","close_cover",{entity_id:cover})} aria-label={copy.closeCover}><ChevronDownIcon /></button>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) { return <button onClick={onClick}>{icon}<span>{label}</span></button>; }
function RoutineRow({ icon, title, detail, onClick }: { icon: ReactNode; title: string; detail: string; onClick: () => void }) { return <button onClick={onClick}><span>{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><ChevronIcon /></button>; }
function Stat({ value, label }: { value: string; label: string }) { return <div><strong>{value}</strong><span>{label}</span></div>; }
function overlayTitle(kind: Exclude<Overlay,null>, copy: typeof itCopy) { return ({ alarm:copy.alarm, routines:copy.routines, batteries:copy.batteryStatus, climate:copy.homeClimate, sensors:copy.sensors, cameras:copy.cameras, media:copy.media, vacuum:"Dreame", car:"Leapmotor T03", cover:copy.coverControl })[kind]; }

function findTemperature(hass: Hass, ids: string[]) {
  for (const id of ids) {
    const state = hass.states[id];
    if (!state) continue;
    if (domainOf(id) === "sensor" && (String(state.attributes.device_class) === "temperature" || String(state.attributes.unit_of_measurement ?? "").includes("°"))) {
      const value = Number(state.state);
      if (Number.isFinite(value)) return value;
    }
    if (domainOf(id) === "climate") {
      const value = Number(state.attributes.current_temperature);
      if (Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

function TemperatureSparkline({ values }: { values:number[] }) {
  const points = values.length > 1 ? values : [values[0] ?? 22, values[0] ?? 22];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(.5, max - min);
  const polyline = points.map((value,index) => `${index/(points.length-1)*100},${34-(value-min)/range*24}`).join(" ");
  return <svg className="reel-sparkline" viewBox="0 0 100 40" preserveAspectRatio="none"><polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>;
}

function accessoryState(hass:Hass,id:string,language:Language) {
  const state = hass.states[id];
  const domain = domainOf(id);
  if (domain === "light" && state.state === "on") return `${Math.round(Number(state.attributes.brightness ?? 255)/255*100)}%`;
  if (domain === "cover") return `${Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0))}%`;
  if (domain === "climate") {
    const current = Number(state.attributes.current_temperature);
    const target = Number(state.attributes.temperature);
    if (Number.isFinite(current) && Number.isFinite(target)) return `${current.toFixed(1)}° → ${target.toFixed(target % 1 === 0 ? 0 : 1)}°`;
  }
  return humanState(state.state,language);
}

function humanState(value:string,language:Language) {
  const it:Record<string,string> = {on:"Acceso",off:"Spento",open:"Aperto",closed:"Chiuso",heat:"Riscaldamento",cool:"Raffrescamento",heat_cool:"Automatico",auto:"Automatico",fan_only:"Ventola",dry:"Deumidifica",playing:"In riproduzione",paused:"In pausa",idle:"In attesa",cleaning:"Pulizia",unavailable:"Non risponde",unknown:"Non disponibile",unlocked:"Sbloccata",locked:"Bloccata"};
  const en:Record<string,string> = {on:"On",off:"Off",open:"Open",closed:"Closed",heat:"Heating",cool:"Cooling",heat_cool:"Auto",auto:"Auto",fan_only:"Fan",dry:"Dry",playing:"Playing",paused:"Paused",idle:"Idle",cleaning:"Cleaning",unavailable:"No response",unknown:"Unavailable",unlocked:"Unlocked",locked:"Locked"};
  return (language === "it" ? it : en)[value] ?? value;
}

function sensorLabel(deviceClass: string, active: boolean, copy: typeof itCopy) {
  if (["motion", "occupancy", "presence"].includes(deviceClass)) return active ? copy.detected : copy.clear;
  return active ? copy.openState : copy.closedState;
}

function greetingForHour(hour:number,copy:typeof itCopy){if(hour<5)return copy.goodNight;if(hour<12)return copy.goodMorning;if(hour<18)return copy.goodAfternoon;return copy.goodEvening}
function shortName(name:string,room:string){return name.replace(new RegExp(room,"ig"),"").trim()||name}
function domainOf(id:string){return id.split(".")[0]??""}
function isActive(hass:Hass,id:string){return ACTIVE_STATES.has(hass.states[id]?.state??"")}
function average(values:number[]){return values.length?values.reduce((a,b)=>a+b,0)/values.length:0}
function locale(language:Language){return language==="it"?"it-IT":"en-GB"}
function lightColor(attributes:Record<string,unknown>){if(Array.isArray(attributes.rgb_color)&&attributes.rgb_color.length>=3){const [r,g,b]=attributes.rgb_color.map(Number);return`#${[r,g,b].map(value=>Math.max(0,Math.min(255,value)).toString(16).padStart(2,"0")).join("")}`}return String(attributes.demo_hex_color??"#ffd60a")}

const itCopy={home:"Casa",sunny:"Soleggiato",notifications:"Notifiche",armed:"Inserito",disarmed:"Disattivo",houseSays:"LA CASA TI DICE",allClear:"Tutto tranquillo",allClearDetail:"La casa sta bene",alarm:"Allarme",homeFree:"casa libera",arm:"INSERISCI",thermostat:"TERMOSTATO",manage:"GESTISCI",inside:"In casa",outside:"Fuori",waste:"RACCOLTA DIFFERENZIATA",today:"OGGI",residual:"Indifferenziata",collectionReady:"Raccolta prevista oggi",routines:"ROUTINE",batteries:"BATTERIE",sensors:"SENSORI",climate:"CLIMA",cameras:"CAMERE",media:"MEDIA",vacuum:"ASPIRAPOLVERE",car:"AUTO",covers:"TAPPARELLE",roomControls:"Accessori stanza",turnOffAll:"Spegni tutto",close:"Chiudi",goodMorning:"Buongiorno",goodAfternoon:"Buon pomeriggio",goodEvening:"Buonasera",goodNight:"Buonanotte",goodNightDetail:"Spegne le luci e prepara la casa per la notte",guestMode:"Modalità ospiti",guestDetail:"Prepara gli ambienti per gli ospiti",movieNight:"Serata film",movieDetail:"Luci soffuse e media pronti",batteryStatus:"Stato batterie",homeClimate:"Termostati di casa",noThermostat:"Nessun termostato collegato",coverControl:"Controllo tapparella",alarmReady:"Allarme pronto",alarmPinHint:"Inserisci il codice per attivare la modalità fuori casa",wallTablet:"Tablet a muro",doorSensor:"Sensore porta",motionKitchen:"Movimento cucina",remoteLiving:"Telecomando salone",lock:"Serratura",camera:"Camera",ready:"Pronto",homeBase:"Base",pause:"Pausa",play:"Riproduci",stop:"Ferma",empty:"Svuota",suction:"POTENZA ASPIRAZIONE",silent:"SILENZIOSO",normal:"NORMALE",strong:"FORTE",turbo:"TURBO",cleanRoom:"PULISCI UNA STANZA",bathroom:"Bagno",kitchen:"Cucina",bedroom:"Camera da letto",living:"Salone",study:"Studio",hall:"Ingresso",consumables:"CONSUMABILI",mainBrush:"Spazzola principale",sideBrush:"Spazzola laterale",filter:"Filtro",sensorsClean:"Sensori",washMop:"Lava mocio",emptyDust:"Svuota sporco",dryMop:"Asciuga mocio",boxAlarm:"Attiva allarme box",battery:"Batteria",range:"Autonomia",status:"Stato",parked:"Ferma",openDoors:"Porte aperte",windows:"Finestrini",closed:"Chiusi",odometer:"Chilometri",cover:"Tapparella",open:"Apri",closeCover:"Chiudi",noSensors:"Nessun sensore disponibile",detected:"Rilevato",clear:"Libero",openState:"Aperto",closedState:"Chiuso",noCameras:"Nessuna camera disponibile",online:"Connessa",unavailable:"Non disponibile",noMedia:"Nessun dispositivo multimediale disponibile",playing:"In riproduzione",volume:"Volume"};
const enCopy:typeof itCopy={home:"Home",sunny:"Sunny",notifications:"Notifications",armed:"Armed",disarmed:"Disarmed",houseSays:"HOME SAYS",allClear:"All clear",allClearDetail:"Everything at home is fine",alarm:"Alarm",homeFree:"home clear",arm:"ARM",thermostat:"THERMOSTAT",manage:"MANAGE",inside:"Inside",outside:"Outside",waste:"WASTE COLLECTION",today:"TODAY",residual:"General waste",collectionReady:"Collection scheduled today",routines:"ROUTINES",batteries:"BATTERIES",sensors:"SENSORS",climate:"CLIMATE",cameras:"CAMERAS",media:"MEDIA",vacuum:"VACUUM",car:"CAR",covers:"COVERS",roomControls:"Room accessories",turnOffAll:"Turn off all",close:"Close",goodMorning:"Good morning",goodAfternoon:"Good afternoon",goodEvening:"Good evening",goodNight:"Good night",goodNightDetail:"Turns lights off and prepares home for the night",guestMode:"Guest mode",guestDetail:"Prepares rooms for guests",movieNight:"Movie night",movieDetail:"Dim lights and media ready",batteryStatus:"Battery status",homeClimate:"Home thermostats",noThermostat:"No thermostat connected",coverControl:"Cover control",alarmReady:"Alarm ready",alarmPinHint:"Enter the code to arm away mode",wallTablet:"Wall tablet",doorSensor:"Door sensor",motionKitchen:"Kitchen motion",remoteLiving:"Living remote",lock:"Lock",camera:"Camera",ready:"Ready",homeBase:"Dock",pause:"Pause",play:"Play",stop:"Stop",empty:"Empty",suction:"SUCTION POWER",silent:"SILENT",normal:"NORMAL",strong:"STRONG",turbo:"TURBO",cleanRoom:"CLEAN A ROOM",bathroom:"Bathroom",kitchen:"Kitchen",bedroom:"Bedroom",living:"Living room",study:"Study",hall:"Hall",consumables:"CONSUMABLES",mainBrush:"Main brush",sideBrush:"Side brush",filter:"Filter",sensorsClean:"Sensors",washMop:"Wash mop",emptyDust:"Empty dust",dryMop:"Dry mop",boxAlarm:"Enable garage alarm",battery:"Battery",range:"Range",status:"Status",parked:"Parked",openDoors:"Open doors",windows:"Windows",closed:"Closed",odometer:"Odometer",cover:"Cover",open:"Open",closeCover:"Close",noSensors:"No sensors available",detected:"Detected",clear:"Clear",openState:"Open",closedState:"Closed",noCameras:"No cameras available",online:"Online",unavailable:"Unavailable",noMedia:"No media devices available",playing:"Playing",volume:"Volume"};

function iconForDomain(domain:string){if(domain==="light")return <BulbIcon/>;if(domain==="cover")return <CoverIcon/>;if(domain==="climate")return <ClimateIcon/>;if(domain==="lock")return <LockIcon/>;if(domain==="media_player")return <MediaIcon/>;if(domain==="fan")return <FanIcon/>;if(domain==="vacuum")return <VacuumIcon/>;return <PowerIcon/>}
function Svg({children}:{children:ReactNode}){return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{children}</svg>}
function RoomIcon(){return <Svg><path d="M4 11 12 4.7 20 11v8.5H14.5v-5.5h-5v5.5H4Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/></Svg>}
function PowerIcon(){return <Svg><><path d="M12 3.6v7.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M7.65 6.55a7.35 7.35 0 1 0 8.7 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></></Svg>}
function BulbIcon(){return <Svg><path d="M9.3 17.3h5.4M10.2 20h3.6M12 3.2a6.3 6.3 0 0 0-3.7 11.4c.7.5 1 1.3 1 2.2h5.4c0-.9.3-1.7 1-2.2A6.3 6.3 0 0 0 12 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
function CoverIcon(){return <Svg><><rect x="5" y="4" width="14" height="16" rx="1.7" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M5 9h14M8 12h8M8 15h8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></></Svg>}
function ClimateIcon(){return <Svg><><path d="M14.4 14.8V5.6a2.4 2.4 0 0 0-4.8 0v9.2a4.4 4.4 0 1 0 4.8 0Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/><path d="M12 8v8" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/></></Svg>}
function ThermometerIcon(){return <ClimateIcon/>}
function LockIcon(){return <Svg><path d="M7.2 10.8V8.2a4.8 4.8 0 0 1 9.6 0v2.6M6 10.8h12v9.7H6Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
function MediaIcon(){return <Svg><><rect x="4.5" y="6" width="15" height="12" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m10 9 5 3-5 3Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/></></Svg>}
function FanIcon(){return <Svg><><circle cx="12" cy="12" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M12 10.3c-1.7-4.8 1.8-6.8 4-4.8 1.3 1.2 0 4.2-4 6.5M10.5 12.8C5.8 14.7 4 11.2 6 9.1c1.3-1.3 4.3 0 6.2 3.5M13.4 13.2c2.8 4.2-.2 6.9-2.8 5.5-1.6-.9-1.2-4.2 1.5-6.7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></></Svg>}
function ShieldIcon(){return <Svg><><path d="M12 3.2 18.7 6v5c0 4.8-2.6 7.9-6.7 9.8C7.9 18.9 5.3 15.8 5.3 11V6Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/><path d="m9.2 12 1.7 1.7 3.9-3.9" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/></></Svg>}
function BellIcon(){return <Svg><path d="M6.7 16.8h10.6l-1.4-2V10a3.9 3.9 0 0 0-7.8 0v4.8ZM10.2 19h3.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
function CheckIcon(){return <Svg><><circle cx="12" cy="12" r="8.7" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m8.2 12.1 2.4 2.4 5.2-5.2" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></></Svg>}
function SunIcon(){return <Svg><><circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.45"/><path d="M12 3.3v2M12 18.7v2M3.3 12h2M18.7 12h2M5.9 5.9l1.4 1.4M16.7 16.7l1.4 1.4M18.1 5.9l-1.4 1.4M7.3 16.7l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></></Svg>}
function RecycleIcon(){return <Svg><path d="m8.2 7 1.9-3 2 3M15.9 9.1l3 1.8-3 2M9 17l-3-1.9 1.1-3" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
function TrashBinIcon(){return <Svg><><path d="M7.7 8.2h8.6l-.65 9.35a1.8 1.8 0 0 1-1.8 1.68h-3.7a1.8 1.8 0 0 1-1.8-1.68L7.7 8.2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 6.4h12M9.5 6.4V4.8h5v1.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></></Svg>}
function SparklesIcon(){return <Svg><path d="m12 3.4 1.4 4.1 4.2 1.4-4.2 1.4-1.4 4.1-1.4-4.1-4.2-1.4 4.2-1.4ZM18.2 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/></Svg>}
function BatteryIcon(){return <Svg><><rect x="4.3" y="7.2" width="14.6" height="9.6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.45"/><path d="M20 10.1v3.8M7.2 10.1h6.7v3.8H7.2Z" fill="none" stroke="currentColor" strokeWidth="1.45"/></></Svg>}
function RadarIcon(){return <Svg><><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M12 12 17.8 7.3" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></></Svg>}
function CameraIcon(){return <Svg><><rect x="4.3" y="7" width="11.7" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.45"/><path d="m16 10 4-2v8l-4-2Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/></></Svg>}
function VacuumIcon(){return <Svg><><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.45"/><path d="M8.5 12h7M10 16h4M9 8.3h.1M15 8.3h.1" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></></Svg>}
function CarIcon(){return <Svg><><path d="m5.2 14.8 1.4-4.7h10.8l1.4 4.7M4.2 14.8h15.6v3.9H4.2Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/><circle cx="7.2" cy="18.7" r="1.35" fill="none" stroke="currentColor" strokeWidth="1.4"/><circle cx="16.8" cy="18.7" r="1.35" fill="none" stroke="currentColor" strokeWidth="1.4"/></></Svg>}
function UsersIcon(){return <Svg><><circle cx="9" cy="9" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.45"/><circle cx="16" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.45"/><path d="M4.3 19c.5-3 2-4.8 4.7-4.8s4.2 1.8 4.7 4.8M14 15.1c2.4 0 3.8 1.5 4.3 3.9" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></></Svg>}
function MoonIcon(){return <Svg><path d="M18.8 15.4A7.8 7.8 0 0 1 8.6 5.2a7.8 7.8 0 1 0 10.2 10.2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></Svg>}
function ChevronIcon(){return <Svg><path d="m9.4 6.5 5.5 5.5-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
function StarIcon(){return <Svg><path d="m12 3.4 2.58 5.23 5.77.84-4.18 4.07.99 5.75L12 16.57l-5.16 2.72.99-5.75-4.18-4.07 5.77-.84Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/></Svg>}
function CloseIcon(){return <Svg><path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></Svg>}
function BackspaceIcon(){return <Svg><><path d="m10 7-4 5 4 5h9V7Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/><path d="m13 10 4 4M17 10l-4 4" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></></Svg>}
function MotionIcon(){return <Svg><><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1.45"/><path d="M8.4 8.5a5 5 0 0 0 0 7M5.8 6a8.5 8.5 0 0 0 0 12M15.6 8.5a5 5 0 0 1 0 7M18.2 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/></></Svg>}
function DoorIcon(){return <Svg><><path d="M7 4h10v16H7Z" fill="none" stroke="currentColor" strokeWidth="1.45"/><circle cx="14.2" cy="12" r=".7" fill="currentColor" stroke="none"/></></Svg>}
function PlayIcon(){return <Svg><path d="m9 7 8 5-8 5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></Svg>}
function PauseIcon(){return <Svg><path d="M9 7v10M15 7v10" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"/></Svg>}
function StopIcon(){return <Svg><rect x="8" y="8" width="8" height="8" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.45"/></Svg>}
function DockIcon(){return <Svg><><path d="M5 18h14M7 18V9l5-4 5 4v9" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 18v-5h4v5" fill="none" stroke="currentColor" strokeWidth="1.45"/></></Svg>}
function EmptyIcon(){return <Svg><><path d="M7.7 8.2h8.6l-.65 9.35a1.8 1.8 0 0 1-1.8 1.68h-3.7a1.8 1.8 0 0 1-1.8-1.68L7.7 8.2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 6.4h12M9.5 6.4V4.8h5v1.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></></Svg>}
function ChevronUpIcon(){return <Svg><path d="m7 14 5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
function ChevronDownIcon(){return <Svg><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
