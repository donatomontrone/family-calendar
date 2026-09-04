import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
const ACTIVE_STATES = new Set(["on", "open", "heat", "cool", "playing", "unlocked", "cleaning"]);
type Overlay = "alarm" | "routines" | "batteries" | "climate" | "vacuum" | "car" | "cover" | null;

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
    return { area, allIds, entityIds, temperature: findTemperature(hass, allIds), activeCount: entityIds.filter((id) => isActive(hass, id)).length, accent: accentOrder[index % accentOrder.length] };
  }), [areas, entities, hass]);

  const allActionable = useMemo(() => rooms.flatMap((room) => room.entityIds), [rooms]);
  const favoriteEntities = useMemo(() => favorites.filter((id) => hass.states[id] && ACTIONABLE_DOMAINS.has(domainOf(id))), [favorites, hass.states]);
  const selected = selectedRoom ? rooms.find((room) => room.area.area_id === selectedRoom) ?? null : null;
  const temperatures = rooms.map((room, i) => room.temperature ?? (demo ? 29 + i * .5 : undefined));
  const knownTemperatures = temperatures.filter((v): v is number => typeof v === "number");
  const alarm = Object.values(hass.states).find((state) => state.entity_id.startsWith("alarm_control_panel."));
  const weather = Object.values(hass.states).find((state) => state.entity_id.startsWith("weather."));
  const outside = Number(weather?.attributes.temperature ?? 31.3);

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
        <div className="reel-greeting"><strong>{greetingForHour(now.getHours(), copy)}</strong><span>{now.toLocaleDateString(locale(language), { weekday: "long", day: "numeric", month: "long" })}</span></div>
        <div className="reel-clock">{now.toLocaleTimeString(locale(language), { hour: "2-digit", minute: "2-digit" })}</div>
        <div className="reel-top-actions">
          <span className="weather-pill">☀︎ <strong>{outside.toFixed(1)}°</strong><small>{copy.sunny}</small></span>
          <span className="avatar-stack"><i>G</i><i>A</i></span>
          <button className="security-pill" onClick={() => setOverlay("alarm")}><ShieldIcon /><span>{alarm && alarm.state !== "disarmed" ? copy.armed : copy.disarmed}</span></button>
          <button className="round-top" aria-label={copy.notifications}><BellIcon /></button>
        </div>
      </header>

      {favoriteEntities.length > 0 && (
        <section className="reel-favorites">
          <div className="reel-section-heading"><strong>{copy.favoriteAccessories}</strong><span>{favoriteEntities.length}</span></div>
          <div className="reel-favorites-rail">
            {favoriteEntities.map((entityId) => <AccessoryTile key={entityId} hass={hass} entityId={entityId} language={language} favorite onToggleFavorite={() => void toggleFavorite(entityId)} />)}
          </div>
        </section>
      )}

      <div className="reel-dashboard">
        <div className="reel-room-grid">
          {rooms.map((room) => <RoomCard key={room.area.area_id} hass={hass} room={room} language={language} onOpen={() => setSelectedRoom(room.area.area_id)} onQuickDetail={(kind) => setOverlay(kind)} />)}
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
            <div className="side-heading"><span><ThermometerIcon /> {copy.thermostat}</span><b>− &nbsp; ··· &nbsp; +</b></div>
            <TemperatureSparkline values={knownTemperatures.length ? knownTemperatures : [29.9, 30.3, 30.0, 31.2, 31.7, 31.4, 32.5]} />
            <div className="thermo-meta"><span>{copy.inside} <strong>{average(knownTemperatures.length ? knownTemperatures : [29.9]).toFixed(1)}°</strong></span><span>{copy.outside} <strong>{outside.toFixed(1)}°</strong></span></div>
          </button>

          <section className="reel-side-card waste-card">
            <div className="side-heading"><span><RecycleIcon /> {copy.waste}</span><b>{copy.today}</b></div>
            <div className="waste-value"><span className="side-icon mint"><TrashBinIcon /></span><div><strong>{copy.residual}</strong><small>{copy.collectionReady}</small></div></div>
          </section>

          <div className="reel-tools-grid">
            <ToolButton icon={<SparklesIcon />} label={copy.routines} onClick={() => setOverlay("routines")} />
            <ToolButton icon={<BatteryIcon />} label={copy.batteries} onClick={() => setOverlay("batteries")} />
            <ToolButton icon={<RadarIcon />} label={copy.sensors} />
            <ToolButton icon={<ClimateIcon />} label={copy.climate} onClick={() => setOverlay("climate")} />
            <ToolButton icon={<CameraIcon />} label={copy.cameras} />
            <ToolButton icon={<MediaIcon />} label={copy.media} />
            <ToolButton icon={<VacuumIcon />} label={copy.vacuum} onClick={() => setOverlay("vacuum")} />
            <ToolButton icon={<CarIcon />} label={copy.car} onClick={() => setOverlay("car")} />
            <ToolButton icon={<CoverIcon />} label={copy.covers} onClick={() => setOverlay("cover")} />
          </div>
        </aside>
      </div>

      {selected && <RoomSheet hass={hass} room={selected} language={language} favorites={favorites} onToggleFavorite={toggleFavorite} onClose={() => setSelectedRoom(null)} />}
      {overlay && <ReelOverlay kind={overlay} hass={hass} language={language} rooms={rooms} onClose={() => setOverlay(null)} onRunScene={runScene} onAllOff={() => void deactivateEntities(hass, allActionable)} />}
    </section>
  );
}

