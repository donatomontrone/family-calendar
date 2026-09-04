import { useEffect, useMemo, useState } from "react";
import type { Area, EntityRegistryEntry, Hass } from "./types";
import {
  activateEntity,
  displayName,
  getAreas,
  getEntityRegistry,
  getFavorites,
  setFavorites,
} from "./ha";
import { getLanguage, t } from "./i18n";

type Mode = "todo" | "shopping";
type DemoEvent = { date: string; time?: string; title: string; tone?: "mint" | "blue" | "amber" };

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

function buildDemoEvents(today: Date): DemoEvent[] {
  return [
    { date: dateKey(today), time: "10:30", title: "Call progetto", tone: "mint" },
    { date: dateKey(today), time: "17:00", title: "Palestra", tone: "blue" },
    { date: dateKey(addDays(today, 2)), time: "20:30", title: "Cena in famiglia", tone: "amber" },
    { date: dateKey(addDays(today, 5)), time: "09:00", title: "Dentista", tone: "blue" },
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
  const [todo, setTodo] = useState([
    { id: 1, label: "Comprare il latte", done: false },
    { id: 2, label: "Chiamare Marco", done: false },
    { id: 3, label: "Ritirare il pacco", done: true },
  ]);
  const [shopping, setShopping] = useState([
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
    return () => {
      active = false;
    };
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

  const eventDate = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const events = useMemo(() => buildDemoEvents(now), [eventDate]);
  const currentTasks = mode === "todo" ? todo : shopping;

  async function toggleFavorite(entityId: string) {
    const next = favorites.includes(entityId)
      ? favorites.filter((id) => id !== entityId)
      : [...favorites, entityId];
    setFavoriteIds(next);
    await setFavorites(hass, next);
  }

  function toggleTask(id: number) {
    const update = (items: typeof todo) => items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
    if (mode === "todo") setTodo(update);
    else setShopping(update);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="eyebrow">Family Calendar</div>
          <div className="time-row">
            <span className="clock">{now.toLocaleTimeString(language === "it" ? "it-IT" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="seconds">{pad(now.getSeconds())}</span>
          </div>
          <div className="today-label">
            {now.toLocaleDateString(language === "it" ? "it-IT" : "en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
        </div>
        <div className="status-stack">
          {demo && <span className="demo-badge">{t("demo", language)}</span>}
          <span className="status-badge"><i />{t("online", language)}</span>
          {demo && <small>{t("demoHint", language)}</small>}
        </div>
      </header>

      <section className="dashboard-grid">
        <aside className="left-column">
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
                <label className={`task-row ${item.done ? "done" : ""}`} key={item.id}>
                  <input type="checkbox" checked={item.done} onChange={() => toggleTask(item.id)} />
                  <span>{item.label}</span>
                </label>
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
          <section className="card home-card">
            <div className="card-heading split">
              <div>
                <span className="section-kicker">Smart home</span>
                <h2>{t("home", language)}</h2>
              </div>
              <span className="health-label">{t("allGood", language)}</span>
            </div>

            <div className="room-switcher">
              <button className={room === "__favorites" ? "active" : ""} onClick={() => setRoom("__favorites")}>
                ★ {t("favorites", language)}
              </button>
              <select value={room} onChange={(event) => setRoom(event.target.value)} aria-label={t("room", language)}>
                <option value="__favorites">{t("room", language)}…</option>
                {areas.map((area) => <option value={area.area_id} key={area.area_id}>{area.name}</option>)}
              </select>
            </div>

            <div className="device-heading">
              <h3>{room === "__favorites" ? t("favorites", language) : areas.find((area) => area.area_id === room)?.name}</h3>
              <span>{roomEntities.length} {t("devices", language).toLowerCase()}</span>
            </div>

            <div className="entity-grid">
              {roomEntities.length === 0 && <div className="empty-state">{t("noDevices", language)}</div>}
              {roomEntities.slice(0, 12).map((entityId) => {
                const state = hass.states[entityId];
                const active = ["on", "open", "heat", "cool", "playing"].includes(state.state);
                return (
                  <article className={`entity-tile ${active ? "active" : ""}`} key={entityId}>
                    <button className="entity-main" onClick={() => void activateEntity(hass, entityId)}>
                      <span className="entity-icon">{iconForEntity(entityId)}</span>
                      <strong>{displayName(hass, entityId)}</strong>
                      <small>{state.state}</small>
                    </button>
                    <button
                      className={`favorite-button ${favorites.includes(entityId) ? "selected" : ""}`}
                      aria-label={t("favorites", language)}
                      onClick={() => void toggleFavorite(entityId)}
                    >★</button>
                  </article>
                );
              })}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function AgendaPanel({ now, events, language }: { now: Date; events: DemoEvent[]; language: "it" | "en" }) {
  const groups = [0, 1, 2].map((offset) => {
    const date = addDays(now, offset);
    return { date, events: events.filter((event) => event.date === dateKey(date)) };
  });
  return (
    <section className="card agenda-card">
      <div className="card-heading">
        <span className="section-kicker">Agenda</span>
        <h2>{t("upcoming", language)}</h2>
      </div>
      <div className="agenda-list">
        {groups.map(({ date, events: dayEvents }, index) => (
          <div className="agenda-day" key={dateKey(date)}>
            <div className="agenda-date">
              <strong>{index === 0 ? t("today", language) : index === 1 ? t("tomorrow", language) : date.toLocaleDateString(language === "it" ? "it-IT" : "en-GB", { weekday: "long" })}</strong>
              <span>{date.toLocaleDateString(language === "it" ? "it-IT" : "en-GB", { day: "2-digit", month: "short" })}</span>
            </div>
            <div className="agenda-events">
              {dayEvents.length === 0 ? <small>{t("noEvents", language)}</small> : dayEvents.map((event) => (
                <div className="agenda-event" key={`${event.date}-${event.time}-${event.title}`}>
                  <span>{event.time}</span><strong>{event.title}</strong>
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
  language: "it" | "en";
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
          const dayEvents = events.filter((event) => event.date === key);
          const isToday = key === dateKey(today);
          return (
            <div className={`calendar-day ${outside ? "outside" : ""} ${isToday ? "today" : ""}`} key={key}>
              <div className="day-number"><span>{date.getDate()}</span>{isToday && <i />}</div>
              <div className="day-events">
                {dayEvents.map((event) => (
                  <div className={`calendar-event ${event.tone ?? "mint"}`} key={`${event.time}-${event.title}`}>
                    {event.time && <span>{event.time}</span>} {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
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

function iconForEntity(entityId: string) {
  const domain = entityId.split(".")[0];
  return ({ light: "◉", switch: "⏻", cover: "▥", climate: "♨", media_player: "▶" } as Record<string, string>)[domain] ?? "◆";
}
