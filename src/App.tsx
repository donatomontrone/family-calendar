import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import HomeView from "./HomeView";
import ClimateControl from "./ClimateControl";
import type { Area, EntityRegistryEntry, Hass } from "./types";
import {
  activateEntity,
  deactivateEntities,
  displayName,
  getAreas,
  getEntityRegistry,
  getFavorites,
  setCoverPosition,
  setFavorites,
  setLightBrightness,
  setLightColor,
} from "./ha";
import { getLanguage, t, type Language } from "./i18n";

type Mode = "todo" | "shopping";
type Page = "calendar" | "home";
type Task = { id: number; label: string; done: boolean };
type DemoEvent = {
  startDate: string;
  endDate?: string;
  time?: string;
  title: string;
  tone?: "mint" | "blue" | "amber" | "violet";
};

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
const isDateInsideEvent = (key: string, event: DemoEvent) => key >= event.startDate && key <= (event.endDate ?? event.startDate);
const localeFor = (language: Language) => language === "it" ? "it-IT" : "en-GB";

function buildDemoEvents(today: Date, language: Language): DemoEvent[] {
  if (language === "it") {
    return [
      { startDate: dateKey(today), time: "10:30", title: "Call progetto", tone: "mint" },
      { startDate: dateKey(today), time: "17:00", title: "Palestra", tone: "blue" },
      { startDate: dateKey(addDays(today, 2)), endDate: dateKey(addDays(today, 4)), title: "Weekend in Toscana", tone: "violet" },
      { startDate: dateKey(addDays(today, 6)), time: "20:30", title: "Cena in famiglia", tone: "amber" },
      { startDate: dateKey(addDays(today, 9)), endDate: dateKey(addDays(today, 11)), title: "Trasferta Milano", tone: "blue" },
    ];
  }

  return [
    { startDate: dateKey(today), time: "10:30", title: "Project call", tone: "mint" },
    { startDate: dateKey(today), time: "17:00", title: "Gym", tone: "blue" },
    { startDate: dateKey(addDays(today, 2)), endDate: dateKey(addDays(today, 4)), title: "Weekend away", tone: "violet" },
    { startDate: dateKey(addDays(today, 6)), time: "20:30", title: "Family dinner", tone: "amber" },
    { startDate: dateKey(addDays(today, 9)), endDate: dateKey(addDays(today, 11)), title: "Business trip", tone: "blue" },
  ];
}

function buildDemoTodo(language: Language): Task[] {
  return language === "it"
    ? [
        { id: 1, label: "Comprare il latte", done: false },
        { id: 2, label: "Chiamare Marco", done: false },
        { id: 3, label: "Ritirare il pacco", done: true },
      ]
    : [
        { id: 1, label: "Buy milk", done: false },
        { id: 2, label: "Call Mark", done: false },
        { id: 3, label: "Pick up the parcel", done: true },
      ];
}

function buildDemoShopping(language: Language): Task[] {
  return language === "it"
    ? [
        { id: 1, label: "Latte", done: false },
        { id: 2, label: "Pane", done: false },
        { id: 3, label: "Pomodori", done: false },
        { id: 4, label: "Caffè", done: true },
      ]
    : [
        { id: 1, label: "Milk", done: false },
        { id: 2, label: "Bread", done: false },
        { id: 3, label: "Tomatoes", done: false },
        { id: 4, label: "Coffee", done: true },
      ];
}