function RoomCard({ hass, room, language, onOpen, onQuickDetail }: { hass: Hass; room: RoomModel; language: Language; onOpen: () => void; onQuickDetail: (kind: Overlay) => void }) {
  const quick = room.entityIds.slice(0, 3);
  const accessories = room.entityIds.slice(0, 5);
  const temp = room.temperature;
  return <article className={`reel-room room-${room.accent}`}>
    <button className="reel-room-head" onClick={onOpen}><span><RoomIcon /><strong>{room.area.name}</strong></span><b>{typeof temp === "number" ? `${temp.toFixed(1)}°` : "—"}</b></button>
    <div className="room-scene-row">{quick.map((id) => <button key={id} className={isActive(hass, id) ? "active" : ""} onClick={() => void activateEntity(hass, id)}><span>{iconForDomain(domainOf(id))}</span><small>{shortName(displayName(hass, id), room.area.name)}</small></button>)}</div>
    <div className="room-level"><i style={{ width: `${room.entityIds.length ? Math.max(5, room.activeCount / room.entityIds.length * 100) : 5}%` }} /></div>
    <div className="room-accessory-row">{accessories.map((id) => <button key={id} className={isActive(hass, id) ? "active" : ""} onClick={() => domainOf(id) === "cover" ? onQuickDetail("cover") : void activateEntity(hass, id)}>{iconForDomain(domainOf(id))}<span>{shortName(displayName(hass, id), room.area.name)}</span></button>)}</div>
    <button className="room-open-detail" onClick={onOpen}>{language === "it" ? "Dettagli" : "Details"}<ChevronIcon /></button>
  </article>;
}

