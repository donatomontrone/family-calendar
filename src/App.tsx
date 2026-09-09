import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import HomeView from "./HomeView";
import ClimateControl from "./ClimateControl";
import SharedHeader from "./SharedHeader";
import HeaderActionModal, { type HeaderAction } from "./HeaderActionModal";
import ScrollRegion from "./ScrollRegion";
import SwipeTaskRow from "./SwipeTaskRow";
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
  setLightColorTemperature,
} from "./ha";
import { getLanguage, t, type Language } from "./i18n";
import { getWhiteTemperature, whiteTemperatureAccent } from "./light-temperature";

type Mode = "todo" | "shopping";
type Page = "calendar" | "home";
type ThemeOverride = "auto" | "day" | "night";
type Task = { id: number; label: string; done: boolean };
type DemoEvent = {
  startDate: string;
  endDate?: string;
  time?: string;
  title: string;
  tone?: "mint" | "blue" | "amber" | "violet";
};

const ACTIVE_ENTITY_STATES = new Set(["on", "open", "heat", "cool", "heat_cool", "auto", "fan_only", "dry", "playing", "unlocked"]);
const PASSIVE_DASHBOARD_DOMAINS = new Set(["sensor", "binary_sensor", "camera", "weather", "person", "device_tracker"]);
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
  const [addingTask, setAddingTask] = useState(false);
  const [taskDraft, setTaskDraft] = useState("");
  const [headerAction, setHeaderAction] = useState<HeaderAction | null>(null);
  const [themeOverride, setThemeOverride] = useState<ThemeOverride>("auto");

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

  useEffect(() => {
    const handleHeaderAction = (event: Event) => {
      const detail = (event as CustomEvent<HeaderAction>).detail;
      if (detail === "alarm" || detail === "notifications") setHeaderAction(detail);
    };
    document.addEventListener("family-calendar-header-action", handleHeaderAction);
    return () => document.removeEventListener("family-calendar-header-action", handleHeaderAction);
  }, []);

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
  const autoNight = sunState ? sunState === "below_horizon" : now.getHours() >= 19 || now.getHours() < 7;
  const isNight = themeOverride === "auto" ? autoNight : themeOverride === "night";

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

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = taskDraft.trim();
    if (!label) return;

    const nextTask: Task = { id: Date.now(), label, done: false };
    if (mode === "todo") setTodo((items) => [nextTask, ...items]);
    else setShopping((items) => [nextTask, ...items]);

    setTaskDraft("");
    setAddingTask(false);
  }

  async function turnOffScope() {
    const scopeIds = room === "__favorites" ? allHomeEntities : roomEntities;
    const targetIds = scopeIds.filter((entityId) => !isPassiveDashboardEntity(hass, entityId));
    await deactivateEntities(hass, targetIds);
  }

  function toggleTheme() {
    setThemeOverride(isNight ? "day" : "night");
  }

  const themeLabel = language === "it"
    ? `${themeOverride === "auto" ? "Tema automatico" : "Tema manuale"}: passa alla modalità ${isNight ? "chiara" : "scura"}`
    : `${themeOverride === "auto" ? "Automatic theme" : "Manual theme"}: switch to ${isNight ? "light" : "dark"} mode`;

  const openAlarm = () => setHeaderAction("alarm");
  const openNotifications = () => setHeaderAction("notifications");

  return (
    <main className={`app-shell ${isNight ? "night" : "day"} ${page === "home" ? "home-page-active" : "calendar-page-active"}`}>
      {page === "calendar" ? (
        <>
          <SharedHeader
            hass={hass}
            now={now}
            language={language}
            onAlarm={openAlarm}
            onNotifications={openNotifications}
            onThemeToggle={toggleTheme}
            isNight={isNight}
            themeLabel={themeLabel}
          />
          <section className="dashboard-grid">
            <aside className="left-column">
              <AgendaPanel now={now} events={events} language={language} />
              <section className="card tasks-card">
                <div className="card-heading split tasks-heading">
                  <div>
                    <span className="section-kicker">{t("lists", language)}</span>
                    <h2>{mode === "todo" ? t("todo", language) : t("shopping", language)}</h2>
                  </div>
                  <button
                    className={`task-add-button ${addingTask ? "active" : ""}`}
                    type="button"
                    aria-label={addingTask ? t("close", language) : t("add", language)}
                    title={addingTask ? t("close", language) : t("add", language)}
                    onClick={() => {
                      setAddingTask((value) => !value);
                      if (addingTask) setTaskDraft("");
                    }}
                  >
                    {addingTask ? <CloseIcon /> : <PlusIcon />}
                  </button>
                </div>

                {addingTask && (
                  <form className="task-composer" onSubmit={addTask}>
                    <input
                      autoFocus
                      value={taskDraft}
                      onChange={(event) => setTaskDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setTaskDraft("");
                          setAddingTask(false);
                        }
                      }}
                      placeholder={language === "it" ? "Nuovo elemento" : "New item"}
                      aria-label={t("add", language)}
                    />
                    <button className="task-save-button" type="submit" aria-label={t("add", language)} title={t("add", language)} disabled={!taskDraft.trim()}>
                      <CheckIcon />
                    </button>
                  </form>
                )}

                <ScrollRegion
                  className="task-list"
                  shellClassName="task-list-scroll-shell"
                  buttonLabel={language === "it" ? "Vai in fondo alla lista" : "Go to bottom of list"}
                  resetKey={mode}
                >
                  {currentTasks.map((item) => (
                    <SwipeTaskRow
                      key={`${mode}-${item.id}`}
                      item={item}
                      deleteLabel={t("delete", language)}
                      onToggle={() => updateTask(item.id)}
                      onDelete={() => deleteTask(item.id)}
                    />
                  ))}
                </ScrollRegion>

                <div className="segmented-control task-segmented-control">
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
                <div className="card-heading split home-heading">
                  <div>
                    <span className="section-kicker">{t("smartHome", language)}</span>
                    <h2>{t("home", language)}</h2>
                  </div>
                  <button className="power-all" onClick={() => void turnOffScope()} aria-label={t("turnOffAll", language)} title={t("turnOffAll", language)}>
                    <PowerIcon />
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

                <ScrollRegion
                  className="entity-grid"
                  shellClassName="entity-grid-scroll-shell"
                  buttonLabel={language === "it" ? "Vai in fondo ai dispositivi" : "Go to bottom of devices"}
                  resetKey={room}
                >
                  {roomEntities.length === 0 && <div className="empty-state">{t("noDevices", language)}</div>}
                  {roomEntities.map((entityId) => {
                    const state = hass.states[entityId];
                    const domain = entityId.split(".")[0];
                    const passive = isPassiveDashboardEntity(hass, entityId);
                    const active = !passive && ACTIVE_ENTITY_STATES.has(state.state);
                    const configurable = !passive && ["light", "cover", "climate"].includes(domain);
                    const status = entityStatus(hass, entityId, language);
                    const content = (
                      <>
                        <span className="entity-icon">{iconForEntity(hass, entityId)}</span>
                        <strong>{displayName(hass, entityId)}</strong>
                        <small>{status}</small>
                      </>
                    );
                    return (
                      <article
                        className={`entity-tile domain-${domain} ${passive ? "passive" : ""} ${active ? "active" : ""} ${selectedEntity === entityId ? "selected" : ""}`}
                        style={accessoryStyle(hass, entityId)}
                        key={entityId}
                      >
                        {passive ? (
                          <div className="entity-main entity-main-passive" aria-label={`${displayName(hass, entityId)}: ${status}`}>{content}</div>
                        ) : (
                          <button className="entity-main" onClick={() => void activateEntity(hass, entityId)}>{content}</button>
                        )}
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
                </ScrollRegion>

                {selectedEntity && hass.states[selectedEntity] && (
                  <DeviceControls hass={hass} entityId={selectedEntity} language={language} onClose={() => setSelectedEntity(null)} />
                )}
              </section>
            </aside>
          </section>
        </>
      ) : (
        <HomeView hass={hass} areas={areas} entities={entities} now={now} demo={demo} language={language} />
      )}

      {page === "home" && (
        <button type="button" className="global-theme-switch home-header-theme-switch" aria-label={themeLabel} title={themeLabel} onClick={toggleTheme}>
          {isNight ? <SunIcon /> : <MoonIcon />}
        </button>
      )}

      {headerAction && (
        <HeaderActionModal hass={hass} language={language} kind={headerAction} onClose={() => setHeaderAction(null)} />
      )}

      <PageDock page={page} language={language} onChange={setPage} />
    </main>
  );
}

function PageDock({ page, language, onChange }: { page: Page; language: Language; onChange: (page: Page) => void }) {
  return (
    <nav className="page-dock-shell" aria-label={t("views", language)}>
      <div className="segmented-control page-switch-control">
        <button className={page === "calendar" ? "active" : ""} onClick={() => onChange("calendar")}><span>{t("calendar", language)}</span></button>
        <button className={page === "home" ? "active" : ""} onClick={() => onChange("home")}><span>{t("home", language)}</span></button>
      </div>
    </nav>
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
  const whiteTemperature = getWhiteTemperature(state.attributes);

  return (
    <div className={`device-controls device-controls-${domain}`} role="dialog" aria-modal="true" aria-label={`${t("controls", language)} ${displayName(hass, entityId)}`}>
      <div className="device-controls-heading">
        <div><span className="section-kicker">{t("controls", language)}</span><strong>{displayName(hass, entityId)}</strong></div>
        <button onClick={onClose} aria-label={t("close", language)}><CloseIcon /></button>
      </div>
      {domain === "light" && (
        <>
          <ControlRow label={t("brightness", language)} value={`${brightness}%`}>
            <input type="range" min="1" max="100" defaultValue={brightness} onChange={(event) => void setLightBrightness(hass, entityId, Number(event.target.value))} />
          </ControlRow>
          <ControlRow label={language === "it" ? "Temperatura bianco" : "White temperature"} value={`${whiteTemperature.currentKelvin} K`}>
            <input
              className="white-temperature-control"
              type="range"
              min={whiteTemperature.minKelvin}
              max={whiteTemperature.maxKelvin}
              step="50"
              defaultValue={whiteTemperature.currentKelvin}
              onChange={(event) => void setLightColorTemperature(hass, entityId, Number(event.target.value))}
            />
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

function isPassiveDashboardEntity(hass: Hass, entityId: string) {
  const domain = entityId.split(".")[0];
  if (PASSIVE_DASHBOARD_DOMAINS.has(domain)) return true;
  if (domain !== "media_player") return false;

  const state = hass.states[entityId];
  const deviceClass = String(state?.attributes.device_class ?? "").toLowerCase();
  const name = String(state?.attributes.friendly_name ?? entityId).toLowerCase();
  return deviceClass === "speaker" || name.includes("homepod");
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
  if (domain === "sensor") {
    const unit = String(state.attributes.unit_of_measurement ?? "");
    if (!unit) return state.state;
    const separator = unit === "%" || unit.startsWith("°") ? "" : " ";
    return `${state.state}${separator}${unit}`;
  }
  if (domain === "binary_sensor") {
    const deviceClass = String(state.attributes.device_class ?? "").toLowerCase();
    const detected = state.state === "on";
    if (["motion", "occupancy", "presence"].includes(deviceClass)) {
      return language === "it" ? (detected ? "Presenza rilevata" : "Nessuna presenza") : (detected ? "Presence detected" : "No presence");
    }
    if (["door", "window", "opening", "garage_door"].includes(deviceClass)) {
      return language === "it" ? (detected ? "Aperta" : "Chiusa") : (detected ? "Open" : "Closed");
    }
    if (deviceClass === "moisture") {
      return language === "it" ? (detected ? "Umidità rilevata" : "Asciutto") : (detected ? "Moisture detected" : "Dry");
    }
    return language === "it" ? (detected ? "Rilevato" : "Normale") : (detected ? "Detected" : "Clear");
  }
  if (domain === "media_player") {
    const title = String(state.attributes.media_title ?? "").trim();
    const volume = Number(state.attributes.volume_level);
    const volumeText = Number.isFinite(volume) ? `${Math.round(volume * 100)}%` : "";
    if (title) return volumeText ? `${title} · ${volumeText}` : title;
    if (state.state === "playing") return language === "it" ? "In riproduzione" : "Playing";
    if (state.state === "paused") return language === "it" ? "In pausa" : "Paused";
    return language === "it" ? "Disponibile" : "Available";
  }
  if (domain === "camera") {
    return ["unavailable", "unknown"].includes(state.state)
      ? (language === "it" ? "Non disponibile" : "Unavailable")
      : (language === "it" ? "Disponibile" : "Available");
  }
  const map: Record<string, string> = language === "it"
    ? { on: "Acceso", off: "Spento", open: "Aperta", closed: "Chiusa", heat: "Riscaldamento", cool: "Raffrescamento", heat_cool: "Automatico", auto: "Automatico", fan_only: "Ventola", dry: "Deumidifica", playing: "In riproduzione", unavailable: "Non risponde", unknown: "Non disponibile", unlocked: "Sbloccata", locked: "Bloccata" }
    : { on: "On", off: "Off", open: "Open", closed: "Closed", heat: "Heating", cool: "Cooling", heat_cool: "Auto", auto: "Auto", fan_only: "Fan", dry: "Dry", playing: "Playing", unavailable: "No response", unknown: "Unavailable", unlocked: "Unlocked", locked: "Locked" };
  return map[state.state] ?? state.state;
}

function lightColor(hass: Hass, entityId: string): string {
  return whiteTemperatureAccent(getWhiteTemperature(hass.states[entityId]?.attributes ?? {}));
}

function accessoryStyle(hass: Hass, entityId: string): CSSProperties | undefined {
  if (!entityId.startsWith("light.")) return undefined;
  return { "--accessory-active": lightColor(hass, entityId) } as CSSProperties;
}

function iconForEntity(hass: Hass, entityId: string) {
  const domain = entityId.split(".")[0];
  if (domain === "light") return <BulbIcon />;
  if (domain === "cover") return <CoverIcon />;
  if (domain === "climate") return <ClimateIcon />;
  if (domain === "sensor") {
    const deviceClass = String(hass.states[entityId]?.attributes.device_class ?? "");
    if (deviceClass === "temperature") return <ClimateIcon />;
    if (deviceClass === "humidity") return <DropletIcon />;
    return <SensorIcon />;
  }
  if (domain === "binary_sensor") return <PresenceIcon />;
  if (domain === "media_player") return <SpeakerIcon />;
  if (domain === "camera") return <CameraIcon />;
  return <PowerIcon />;
}

function StarIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.6 2.48 5.02 5.54.81-4.01 3.91.95 5.52L12 16.25l-4.96 2.61.95-5.52-4.01-3.91 5.54-.81L12 3.6Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function PowerIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6v7.9" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/><path d="M7.65 6.55a7.35 7.35 0 1 0 8.7 0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>; }
function BulbIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.3 17.3h5.4M10.2 20h3.6M12 3.2a6.3 6.3 0 0 0-3.7 11.4c.7.5 1 1.3 1 2.2h5.4c0-.9.3-1.7 1-2.2A6.3 6.3 0 0 0 12 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CoverIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="1.7" fill="none" stroke="currentColor" strokeWidth="1.55"/><path d="M5 9h14M8 12h8M8 15h8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function ClimateIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.4 14.8V5.6a2.4 2.4 0 0 0-4.8 0v9.2a4.4 4.4 0 1 0 4.8 0Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function DropletIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.7c3.1 4.1 5.2 6.8 5.2 9.8a5.2 5.2 0 0 1-10.4 0c0-3 2.1-5.7 5.2-9.8Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/><path d="M9.5 14.2a2.8 2.8 0 0 0 2.7 2.1" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>; }
function SensorIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.55"/><path d="M7.7 7.7a6.1 6.1 0 0 0 0 8.6M16.3 7.7a6.1 6.1 0 0 1 0 8.6M5 5a9.9 9.9 0 0 0 0 14M19 5a9.9 9.9 0 0 1 0 14" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>; }
function PresenceIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M7.7 19c.45-3.4 1.9-5.6 4.3-5.6s3.85 2.2 4.3 5.6M5 9.4a8.1 8.1 0 0 0 0 5.2M19 9.4a8.1 8.1 0 0 1 0 5.2" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>; }
function SpeakerIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 10h3.2l4.5-3.7v11.4L8.4 14H5.2Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/><path d="M16 9.1a4.3 4.3 0 0 1 0 5.8M18.4 6.8a7.5 7.5 0 0 1 0 10.4" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></svg>; }
function CameraIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="6.5" width="11.5" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m16 10 4-2.1v8.2L16 14Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>; }
function SlidersIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h8m4 0h2M5 17h3m4 0h7M13 4v6M8 14v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.1 8.25h7.8l-.55 9.1a1.9 1.9 0 0 1-1.9 1.78h-2.9a1.9 1.9 0 0 1-1.9-1.78l-.55-9.1Z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/><path d="M6.2 6.4h11.6M9.35 6.4V4.85h5.3V6.4M10.25 11v4.9M13.75 11v4.9" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.2 12.4 3.65 3.65L17.9 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CloseIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7.5 7.5 9 9M16.5 7.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function ChevronLeftIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ChevronRightIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function SunIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></></svg>; }
function MoonIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 15.4A7.8 7.8 0 0 1 8.6 5.3a7.8 7.8 0 1 0 10.1 10.1Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
