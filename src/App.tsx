import { useEffect, useMemo, useState } from "react";
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

function buildDemoEvents(today: Date): DemoEvent[] {
  return [
    { startDate: dateKey(today), time: "10:30", title: "Call progetto", tone: "mint" },
    { startDate: dateKey(today), time: "17:00", title: "Palestra", tone: "blue" },
    { startDate: dateKey(addDays(today, 2)), endDate: dateKey(addDays(today, 4)), title: "Weekend in Toscana", tone: "violet" },
    { startDate: dateKey(addDays(today, 6)), time: "20:30", title: "Cena in famiglia", tone: "amber" },
    { startDate: dateKey(addDays(today, 9)), endDate: dateKey(addDays(today, 11)), title: "Trasferta Milano", tone: "blue" },
  ];
}

export default function App({ hass, demo = false }: { hass: Hass; demo?: boolean }) {
  const language = getLanguage(hass);
  const [areas, setAreas] = useState<Area[]>([]);
  const [entities, setEntities] = useState<EntityRegistryEntry[]>([]);
  const [favorites, setFavoriteIds] = useState<string[]>([]);
  const [room, setRoom] = useState("__favorites");
  const [mode, setMode] = useState<Mode>("todo");
  const [now, setNow] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [todo, setTodo] = useState<Task[]>([
    { id: 1, label: "Comprare il latte", done: false },
    { id: 2, label: "Chiamare Marco", done: false },
    { id: 3, label: "Ritirare il pacco", done: true },
  ]);
  const [shopping, setShopping] = useState<Task[]>([
    { id: 1, label: "Latte", done: false },
    { id: 2, label: "Pane", done: false },
    { id: 3, label: "Pomodori", done: false },
    { id: 4, label: "Caffè", done: true },
  ]);

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
  const events = useMemo(() => buildDemoEvents(now), [eventDate]);
  const currentTasks = mode === "todo" ? todo : shopping;

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
    <main className="app-shell">
      <section className="dashboard-grid">
        <aside className="left-column">
          <ClockPanel now={now} language={language} demo={demo} />
          <AgendaPanel now={now} events={events} language={language} />
          <section className="card tasks-card">
            <div className="card-heading split">
              <div>
                <span className="section-kicker">Lists</span>
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
                <span className="section-kicker">Smart home</span>
                <h2>{t("home", language)}</h2>
              </div>
              <button className="power-all" onClick={() => void turnOffScope()}>
                <PowerIcon /> {t("turnOffAll", language)}
              </button>
            </div>

            <div className="room-switcher">
              <button className={room === "__favorites" ? "active" : ""} onClick={() => { setRoom("__favorites"); setSelectedEntity(null); }}>
                <StarIcon /> {t("favorites", language)}
              </button>
              <select value={room} onChange={(event) => { setRoom(event.target.value); setSelectedEntity(null); }} aria-label={t("room", language)}>
                <option value="__favorites">{t("room", language)}…</option>
                {areas.map((area) => <option value={area.area_id} key={area.area_id}>{area.name}</option>)}
              </select>
            </div>

            <div className="device-heading">
              <h3>{room === "__favorites" ? t("favorites", language) : areas.find((area) => area.area_id === room)?.name}</h3>
              <span>{room === "__favorites" ? t("wholeHome", language) : `${roomEntities.length} ${t("devices", language).toLowerCase()}`}</span>
            </div>

            <div className="entity-grid">
              {roomEntities.length === 0 && <div className="empty-state">{t("noDevices", language)}</div>}
              {roomEntities.map((entityId) => {
                const state = hass.states[entityId];
                const active = ["on", "open", "heat", "cool", "playing"].includes(state.state);
                const configurable = ["light", "cover"].includes(entityId.split(".")[0]);
                return (
                  <article className={`entity-tile ${active ? "active" : ""} ${selectedEntity === entityId ? "selected" : ""}`} key={entityId}>
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
    </main>
  );
}

function ClockPanel({ now, language, demo }: { now: Date; language: Language; demo: boolean }) {
  return (
    <div className="clock-panel">
      <div className="time-row">
        <span className="clock">{now.toLocaleTimeString(language === "it" ? "it-IT" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
        <span className="seconds">{pad(now.getSeconds())}</span>
      </div>
      <div className="today-label">
        {now.toLocaleDateString(language === "it" ? "it-IT" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}
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
        <span className="section-kicker">Agenda</span>
        <h2>{t("upcoming", language)}</h2>
      </div>
      <div className="agenda-list">
        {groups.map(({ date, key, events: dayEvents }, index) => (
          <div className="agenda-day" key={key}>
            <div className="agenda-date">
              <strong>{index === 0 ? t("today", language) : index === 1 ? t("tomorrow", language) : date.toLocaleDateString(language === "it" ? "it-IT" : "en-GB", { weekday: "long" })}</strong>
              <span>{date.toLocaleDateString(language === "it" ? "it-IT" : "en-GB", { day: "2-digit", month: "short" })}</span>
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
          <span className="section-kicker">Calendar</span>
          <h1>{month.toLocaleDateString(language === "it" ? "it-IT" : "en-GB", { month: "long", year: "numeric" })}</h1>
        </div>
        <div className="calendar-actions">
          <button onClick={onPrevious} aria-label="Previous month">‹</button>
          <button className="today-button" onClick={onToday}>{t("todayButton", language)}</button>
          <button onClick={onNext} aria-label="Next month">›</button>
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
  const color = String(state.attributes.demo_hex_color ?? "#f7c95c");

  return (
    <div className="device-controls">
      <div className="device-controls-heading">
        <div><span className="section-kicker">{t("controls", language)}</span><strong>{displayName(hass, entityId)}</strong></div>
        <button onClick={onClose} aria-label={t("close", language)}>×</button>
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
    </div>
  );
}

function ControlRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
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
  if (domain === "light" && state.state === "on") {
    return `${Math.round((Number(state.attributes.brightness ?? 255) / 255) * 100)}%`;
  }
  if (domain === "cover") return `${Number(state.attributes.current_position ?? (state.state === "open" ? 100 : 0))}%`;
  const map: Record<string, string> = language === "it"
    ? { on: "Acceso", off: "Spento", open: "Aperta", closed: "Chiusa", heat: "Riscaldamento" }
    : { on: "On", off: "Off", open: "Open", closed: "Closed", heat: "Heating" };
  return map[state.state] ?? state.state;
}

function iconForEntity(entityId: string) {
  const domain = entityId.split(".")[0];
  if (domain === "light") return <BulbIcon />;
  if (domain === "cover") return <CoverIcon />;
  if (domain === "climate") return <ClimateIcon />;
  return <PowerIcon />;
}

function StarIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.9 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.9Z" fill="currentColor"/></svg>; }
function PowerIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v9M7.1 5.9a8 8 0 1 0 9.8 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function BulbIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6m-5 3h4m-2-19a7 7 0 0 0-4 12.7c.7.5 1 1.2 1 2.3h6c0-1.1.3-1.8 1-2.3A7 7 0 0 0 12 2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CoverIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4Zm0 5h14M8 7h8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function ClimateIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M8 6l4 3 4-3M8 18l4-3 4 3M4.2 7.5l15.6 9M4.2 16.5l15.6-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function SlidersIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10m4 0h2M4 17h4m4 0h8M14 4v6M8 14v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 3h6l1 4H8l1-4Zm-2 4 1 14h8l1-14M10 11v6m4-6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