function RoomSheet({ hass, room, language, favorites, onToggleFavorite, onClose }: { hass: Hass; room: RoomModel; language: Language; favorites: string[]; onToggleFavorite: (id: string) => Promise<void>; onClose: () => void }) {
  const copy = language === "it" ? itCopy : enCopy;
  return <div className="reel-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="reel-modal room-modal">
      <div className="modal-head"><div><span className="reel-kicker">{copy.roomControls}</span><h2>{room.area.name}</h2></div><div><button className="modal-danger" onClick={() => void deactivateEntities(hass, room.entityIds)}><PowerIcon />{copy.turnOffAll}</button><button className="modal-close" onClick={onClose}>×</button></div></div>
      <div className="room-modal-grid">{room.entityIds.map((id) => <AccessoryTile key={id} hass={hass} entityId={id} language={language} favorite={favorites.includes(id)} detailed onToggleFavorite={() => void onToggleFavorite(id)} />)}</div>
    </section>
  </div>;
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
  return <article className={`apple-accessory-tile ${active ? "active" : ""} ${unavailable ? "unavailable" : ""} ${detailed ? "detailed" : ""}`} style={style}>
    <button className="apple-accessory-main" onClick={() => !unavailable && void activateEntity(hass, entityId)} disabled={unavailable}><span className="apple-accessory-icon">{iconForDomain(domain)}</span><span className="apple-accessory-copy"><strong>{displayName(hass, entityId)}</strong><small className={unavailable ? "danger" : ""}>{unavailable ? (language === "it" ? "Non risponde" : "No response") : accessoryState(hass, entityId, language)}</small></span></button>
    <button className={`apple-favorite-toggle ${favorite ? "selected" : ""}`} onClick={onToggleFavorite} aria-label={favoriteLabel} title={favoriteLabel}><StarIcon /></button>
    {unavailable && <span className="apple-accessory-warning">!</span>}
    {detailed && !unavailable && domain === "light" && <><label className="sheet-slider"><span>{language === "it" ? "Intensità" : "Brightness"}<strong>{brightness}%</strong></span><input type="range" min="1" max="100" defaultValue={brightness} onChange={(e) => void setLightBrightness(hass, entityId, Number(e.target.value))} /></label><label className="sheet-color"><span>{language === "it" ? "Colore" : "Color"}</span><input type="color" defaultValue={color} onChange={(e) => void setLightColor(hass, entityId, e.target.value)} /></label></>}
    {detailed && !unavailable && domain === "cover" && <label className="sheet-slider"><span>{language === "it" ? "Posizione" : "Position"}<strong>{position}%</strong></span><input type="range" min="0" max="100" defaultValue={position} onChange={(e) => void setCoverPosition(hass, entityId, Number(e.target.value))} /></label>}
  </article>;
}

function ReelOverlay({ kind, hass, language, rooms, onClose, onRunScene, onAllOff }: { kind: Exclude<Overlay, null>; hass: Hass; language: Language; rooms: RoomModel[]; onClose: () => void; onRunScene: (name: "night" | "guest" | "movie") => Promise<void>; onAllOff: () => void }) {
  const c = language === "it" ? itCopy : enCopy;
  return <div className="reel-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}><section className={`reel-modal feature-modal ${kind}-modal`}>
    <div className="modal-head"><div><span className="reel-kicker">{c.home}</span><h2>{overlayTitle(kind, c)}</h2></div><button className="modal-close" onClick={onClose}>×</button></div>
    {kind === "alarm" && <AlarmPanel hass={hass} language={language} />}
    {kind === "routines" && <div className="routine-list"><RoutineRow icon={<MoonIcon />} title={c.goodNight} detail={c.goodNightDetail} onClick={() => void onRunScene("night")} /><RoutineRow icon={<UsersIcon />} title={c.guestMode} detail={c.guestDetail} onClick={() => void onRunScene("guest")} /><RoutineRow icon={<MediaIcon />} title={c.movieNight} detail={c.movieDetail} onClick={() => void onRunScene("movie")} /><button className="routine-all-off" onClick={onAllOff}><PowerIcon />{c.turnOffAll}</button></div>}
    {kind === "batteries" && <BatteryPanel language={language} />}
    {kind === "climate" && <ClimatePanel rooms={rooms} language={language} hass={hass} />}
    {kind === "vacuum" && <VacuumPanel language={language} />}
    {kind === "car" && <CarPanel language={language} />}
    {kind === "cover" && <CoverPanel hass={hass} language={language} />}
  </section></div>;
}