export default function App({ hass, demo = false }: { hass: Hass; demo?: boolean }) {
  const language = getLanguage(hass);
  const [page, setPage] = useState<Page>("calendar");
  const [areas, setAreas] = useState<Area[]>([]);
  const [entities, setEntities] = useState<EntityRegistryEntry[]>([]);
  const [favorites, setFavoriteIds] = useState<string[]>([]);
  const [room, setRoom] = useState("__favorites");
  const [mode, setMode] = useState<Mode>("todo");
  const [now, setNow] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [todo, setTodo] = useState<Task[]>(() => buildDemoTodo(language));
  const [shopping, setShopping] = useState<Task[]>(() => buildDemoShopping(language));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getAreas(hass), getEntityRegistry(hass), getFavorites(hass)])
      .then(([areaList, entityList, favoriteList]) => {
        if (!active) return;
        setAreas([...areaList].sort((a, b) => a.name.localeCompare(b.name)));
        setEntities(entityList);
        setFavoriteIds(favoriteList);
      })
      .catch((error) => console.error("Family Calendar bootstrap failed", error));
    return () => { active = false; };
  }, [hass]);

  const favoriteEntities = useMemo(
    () => favorites.filter((entityId) => hass.states[entityId]),
    [favorites, hass.states],
  );

  const roomEntities = useMemo(() => {
    if (room === "__favorites") return favoriteEntities;
    return entities
      .filter((entry) => entry.area_id === room)
      .map((entry) => entry.entity_id)
      .filter((entityId) => hass.states[entityId]);
  }, [room, entities, favoriteEntities, hass.states]);

  const allHomeEntities = useMemo(
    () => entities.map((entry) => entry.entity_id).filter((entityId) => hass.states[entityId]),
    [entities, hass.states],
  );

  const eventDate = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const events = useMemo(() => buildDemoEvents(now, language), [eventDate, language]);
  const currentTasks = mode === "todo" ? todo : shopping;
  const sunState = hass.states["sun.sun"]?.state;
  const isNight = sunState ? sunState === "below_horizon" : now.getHours() >= 19 || now.getHours() < 7;

  async function toggleFavorite(entityId: string) {
    const next = favorites.includes(entityId) ? favorites.filter((id) => id !== entityId) : [...favorites, entityId];
    setFavoriteIds(next);
    await setFavorites(hass, next);
  }

  function updateTask(id: number) {
    const update = (items: Task[]) => items.map((item) => item.id === id ? { ...item, done: !item.done } : item);
    mode === "todo" ? setTodo(update) : setShopping(update);
  }

  function deleteTask(id: number) {
    const remove = (items: Task[]) => items.filter((item) => item.id !== id);
    mode === "todo" ? setTodo(remove) : setShopping(remove);
  }

  async function turnOffScope() {
    const targetIds = room === "__favorites" ? allHomeEntities : roomEntities;
    await deactivateEntities(hass, targetIds);
  }

  return (
    <main className={`app-shell ${isNight ? "night" : "day"} ${page === "home" ? "home-page-active" : "calendar-page-active"}`}>
      {page === "calendar" ? (
        <section className="dashboard-grid">
          <aside className="left-column">
            <ClockPanel now={now} language={language} demo={demo} />
            <AgendaPanel now={now} events={events} language={language} />
            <section className="card tasks-card">
              <div className="card-heading split">
                <div>
                  <span className="section-kicker">{t("lists", language)}</span>
                  <h2>{mode === "todo" ? t("todo", language) : t("shopping", language)}</h2>
                </div>
                <span className="count-pill">{currentTasks.filter((item) => !item.done).length}</span>
              </div>
              <div className="task-list">
                {currentTasks.map((item) => (
                  <div className={`task-row ${item.done ? "done" : ""}`} key={item.id}>
                    <label>
                      <input type="checkbox" checked={item.done} onChange={() => updateTask(item.id)} />
                      <span>{item.label}</span>
                    </label>
                    {item.done && (
                      <button className="delete-task" onClick={() => deleteTask(item.id)} aria-label={t("delete", language)} title={t("delete", language)}>
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="text-button" type="button">+ {t("add", language)}</button>
              <div className="segmented-control">
                <button className={mode === "todo" ? "active" : ""} onClick={() => setMode("todo")}>{t("todo", language)}</button>
                <button className={mode === "shopping" ? "active" : ""} onClick={() => setMode("shopping")}>{t("shopping", language)}</button>
              </div>
            </section>
          </aside>

          <CalendarPanel
            month={visibleMonth}
            today={now}
            events={events}
            language={language}
            onPrevious={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
            onNext={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
            onToday={() => setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1))}
          />

          <aside className="right-column">
            <div className="status-row">
              {demo && <span className="demo-badge">{t("demo", language)}</span>}
              <span className="status-badge"><i />{t("online", language)}</span>
            </div>
            <section className="card home-card">
              <div className="card-heading split home-heading">
                <div>
                  <span className="section-kicker">{t("smartHome", language)}</span>
                  <h2>{t("home", language)}</h2>
                </div>
                <button className="power-all" onClick={() => void turnOffScope()}>
                  <PowerIcon /> {t("turnOffAll", language)}
                </button>
              </div>

              <div className="room-switcher room-chip-strip" role="tablist" aria-label={t("room", language)}>
                <button
                  role="tab"
                  aria-selected={room === "__favorites"}
                  className={room === "__favorites" ? "active" : ""}
                  onClick={() => { setRoom("__favorites"); setSelectedEntity(null); }}
                >
                  <StarIcon /> {t("favorites", language)}
                </button>
                {areas.map((area) => (
                  <button
                    role="tab"
                    aria-selected={room === area.area_id}
                    className={room === area.area_id ? "active" : ""}
                    key={area.area_id}
                    onClick={() => { setRoom(area.area_id); setSelectedEntity(null); }}
                  >
                    <span className="room-chip-dot" />{area.name}
                  </button>
                ))}
              </div>

              <div className="device-heading">
                <h3>{room === "__favorites" ? t("favorites", language) : areas.find((area) => area.area_id === room)?.name}</h3>
                <span>{room === "__favorites" ? t("wholeHome", language) : `${roomEntities.length} ${t("devices", language).toLowerCase()}`}</span>
              </div>

              <div className="entity-grid">
                {roomEntities.length === 0 && <div className="empty-state">{t("noDevices", language)}</div>}
                {roomEntities.map((entityId) => {
                  const state = hass.states[entityId];
                  const domain = entityId.split(".")[0];
                  const active = ["on", "open", "heat", "cool", "heat_cool", "auto", "fan_only", "dry", "playing", "unlocked"].includes(state.state);
                  const configurable = ["light", "cover", "climate"].includes(domain);
                  return (
                    <article
                      className={`entity-tile domain-${domain} ${active ? "active" : ""} ${selectedEntity === entityId ? "selected" : ""}`}
                      style={accessoryStyle(hass, entityId)}
                      key={entityId}
                    >
                      <button className="entity-main" onClick={() => void activateEntity(hass, entityId)}>
                        <span className="entity-icon">{iconForEntity(entityId)}</span>
                        <strong>{displayName(hass, entityId)}</strong>
                        <small>{entityStatus(hass, entityId, language)}</small>
                      </button>
                      <button
                        className={`favorite-button ${favorites.includes(entityId) ? "selected" : ""}`}
                        aria-label={t("favorites", language)}
                        onClick={() => void toggleFavorite(entityId)}
                      ><StarIcon /></button>
                      {configurable && (
                        <button
                          className="control-button"
                          aria-label={t("controls", language)}
                          title={t("controls", language)}
                          onClick={() => setSelectedEntity(selectedEntity === entityId ? null : entityId)}
                        ><SlidersIcon /></button>
                      )}
                    </article>
                  );
                })}
              </div>

              {selectedEntity && hass.states[selectedEntity] && (
                <DeviceControls hass={hass} entityId={selectedEntity} language={language} onClose={() => setSelectedEntity(null)} />
              )}
            </section>
          </aside>
        </section>
      ) : (
        <HomeView hass={hass} areas={areas} entities={entities} now={now} demo={demo} language={language} />
      )}

      <PageDock page={page} language={language} onChange={setPage} />
    </main>
  );
}

function PageDock({ page, language, onChange }: { page: Page; language: Language; onChange: (page: Page) => void }) {
  return (
    <nav className="page-dock" aria-label={t("views", language)}>
      <button className={page === "calendar" ? "active" : ""} onClick={() => onChange("calendar")}><CalendarIcon /><span>{t("calendar", language)}</span></button>
      <button className={page === "home" ? "active" : ""} onClick={() => onChange("home")}><HomeIcon /><span>{t("home", language)}</span></button>
    </nav>
  );
}

function ClockPanel({ now, language, demo }: { now: Date; language: Language; demo: boolean }) {
  return (
    <div className="clock-panel">
      <div className="time-row">
        <span className="clock">{now.toLocaleTimeString(localeFor(language), { hour: "2-digit", minute: "2-digit" })}</span>
        <span className="seconds">{pad(now.getSeconds())}</span>
      </div>
      <div className="today-label">
        {now.toLocaleDateString(localeFor(language), { weekday: "long", day: "numeric", month: "long" })}
      </div>
      {demo && <small className="demo-copy">{t("demoHint", language)}</small>}
    </div>
  );
}

function AgendaPanel({ now, events, language }: { now: Date; events: DemoEvent[]; language: Language }) {
  const groups = [0, 1, 2].map((offset) => {
    const date = addDays(now, offset);
    const key = dateKey(date);
    return { date, key, events: events.filter((event) => isDateInsideEvent(key, event)) };
  });
  return (
    <section className="card agenda-card">
      <div className="card-heading">
        <span className="section-kicker">{t("agenda", language)}</span>
        <h2>{t("upcoming", language)}</h2>
      </div>
      <div className="agenda-list">
        {groups.map(({ date, key, events: dayEvents }, index) => (
          <div className="agenda-day" key={key}>
            <div className="agenda-date">
              <strong>{index === 0 ? t("today", language) : index === 1 ? t("tomorrow", language) : date.toLocaleDateString(localeFor(language), { weekday: "long" })}</strong>
              <span>{date.toLocaleDateString(localeFor(language), { day: "2-digit", month: "short" })}</span>
            </div>
            <div className="agenda-events">
              {dayEvents.length === 0 ? <small>{t("noEvents", language)}</small> : dayEvents.map((event) => (
                <div className="agenda-event" key={`${event.startDate}-${event.title}`}>
                  <span>{key === event.startDate ? (event.time ?? "") : "↳"}</span><strong>{event.title}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CalendarPanel({ month, today, events, language, onPrevious, onNext, onToday }: {
  month: Date;
  today: Date;
  events: DemoEvent[];
  language: Language;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const cells = getMonthCells(month);
  const weekdays = language === "it" ? ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"] : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  return (
    <section className="card calendar-card">
      <div className="calendar-toolbar">
        <div>
          <span className="section-kicker">{t("calendar", language)}</span>
          <h1>{month.toLocaleDateString(localeFor(language), { month: "long", year: "numeric" })}</h1>
        </div>
        <div className="calendar-actions">
          <button onClick={onPrevious} aria-label={t("previousMonth", language)}><ChevronLeftIcon /></button>
          <button className="today-button" onClick={onToday}>{t("todayButton", language)}</button>
          <button onClick={onNext} aria-label={t("nextMonth", language)}><ChevronRightIcon /></button>
        </div>
      </div>
      <div className="month-grid">
        {weekdays.map((day) => <div className="weekday" key={day}>{day}</div>)}
        {cells.map(({ date, outside }) => {
          const key = dateKey(date);
          const dayEvents = events.filter((event) => isDateInsideEvent(key, event));
          const isToday = key === dateKey(today);
          return (
            <div className={`calendar-day ${outside ? "outside" : ""} ${isToday ? "today" : ""}`} key={key}>
              <div className="day-number"><span>{date.getDate()}</span>{isToday && <i />}</div>
              <div className="day-events">
                {dayEvents.map((event) => {
                  const starts = key === event.startDate;
                  const ends = key === (event.endDate ?? event.startDate);
                  return (
                    <div className={`calendar-event ${event.tone ?? "mint"} ${!starts ? "continues-before" : ""} ${!ends ? "continues-after" : ""}`} key={`${event.startDate}-${event.title}`}>
                      {starts ? <>{event.time && <span>{event.time}</span>} {event.title}</> : <span className="continuation">{event.title}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DeviceControls({ hass, entityId, language, onClose }: { hass: Hass; entityId: string; language: Language; onClose: () => void }) {
  const state = hass.states[entityId];
  const domain = entityId.split(".")[0];
  const brightness = Math.round((Number(state.attributes.brightness ?? 200) / 255) * 100);
  const position = Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0));
  const color = lightColor(hass, entityId);

  return (
    <div className={`device-controls device-controls-${domain}`}>
      <div className="device-controls-heading">
        <div><span className="section-kicker">{t("controls", language)}</span><strong>{displayName(hass, entityId)}</strong></div>
        <button onClick={onClose} aria-label={t("close", language)}><CloseIcon /></button>
      </div>
      {domain === "light" && (
        <>
          <ControlRow label={t("brightness", language)} value={`${brightness}%`}>
            <input type="range" min="1" max="100" defaultValue={brightness} onChange={(event) => void setLightBrightness(hass, entityId, Number(event.target.value))} />
          </ControlRow>
          <ControlRow label={t("color", language)} value="">
            <input className="color-control" type="color" defaultValue={color} onChange={(event) => void setLightColor(hass, entityId, event.target.value)} />
          </ControlRow>
        </>
      )}
      {domain === "cover" && (
        <ControlRow label={t("position", language)} value={`${position}%`}>
          <input type="range" min="0" max="100" defaultValue={position} onChange={(event) => void setCoverPosition(hass, entityId, Number(event.target.value))} />
        </ControlRow>
      )}
      {domain === "climate" && (
        <ClimateControl hass={hass} entityId={entityId} language={language} variant="compact" showName={false} />
      )}
    </div>
  );
}

function ControlRow({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return <div className="control-row"><div className="control-meta"><span>{label}</span><strong>{value}</strong></div>{children}</div>;
}

function getMonthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayIndex);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, outside: date.getMonth() !== month.getMonth() };
  });
}

function entityStatus(hass: Hass, entityId: string, language: Language) {
  const state = hass.states[entityId];
  const domain = entityId.split(".")[0];
  if (domain === "light" && state.state === "on") return `${Math.round((Number(state.attributes.brightness ?? 255) / 255) * 100)}%`;
  if (domain === "cover") return `${Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0))}%`;
  if (domain === "climate") {
    const current = Number(state.attributes.current_temperature);
    const target = Number(state.attributes.temperature);
    if (Number.isFinite(current) && Number.isFinite(target)) return `${current.toFixed(1)}° → ${target.toFixed(target % 1 === 0 ? 0 : 1)}°`;
    if (Number.isFinite(current)) return `${current.toFixed(1)}°`;
  }
  const map: Record<string, string> = language === "it"
    ? { on: "Acceso", off: "Spento", open: "Aperta", closed: "Chiusa", heat: "Riscaldamento", cool: "Raffrescamento", heat_cool: "Automatico", auto: "Automatico", fan_only: "Ventola", dry: "Deumidifica", playing: "In riproduzione", unavailable: "Non risponde", unknown: "Non disponibile", unlocked: "Sbloccata", locked: "Bloccata" }
    : { on: "On", off: "Off", open: "Open", closed: "Closed", heat: "Heating", cool: "Cooling", heat_cool: "Auto", auto: "Auto", fan_only: "Fan", dry: "Dry", playing: "Playing", unavailable: "No response", unknown: "Unavailable", unlocked: "Unlocked", locked: "Locked" };
  return map[state.state] ?? state.state;
}

function lightColor(hass: Hass, entityId: string): string {
  const attributes = hass.states[entityId]?.attributes ?? {};
  const demoHex = attributes.demo_hex_color;
  if (typeof demoHex === "string" && /^#[0-9a-f]{6}$/i.test(demoHex)) return demoHex;

  const rgb = attributes.rgb_color;
  if (Array.isArray(rgb) && rgb.length >= 3) {
    const parts = rgb.slice(0, 3).map((value) => Math.max(0, Math.min(255, Number(value) || 0)));
    return `#${parts.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
  }

  return "#ffd60a";
}

function accessoryStyle(hass: Hass, entityId: string): CSSProperties | undefined {
  if (!entityId.startsWith("light.")) return undefined;
  return { "--accessory-active": lightColor(hass, entityId) } as CSSProperties;
}

function iconForEntity(entityId: string) {
  const domain = entityId.split(".")[0];
  if (domain === "light") return <BulbIcon />;
  if (domain === "cover") return <CoverIcon />;
  if (domain === "climate") return <ClimateIcon />;
  return <PowerIcon />;
}

function StarIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.6 2.48 5.02 5.54.81-4.01 3.91.95 5.52L12 16.25l-4.96 2.61.95-5.52-4.01-3.91 5.54-.81L12 3.6Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function PowerIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6v7.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M7.65 6.55a7.35 7.35 0 1 0 8.7 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function BulbIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.3 17.3h5.4M10.2 20h3.6M12 3.2a6.3 6.3 0 0 0-3.7 11.4c.7.5 1 1.3 1 2.2h5.4c0-.9.3-1.7 1-2.2A6.3 6.3 0 0 0 12 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CoverIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="1.7" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M5 9h14M8 12h8M8 15h8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }
function ClimateIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.4 14.8V5.6a2.4 2.4 0 0 0-4.8 0v9.2a4.4 4.4 0 1 0 4.8 0Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/><path d="M12 8v8" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/></svg>; }
function SlidersIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h8m4 0h2M5 17h3m4 0h7M13 4v6M8 14v6" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.7 8.2h8.6l-.65 9.35a1.8 1.8 0 0 1-1.8 1.68h-3.7a1.8 1.8 0 0 1-1.8-1.68L7.7 8.2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 6.4h12M9.5 6.4V4.8h5v1.6M10.4 11v4.7M13.6 11v4.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function CalendarIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="5.5" width="15" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 3.5v4m8-4v4M4.5 10h15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function HomeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.7 11.1 12 4.5l8.3 6.6v8.2c0 .7-.5 1.2-1.2 1.2h-4.6v-5.7h-5v5.7H4.9c-.7 0-1.2-.5-1.2-1.2v-8.2Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/></svg>; }
function CloseIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7.5 7.5 9 9M16.5 7.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function ChevronLeftIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ChevronRightIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