function AlarmPanel({ hass, language }: { hass: Hass; language: Language }) {
  const c = language === "it" ? itCopy : enCopy; const [pin, setPin] = useState("");
  const alarm = Object.keys(hass.states).find((id) => id.startsWith("alarm_control_panel."));
  return <div className="alarm-panel"><div className="alarm-shield"><ShieldIcon /></div><strong>{c.alarmReady}</strong><small>{c.alarmPinHint}</small><div className="pin-dots">{[0,1,2,3].map((i) => <i key={i} className={i < pin.length ? "filled" : ""} />)}</div><div className="pin-grid">{[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((key, i) => <button key={i} disabled={key === ""} onClick={() => { if (key === "⌫") setPin(pin.slice(0,-1)); else if (pin.length < 4) setPin(pin + key); }}>{key}</button>)}</div><button className="primary-action" disabled={pin.length < 4 || !alarm} onClick={() => alarm && void hass.callService("alarm_control_panel", "alarm_arm_away", { entity_id: alarm, code: pin })}>{c.arm}</button></div>;
}

function BatteryPanel({ language }: { language: Language }) { const c = language === "it" ? itCopy : enCopy; const rows = [[c.wallTablet,48],[c.doorSensor,60],[c.motionKitchen,70],[c.remoteLiving,73],[c.vacuum,98],[c.lock,100],[c.camera,100],[c.thermostat,92]] as [string,number][]; return <div className="battery-grid">{rows.map(([name,value]) => <div className="battery-item" key={name}><span>{name}</span><strong>{value}%</strong><div><i style={{ width: `${value}%` }} /></div></div>)}</div>; }

function ClimatePanel({ rooms, language, hass }: { rooms: RoomModel[]; language: Language; hass: Hass }) { const c = language === "it" ? itCopy : enCopy; return <div className="climate-grid">{rooms.map((room, i) => <article key={room.area.area_id}><div><strong>{room.area.name}</strong><b>{(room.temperature ?? 26 + i).toFixed(1)}°</b></div><div className="climate-modes"><span>❄︎ {c.cool}</span><span>☼ {c.heat}</span><span>◌ {c.fan}</span><span>AUTO</span></div><input type="range" min="16" max="30" defaultValue={Math.min(30, room.temperature ?? 24)} onChange={(e) => { const climate = room.entityIds.find((id) => domainOf(id) === "climate"); if (climate) void hass.callService("climate", "set_temperature", { entity_id: climate, temperature: Number(e.target.value) }); }} /></article>)}</div>; }

function VacuumPanel({ language }: { language: Language }) { const c = language === "it" ? itCopy : enCopy; const rooms = [c.bathroom,c.kitchen,c.bedroom,c.living,c.study,c.hall]; const consumables = [[c.mainBrush,98],[c.sideBrush,99],[c.filter,84],[c.sensorsClean,83]] as [string,number][]; return <div className="vacuum-panel"><div className="vacuum-hero"><div className="vacuum-disc"><VacuumIcon /></div><div><strong>Dreame</strong><span>100% · {c.ready}</span></div></div><div className="vacuum-actions"><button>⌂<span>{c.homeBase}</span></button><button>Ⅱ<span>{c.pause}</span></button><button>■<span>{c.stop}</span></button><button>▣<span>{c.empty}</span></button></div><h3>{c.suction}</h3><div className="mode-segment"><button>{c.silent}</button><button className="active">{c.normal}</button><button>{c.strong}</button><button>{c.turbo}</button></div><h3>{c.cleanRoom}</h3><div className="vacuum-rooms">{rooms.map((r,i) => <button key={r} className={i===1 ? "active" : ""}>{r}</button>)}</div><h3>{c.consumables}</h3><div className="consumables">{consumables.map(([n,v]) => <div key={n}><span>{n}<strong>{v}%</strong></span><i><b style={{width:`${v}%`}} /></i></div>)}</div><div className="vacuum-footer"><button>{c.washMop}</button><button>{c.emptyDust}</button><button>{c.dryMop}</button></div></div>; }

function CarPanel({ language }: { language: Language }) { const c = language === "it" ? itCopy : enCopy; return <div className="car-panel"><div className="car-visual"><CarIcon /><div className="car-wheels"><i/><i/></div></div><div className="car-title"><strong>Leapmotor T03</strong><span>● {c.boxAlarm}</span></div><div className="car-stats"><Stat value="57%" label={c.battery}/><Stat value="176 km" label={c.range}/><Stat value={c.parked} label={c.status}/><Stat value="0" label={c.openDoors}/><Stat value={c.closed} label={c.windows}/><Stat value="786 km" label={c.odometer}/></div></div>; }

function CoverPanel({ hass, language }: { hass: Hass; language: Language }) { const c = language === "it" ? itCopy : enCopy; const cover = Object.keys(hass.states).find((id) => id.startsWith("cover.")); const state = cover ? hass.states[cover] : undefined; const value = Number(state?.attributes.current_position ?? 100); return <div className="cover-panel"><div className="cover-icon"><CoverIcon /></div><strong>{cover ? displayName(hass, cover) : c.cover}</strong><b>{value}%</b><input type="range" min="0" max="100" defaultValue={value} onChange={(e) => cover && void setCoverPosition(hass, cover, Number(e.target.value))}/><div><button onClick={() => cover && void hass.callService("cover","open_cover",{entity_id:cover})}>⌃</button><button onClick={() => cover && void hass.callService("cover","stop_cover",{entity_id:cover})}>■</button><button onClick={() => cover && void hass.callService("cover","close_cover",{entity_id:cover})}>⌄</button></div></div>; }

function ToolButton({ icon, label, onClick }: { icon: JSX.Element; label: string; onClick?: () => void }) { return <button onClick={onClick}>{icon}<span>{label}</span></button>; }
function RoutineRow({ icon, title, detail, onClick }: { icon: JSX.Element; title: string; detail: string; onClick: () => void }) { return <button onClick={onClick}><span>{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><ChevronIcon /></button>; }
function Stat({ value, label }: { value: string; label: string }) { return <div><strong>{value}</strong><span>{label}</span></div>; }
function overlayTitle(kind: Exclude<Overlay,null>, c: typeof itCopy) { return ({ alarm:c.alarm, routines:c.routines, batteries:c.batteryStatus, climate:c.homeClimate, vacuum:"Dreame", car:"Leapmotor T03", cover:c.coverControl })[kind]; }
function findTemperature(hass: Hass, ids: string[]) { for (const id of ids) { const s=hass.states[id]; if (!s) continue; if (domainOf(id)==="sensor" && (String(s.attributes.device_class)==="temperature" || String(s.attributes.unit_of_measurement??"").includes("°"))) { const v=Number(s.state); if (Number.isFinite(v)) return v; } if (domainOf(id)==="climate") { const v=Number(s.attributes.current_temperature); if (Number.isFinite(v)) return v; } } return undefined; }
function TemperatureSparkline({ values }: { values:number[] }) { const p=values.length>1?values:[values[0]??29,values[0]??29]; const min=Math.min(...p), max=Math.max(...p), range=Math.max(.5,max-min); const pts=p.map((v,i)=>`${i/(p.length-1)*100},${34-(v-min)/range*24}`).join(" "); return <svg className="reel-sparkline" viewBox="0 0 100 40" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>; }
function accessoryState(hass:Hass,id:string,language:Language){const s=hass.states[id],d=domainOf(id);if(d==="light"&&s.state==="on")return`${Math.round(Number(s.attributes.brightness??255)/255*100)}%`;if(d==="cover")return`${Number(s.attributes.current_position??(s.state==="open"?100:0))}%`;return humanState(s.state,language)}
function humanState(v:string,l:Language){const it:Record<string,string>={on:"Acceso",off:"Spento",open:"Aperto",closed:"Chiuso",heat:"Riscaldamento",cool:"Raffrescamento",playing:"In riproduzione",cleaning:"Pulizia",unavailable:"Non risponde",unknown:"Non disponibile",unlocked:"Sbloccata",locked:"Bloccata"};const en:Record<string,string>={on:"On",off:"Off",open:"Open",closed:"Closed",heat:"Heating",cool:"Cooling",playing:"Playing",cleaning:"Cleaning",unavailable:"No response",unknown:"Unavailable",unlocked:"Unlocked",locked:"Locked"};return(l==="it"?it:en)[v]??v}
function greetingForHour(h:number,c:typeof itCopy){if(h<5)return c.goodNight;if(h<12)return c.goodMorning;if(h<18)return c.goodAfternoon;return c.goodEvening}
function shortName(name:string,room:string){return name.replace(new RegExp(room,"ig"),"").trim()||name}
function domainOf(id:string){return id.split(".")[0]??""} function isActive(h:Hass,id:string){return ACTIVE_STATES.has(h.states[id]?.state??"")} function average(v:number[]){return v.length?v.reduce((a,b)=>a+b,0)/v.length:0} function locale(l:Language){return l==="it"?"it-IT":"en-GB"}
function lightColor(attrs:Record<string,unknown>){if(Array.isArray(attrs.rgb_color)&&attrs.rgb_color.length>=3){const [r,g,b]=attrs.rgb_color.map(Number);return`#${[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,"0")).join("")}`}return String(attrs.demo_hex_color??"#ffd60a")}

const itCopy={home:"Casa",sunny:"Soleggiato",notifications:"Notifiche",armed:"Inserito",disarmed:"Disattivo",favoriteAccessories:"Accessori preferiti",houseSays:"LA CASA TI DICE",allClear:"Tutto tranquillo",allClearDetail:"La casa sta bene",alarm:"Allarme",homeFree:"casa libera",arm:"INSERISCI",thermostat:"TERMOSTATO",inside:"In casa",outside:"Fuori",waste:"RACCOLTA DIFFERENZIATA",today:"OGGI",residual:"Indifferenziata",collectionReady:"Raccolta prevista oggi",routines:"ROUTINE",batteries:"BATTERIE",sensors:"SENSORI",climate:"CLIMA",cameras:"CAMERE",media:"MEDIA",vacuum:"ASPIRAPOLVERE",car:"AUTO",covers:"TAPPARELLE",roomControls:"Accessori stanza",turnOffAll:"Spegni tutto",goodMorning:"Buongiorno",goodAfternoon:"Buon pomeriggio",goodEvening:"Buonasera",goodNight:"Buonanotte",goodNightDetail:"Spegne le luci e prepara la casa per la notte",guestMode:"Modalità ospiti",guestDetail:"Prepara gli ambienti per gli ospiti",movieNight:"Serata film",movieDetail:"Luci soffuse e media pronti",batteryStatus:"Stato batterie",homeClimate:"Termostati di casa",coverControl:"Controllo tapparella",alarmReady:"Allarme pronto",alarmPinHint:"Inserisci il codice per attivare la modalità fuori casa",wallTablet:"Tablet a muro",doorSensor:"Sensore porta",motionKitchen:"Movimento cucina",remoteLiving:"Telecomando salone",lock:"Serratura",camera:"Camera",cool:"FREDDO",heat:"CALDO",fan:"VENTOLA",ready:"Pronto",homeBase:"Base",pause:"Pausa",stop:"Stop",empty:"Svuota",suction:"POTENZA ASPIRAZIONE",silent:"SILENZIOSO",normal:"NORMALE",strong:"FORTE",turbo:"TURBO",cleanRoom:"PULISCI UNA STANZA",bathroom:"Bagno",kitchen:"Cucina",bedroom:"Camera da letto",living:"Salone",study:"Studio",hall:"Ingresso",consumables:"CONSUMABILI",mainBrush:"Spazzola principale",sideBrush:"Spazzola laterale",filter:"Filtro",sensorsClean:"Sensori",washMop:"Lava mocio",emptyDust:"Svuota sporco",dryMop:"Asciuga mocio",boxAlarm:"Attiva allarme box",battery:"Batteria",range:"Autonomia",status:"Stato",parked:"Ferma",openDoors:"Porte aperte",windows:"Finestrini",closed:"Chiusi",odometer:"Chilometri",cover:"Tapparella"};
const enCopy:typeof itCopy={home:"Home",sunny:"Sunny",notifications:"Notifications",armed:"Armed",disarmed:"Disarmed",favoriteAccessories:"Favorite accessories",houseSays:"HOME SAYS",allClear:"All clear",allClearDetail:"Everything at home is fine",alarm:"Alarm",homeFree:"home clear",arm:"ARM",thermostat:"THERMOSTAT",inside:"Inside",outside:"Outside",waste:"WASTE COLLECTION",today:"TODAY",residual:"General waste",collectionReady:"Collection scheduled today",routines:"ROUTINES",batteries:"BATTERIES",sensors:"SENSORS",climate:"CLIMATE",cameras:"CAMERAS",media:"MEDIA",vacuum:"VACUUM",car:"CAR",covers:"COVERS",roomControls:"Room accessories",turnOffAll:"Turn off all",goodMorning:"Good morning",goodAfternoon:"Good afternoon",goodEvening:"Good evening",goodNight:"Good night",goodNightDetail:"Turns lights off and prepares home for the night",guestMode:"Guest mode",guestDetail:"Prepares rooms for guests",movieNight:"Movie night",movieDetail:"Dim lights and media ready",batteryStatus:"Battery status",homeClimate:"Home thermostats",coverControl:"Cover control",alarmReady:"Alarm ready",alarmPinHint:"Enter the code to arm away mode",wallTablet:"Wall tablet",doorSensor:"Door sensor",motionKitchen:"Kitchen motion",remoteLiving:"Living remote",lock:"Lock",camera:"Camera",cool:"COOL",heat:"HEAT",fan:"FAN",ready:"Ready",homeBase:"Dock",pause:"Pause",stop:"Stop",empty:"Empty",suction:"SUCTION POWER",silent:"SILENT",normal:"NORMAL",strong:"STRONG",turbo:"TURBO",cleanRoom:"CLEAN A ROOM",bathroom:"Bathroom",kitchen:"Kitchen",bedroom:"Bedroom",living:"Living room",study:"Study",hall:"Hall",consumables:"CONSUMABLES",mainBrush:"Main brush",sideBrush:"Side brush",filter:"Filter",sensorsClean:"Sensors",washMop:"Wash mop",emptyDust:"Empty dust",dryMop:"Dry mop",boxAlarm:"Enable garage alarm",battery:"Battery",range:"Range",status:"Status",parked:"Parked",openDoors:"Open doors",windows:"Windows",closed:"Closed",odometer:"Odometer",cover:"Cover"};

function iconForDomain(d:string){if(d==="light")return <BulbIcon/>;if(d==="cover")return <CoverIcon/>;if(d==="climate")return <ClimateIcon/>;if(d==="lock")return <LockIcon/>;if(d==="media_player")return <MediaIcon/>;if(d==="fan")return <FanIcon/>;if(d==="vacuum")return <VacuumIcon/>;return <PowerIcon/>}
function Svg({children}: {children: JSX.Element|JSX.Element[]}){return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>}
function RoomIcon(){return <Svg><path d="M4 11 12 4.7 20 11v8.5H14.5v-5.5h-5v5.5H4Z" fill="none" stroke="currentColor" strokeWidth="1.6"/></Svg>}
function PowerIcon(){return <Svg><path d="M12 3v9M7.2 5.9a8 8 0 1 0 9.6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>}
function BulbIcon(){return <Svg><path d="M9.2 17.5h5.6M10 20h4M12 3a6.5 6.5 0 0 0-3.8 11.8c.7.5 1 1.3 1 2.2h5.6c0-.9.3-1.7 1-2.2A6.5 6.5 0 0 0 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6"/></Svg>}
function CoverIcon(){return <Svg><><rect x="5" y="4" width="14" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M6 9h12M8 12h8M8 15h8" stroke="currentColor" strokeWidth="1.4"/></></Svg>}
function ClimateIcon(){return <Svg><><path d="M14.5 14.9V5.5a2.5 2.5 0 0 0-5 0v9.4a4.5 4.5 0 1 0 5 0Z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v8" stroke="currentColor" strokeWidth="1.6"/></></Svg>}
function ThermometerIcon(){return <ClimateIcon/>} function LockIcon(){return <Svg><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6Z" fill="none" stroke="currentColor" strokeWidth="1.6"/></Svg>}
function MediaIcon(){return <Svg><><rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/></></Svg>}
function FanIcon(){return <Svg><><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 10c-2-5 2-7 4-5 1.5 1.7-.3 5-4 7M10 13c-5 2-7-2-5-4 2-1.5 5 .2 7 4M14 13c3 4.5-.5 7-3 5.7-2-1-1-5 1-7" fill="none" stroke="currentColor" strokeWidth="1.3"/></></Svg>}
function ShieldIcon(){return <Svg><><path d="M12 3 19 6v5c0 5-2.8 8-7 10-4.2-2-7-5-7-10V6Z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6"/></></Svg>}
function BellIcon(){return <Svg><path d="M6.5 17h11l-1.5-2V10a4 4 0 0 0-8 0v5ZM10 19h4" fill="none" stroke="currentColor" strokeWidth="1.6"/></Svg>}
function CheckIcon(){return <Svg><><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m8 12 2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="1.6"/></></Svg>}
function RecycleIcon(){return <Svg><path d="m8 7 2-3 2 3M16 9l3 2-3 2M9 17l-3-2 1-3" fill="none" stroke="currentColor" strokeWidth="1.5"/></Svg>}
function TrashBinIcon(){return <Svg><><path d="M7 8h10l-1 12H8Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M9 8V5h6v3M5 8h14" stroke="currentColor" strokeWidth="1.5"/></></Svg>}
function SparklesIcon(){return <Svg><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Zm6 11 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z" fill="currentColor"/></Svg>}
function BatteryIcon(){return <Svg><><rect x="4" y="7" width="15" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M20 10v4M7 10h7v4H7Z" fill="currentColor"/></></Svg>}
function RadarIcon(){return <Svg><><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M12 12 18 7" stroke="currentColor" strokeWidth="1.5"/></></Svg>}
function CameraIcon(){return <Svg><><rect x="4" y="7" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m16 10 4-2v8l-4-2Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></></Svg>}
function VacuumIcon(){return <Svg><><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 12h8M10 16h4M9 8h.1M15 8h.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></></Svg>}
function CarIcon(){return <Svg><><path d="m5 15 1.5-5h11L19 15M4 15h16v4H4Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="7" cy="19" r="1.5" fill="currentColor"/><circle cx="17" cy="19" r="1.5" fill="currentColor"/></></Svg>}
function UsersIcon(){return <Svg><><circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="16" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M4 19c.5-3 2-5 5-5s4.5 2 5 5M14 15c2.5 0 4 1.5 4.5 4" fill="none" stroke="currentColor" strokeWidth="1.5"/></></Svg>}
function MoonIcon(){return <Svg><path d="M19 15.5A8 8 0 0 1 8.5 5 8 8 0 1 0 19 15.5Z" fill="none" stroke="currentColor" strokeWidth="1.6"/></Svg>}
function ChevronIcon(){return <Svg><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8"/></Svg>}
function StarIcon(){return <Svg><path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9Z" fill="currentColor"/></Svg>}
