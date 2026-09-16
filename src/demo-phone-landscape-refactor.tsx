import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./demo-phone-landscape-refactor.css";

type Page = "calendar" | "home";
type SideMode = "agenda" | "lists";
type ListMode = "todo" | "shopping";
type Tone = "mint" | "blue" | "amber" | "violet";
type EventItem = { startDate: string; endDate?: string; time?: string; title: string; tone: Tone };
type TaskItem = { id: number; label: string; done: boolean };
type DeviceKind = "light" | "cover" | "climate" | "switch" | "media" | "camera";
type Device = { id: string; name: string; kind: DeviceKind; value: string; active?: boolean; position?: number };
type Sensor = { id: string; name: string; value: string; icon: "temperature" | "humidity" | "presence" | "window" };
type Room = { id: string; name: string; temperature: string; devices: Device[]; sensors: Sensor[] };

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date: Date, days: number) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };
const insideEvent = (key: string, event: EventItem) => key >= event.startDate && key <= (event.endDate ?? event.startDate);

function demoEvents(today: Date): EventItem[] {
  return [
    { startDate: dateKey(today), time: "10:30", title: "Call progetto", tone: "mint" },
    { startDate: dateKey(today), time: "17:00", title: "Palestra", tone: "blue" },
    { startDate: dateKey(addDays(today, 2)), endDate: dateKey(addDays(today, 4)), title: "Weekend in Toscana", tone: "violet" },
    { startDate: dateKey(addDays(today, 6)), time: "20:30", title: "Cena in famiglia", tone: "amber" },
    { startDate: dateKey(addDays(today, 9)), endDate: dateKey(addDays(today, 11)), title: "Trasferta Milano", tone: "blue" },
  ];
}

const initialRooms: Room[] = [
  {
    id: "open_space", name: "Open space", temperature: "22.6°",
    devices: [
      { id: "light.soggiorno", name: "Salotto", kind: "light", value: "77%", active: true },
      { id: "light.cucina", name: "Cucina", kind: "light", value: "59%", active: true },
      { id: "light.sala", name: "Sala da pranzo", kind: "light", value: "72%", active: true },
      { id: "light.studio", name: "Studio", kind: "light", value: "82%", active: true },
      { id: "cover.salotto", name: "Tenda salotto", kind: "cover", value: "72%", active: true, position: 72 },
      { id: "switch.scrivania", name: "Scrivania", kind: "switch", value: "Accesa", active: true },
      { id: "switch.tv", name: "TV", kind: "switch", value: "Spenta" },
      { id: "media.soggiorno", name: "Apple TV", kind: "media", value: "In riproduzione", active: true },
    ],
    sensors: [
      { id: "temp.soggiorno", name: "Temperatura", value: "22.6°", icon: "temperature" },
      { id: "humidity.soggiorno", name: "Umidità", value: "46%", icon: "humidity" },
      { id: "presence.studio", name: "Presenza studio", value: "Rilevata", icon: "presence" },
    ],
  },
  {
    id: "camera", name: "Camera da letto", temperature: "21.9°",
    devices: [
      { id: "light.camera", name: "Luce camera", kind: "light", value: "Spenta" },
      { id: "cover.camera", name: "Tapparella", kind: "cover", value: "0%", position: 0 },
      { id: "climate.camera", name: "Clima", kind: "climate", value: "22.5°", active: true },
      { id: "media.camera", name: "HomePod", kind: "media", value: "In pausa" },
    ],
    sensors: [
      { id: "temp.camera", name: "Temperatura", value: "21.9°", icon: "temperature" },
      { id: "humidity.camera", name: "Umidità", value: "49%", icon: "humidity" },
      { id: "window.camera", name: "Finestra", value: "Chiusa", icon: "window" },
    ],
  },
  {
    id: "cameretta", name: "Cameretta", temperature: "21.7°",
    devices: [
      { id: "light.cameretta", name: "Luce cameretta", kind: "light", value: "65%", active: true },
      { id: "cover.cameretta", name: "Tapparella", kind: "cover", value: "48%", active: true, position: 48 },
      { id: "climate.cameretta", name: "Clima", kind: "climate", value: "22°", active: true },
    ],
    sensors: [
      { id: "temp.cameretta", name: "Temperatura", value: "21.7°", icon: "temperature" },
      { id: "humidity.cameretta", name: "Umidità", value: "48%", icon: "humidity" },
      { id: "window.cameretta", name: "Finestra", value: "Chiusa", icon: "window" },
    ],
  },
  {
    id: "bagno_padronale", name: "Bagno padronale", temperature: "22.0°",
    devices: [{ id: "light.bagno_padronale", name: "Luce bagno", kind: "light", value: "67%", active: true }],
    sensors: [
      { id: "humidity.bagno_padronale", name: "Umidità", value: "55%", icon: "humidity" },
      { id: "presence.bagno_padronale", name: "Presenza", value: "Nessuna", icon: "presence" },
    ],
  },
  {
    id: "bagno_servizio", name: "Bagno di servizio", temperature: "—",
    devices: [{ id: "light.bagno_servizio", name: "Luce bagno", kind: "light", value: "Spenta" }],
    sensors: [{ id: "humidity.bagno_servizio", name: "Umidità", value: "58%", icon: "humidity" }],
  },
  {
    id: "disimpegno", name: "Disimpegno", temperature: "22.1°",
    devices: [{ id: "light.disimpegno", name: "Luce disimpegno", kind: "light", value: "Spenta" }],
    sensors: [
      { id: "temp.disimpegno", name: "Temperatura", value: "22.1°", icon: "temperature" },
      { id: "door.ingresso", name: "Porta ingresso", value: "Chiusa", icon: "window" },
    ],
  },
  {
    id: "esterno", name: "Esterno", temperature: "20.8°",
    devices: [
      { id: "light.patio", name: "Luce patio", kind: "light", value: "Spenta" },
      { id: "camera.patio", name: "Camera patio", kind: "camera", value: "Disponibile" },
    ],
    sensors: [
      { id: "temp.esterno", name: "Temperatura", value: "20.8°", icon: "temperature" },
      { id: "presence.patio", name: "Presenza", value: "Nessuna", icon: "presence" },
    ],
  },
];

function PhoneLandscapeDemo() {
  const [page, setPage] = useState<Page>("calendar");
  const [now, setNow] = useState(new Date());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [sideMode, setSideMode] = useState<SideMode>("agenda");
  const [listMode, setListMode] = useState<ListMode>("todo");
  const [todo, setTodo] = useState<TaskItem[]>([
    { id: 1, label: "Comprare il latte", done: false },
    { id: 2, label: "Chiamare Marco", done: false },
    { id: 3, label: "Ritirare il pacco", done: true },
  ]);
  const [shopping, setShopping] = useState<TaskItem[]>([
    { id: 1, label: "Latte", done: false },
    { id: 2, label: "Pane", done: false },
    { id: 3, label: "Pomodori", done: false },
    { id: 4, label: "Caffè", done: true },
  ]);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [roomId, setRoomId] = useState("open_space");
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [isNight, setIsNight] = useState(() => { const hour = new Date().getHours(); return hour >= 19 || hour < 7; });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const events = useMemo(() => demoEvents(now), [dateKey(now)]);
  const tasks = listMode === "todo" ? todo : shopping;
  const room = rooms.find((item) => item.id === roomId) ?? rooms[0];

  function toggleTask(id: number) {
    const update = (items: TaskItem[]) => items.map((item) => item.id === id ? { ...item, done: !item.done } : item);
    listMode === "todo" ? setTodo(update) : setShopping(update);
  }

  function deleteTask(id: number) {
    const update = (items: TaskItem[]) => items.filter((item) => item.id !== id);
    listMode === "todo" ? setTodo(update) : setShopping(update);
  }

  function toggleDevice(deviceId: string) {
    setRooms((current) => current.map((candidate) => ({
      ...candidate,
      devices: candidate.devices.map((device) => {
        if (device.id !== deviceId) return device;
        if (device.kind === "camera" || device.kind === "media" || device.kind === "climate") return device;
        if (device.kind === "cover") {
          const nextPosition = (device.position ?? 0) > 0 ? 0 : 100;
          return { ...device, position: nextPosition, value: `${nextPosition}%`, active: nextPosition > 0 };
        }
        const active = !device.active;
        return { ...device, active, value: active ? (device.kind === "light" ? "100%" : "Accesa") : (device.kind === "light" ? "Spenta" : "Spenta") };
      }),
    })));
  }

  function setCoverPosition(deviceId: string, position: number) {
    setRooms((current) => current.map((candidate) => ({
      ...candidate,
      devices: candidate.devices.map((device) => device.id === deviceId
        ? { ...device, position, value: `${position}%`, active: position > 0 }
        : device),
    })));
    setDetailDevice((current) => current?.id === deviceId ? { ...current, position, value: `${position}%`, active: position > 0 } : current);
  }

  function allOff() {
    setRooms((current) => current.map((candidate) => candidate.id !== room.id ? candidate : ({
      ...candidate,
      devices: candidate.devices.map((device) => {
        if (device.kind === "camera" || device.kind === "media" || device.kind === "climate") return device;
        if (device.kind === "cover") return { ...device, active: false, position: 0, value: "0%" };
        return { ...device, active: false, value: "Spenta" };
      }),
    })));
  }

  return (
    <main id="family-phone-landscape" className={isNight ? "fpl-night" : "fpl-day"}>
      <header className="fpl-header">
        <div className="fpl-header-context">
          <strong>{page === "calendar" ? "Calendario" : room.name}</strong>
          <span>{page === "calendar" ? now.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : `${room.devices.filter((device) => device.active).length} attivi · ${room.temperature}`}</span>
        </div>
        <time>{now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</time>
        <div className="fpl-header-actions">
          <span className="fpl-weather"><SunIcon /><b>24.5°</b></span>
          <button aria-label="Allarme"><ShieldIcon /></button>
          <button aria-label="Notifiche"><BellIcon /></button>
          <button aria-label={isNight ? "Tema chiaro" : "Tema scuro"} onClick={() => setIsNight((value) => !value)}>{isNight ? <SunIcon /> : <MoonIcon />}</button>
        </div>
      </header>

      <section className="fpl-content">
        {page === "calendar" ? (
          <CalendarView
            now={now}
            month={month}
            events={events}
            sideMode={sideMode}
            onSideMode={setSideMode}
            listMode={listMode}
            onListMode={setListMode}
            tasks={tasks}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onPrevious={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            onToday={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))}
          />
        ) : (
          <HomeView
            rooms={rooms}
            room={room}
            onRoom={setRoomId}
            onToggleDevice={toggleDevice}
            onDetail={setDetailDevice}
            onAllOff={allOff}
          />
        )}
      </section>

      <nav className="fpl-dock" aria-label="Pagine">
        <button className={page === "calendar" ? "active" : ""} onClick={() => setPage("calendar")}><CalendarIcon /><span>Calendario</span></button>
        <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")}><HomeIcon /><span>Casa</span></button>
      </nav>

      {detailDevice && (
        <DeviceDetail device={detailDevice} onClose={() => setDetailDevice(null)} onPosition={(value) => setCoverPosition(detailDevice.id, value)} />
      )}
    </main>
  );
}

function CalendarView({ now, month, events, sideMode, onSideMode, listMode, onListMode, tasks, onToggleTask, onDeleteTask, onPrevious, onNext, onToday }: {
  now: Date; month: Date; events: EventItem[]; sideMode: SideMode; onSideMode: (mode: SideMode) => void;
  listMode: ListMode; onListMode: (mode: ListMode) => void; tasks: TaskItem[]; onToggleTask: (id: number) => void; onDeleteTask: (id: number) => void;
  onPrevious: () => void; onNext: () => void; onToday: () => void;
}) {
  const cells = monthCells(month);
  const weekdays = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];
  return (
    <div className="fpl-calendar-layout">
      <section className="fpl-panel fpl-month">
        <div className="fpl-month-toolbar">
          <h1>{month.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}</h1>
          <div>
            <button onClick={onPrevious} aria-label="Mese precedente"><ChevronLeftIcon /></button>
            <button className="fpl-today" onClick={onToday}>Oggi</button>
            <button onClick={onNext} aria-label="Mese successivo"><ChevronRightIcon /></button>
          </div>
        </div>
        <div className="fpl-month-grid">
          {weekdays.map((weekday) => <div className="fpl-weekday" key={weekday}>{weekday}</div>)}
          {cells.map(({ date, outside }) => {
            const key = dateKey(date);
            const dayEvents = events.filter((event) => insideEvent(key, event));
            const today = key === dateKey(now);
            return (
              <div className={`fpl-day ${outside ? "outside" : ""} ${today ? "today" : ""}`} key={key}>
                <span className="fpl-day-number">{date.getDate()}</span>
                <div className="fpl-day-events">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div className={`fpl-event ${event.tone}`} key={`${event.startDate}-${event.title}`}>
                      {key === event.startDate && event.time ? <b>{event.time}</b> : null}<span>{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="fpl-panel fpl-side-panel">
        <div className="fpl-segmented fpl-side-tabs">
          <button className={sideMode === "agenda" ? "active" : ""} onClick={() => onSideMode("agenda")}>Agenda</button>
          <button className={sideMode === "lists" ? "active" : ""} onClick={() => onSideMode("lists")}>Liste</button>
        </div>
        {sideMode === "agenda" ? <Agenda now={now} events={events} /> : (
          <TaskList mode={listMode} onMode={onListMode} tasks={tasks} onToggle={onToggleTask} onDelete={onDeleteTask} />
        )}
      </aside>
    </div>
  );
}

function Agenda({ now, events }: { now: Date; events: EventItem[] }) {
  const days = [0, 1, 2].map((offset) => {
    const date = addDays(now, offset);
    const key = dateKey(date);
    return { offset, date, key, events: events.filter((event) => insideEvent(key, event)) };
  });
  return (
    <div className="fpl-agenda">
      <div className="fpl-side-title"><strong>Prossimi eventi</strong><span>3 giorni</span></div>
      <div className="fpl-agenda-scroll">
        {days.map(({ offset, date, key, events: dayEvents }) => (
          <section className="fpl-agenda-day" key={key}>
            <div className="fpl-agenda-date">
              <b>{offset === 0 ? "Oggi" : offset === 1 ? "Domani" : date.toLocaleDateString("it-IT", { weekday: "long" })}</b>
              <span>{date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}</span>
            </div>
            {dayEvents.length ? dayEvents.map((event) => (
              <div className="fpl-agenda-event" key={`${event.startDate}-${event.title}`}><i className={event.tone}/><span>{key === event.startDate ? event.time ?? "Tutto il giorno" : "Continua"}</span><strong>{event.title}</strong></div>
            )) : <small>Nessun evento</small>}
          </section>
        ))}
      </div>
    </div>
  );
}

function TaskList({ mode, onMode, tasks, onToggle, onDelete }: { mode: ListMode; onMode: (mode: ListMode) => void; tasks: TaskItem[]; onToggle: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <div className="fpl-tasks">
      <div className="fpl-side-title"><strong>{mode === "todo" ? "Da fare" : "Spesa"}</strong><span>{tasks.filter((task) => !task.done).length} aperti</span></div>
      <div className="fpl-mini-tabs">
        <button className={mode === "todo" ? "active" : ""} onClick={() => onMode("todo")}>Da fare</button>
        <button className={mode === "shopping" ? "active" : ""} onClick={() => onMode("shopping")}>Spesa</button>
      </div>
      <div className="fpl-task-scroll">
        {tasks.map((task) => (
          <div className={`fpl-task ${task.done ? "done" : ""}`} key={`${mode}-${task.id}`}>
            <button className="fpl-check" onClick={() => onToggle(task.id)} aria-label={task.done ? "Segna da fare" : "Completa"}>{task.done ? <CheckIcon /> : null}</button>
            <span>{task.label}</span>
            {task.done && <button className="fpl-delete" onClick={() => onDelete(task.id)} aria-label="Elimina"><TrashIcon /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeView({ rooms, room, onRoom, onToggleDevice, onDetail, onAllOff }: { rooms: Room[]; room: Room; onRoom: (id: string) => void; onToggleDevice: (id: string) => void; onDetail: (device: Device) => void; onAllOff: () => void }) {
  return (
    <div className="fpl-home-layout">
      <nav className="fpl-room-tabs" aria-label="Stanze">
        {rooms.map((candidate) => <button className={candidate.id === room.id ? "active" : ""} onClick={() => onRoom(candidate.id)} key={candidate.id}><span>{candidate.name}</span><b>{candidate.temperature}</b></button>)}
      </nav>
      <div className="fpl-home-main">
        <section className="fpl-panel fpl-room-panel">
          <div className="fpl-room-heading">
            <div><strong>{room.name}</strong><span>{room.devices.length} dispositivi · {room.devices.filter((device) => device.active).length} attivi</span></div>
            <button className="fpl-all-off" onClick={onAllOff}><PowerIcon /><span>Spegni</span></button>
          </div>
          <div className="fpl-device-grid">
            {room.devices.map((device) => (
              <article className={`fpl-device ${device.active ? "active" : ""} kind-${device.kind}`} key={device.id}>
                <button className="fpl-device-main" onClick={() => onToggleDevice(device.id)}>
                  <i>{deviceIcon(device.kind)}</i>
                  <span><strong>{device.name}</strong><small>{device.value}</small></span>
                </button>
                {["light", "cover", "climate"].includes(device.kind) && <button className="fpl-device-more" aria-label={`Controlli ${device.name}`} onClick={() => onDetail(device)}><SlidersIcon /></button>}
              </article>
            ))}
          </div>
        </section>

        <aside className="fpl-panel fpl-room-side">
          <div className="fpl-side-title"><strong>Stato stanza</strong><span>{room.temperature}</span></div>
          <div className="fpl-sensor-list">
            {room.sensors.map((sensor) => (
              <div className="fpl-sensor" key={sensor.id}><i>{sensorIcon(sensor.icon)}</i><span><strong>{sensor.name}</strong><small>{sensor.value}</small></span></div>
            ))}
          </div>
          <div className="fpl-quick-actions">
            <button><SceneIcon /><span>Scene</span></button>
            <button><ClimateIcon /><span>Clima</span></button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DeviceDetail({ device, onClose, onPosition }: { device: Device; onClose: () => void; onPosition: (value: number) => void }) {
  const position = device.position ?? 50;
  return (
    <div className="fpl-modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="fpl-modal" role="dialog" aria-modal="true">
        <div className="fpl-modal-head"><div><small>Controlli</small><strong>{device.name}</strong></div><button onClick={onClose}><CloseIcon /></button></div>
        <div className="fpl-modal-device"><i>{deviceIcon(device.kind)}</i><div><strong>{device.value}</strong><span>{device.kind === "cover" ? "Posizione" : device.kind === "climate" ? "Temperatura" : "Stato dispositivo"}</span></div></div>
        {device.kind === "cover" && <label className="fpl-range"><span><b>Posizione</b><strong>{position}%</strong></span><input type="range" min="0" max="100" value={position} onChange={(event) => onPosition(Number(event.target.value))}/></label>}
        {device.kind === "light" && <label className="fpl-range"><span><b>Luminosità</b><strong>{device.active ? device.value : "0%"}</strong></span><input type="range" min="0" max="100" defaultValue={device.active ? 75 : 0}/></label>}
      </section>
    </div>
  );
}

function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayIndex);
  return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return { date, outside: date.getMonth() !== month.getMonth() }; });
}

function deviceIcon(kind: DeviceKind) {
  if (kind === "light") return <BulbIcon />;
  if (kind === "cover") return <CoverIcon />;
  if (kind === "climate") return <ClimateIcon />;
  if (kind === "media") return <MediaIcon />;
  if (kind === "camera") return <CameraIcon />;
  return <PowerIcon />;
}

function sensorIcon(kind: Sensor["icon"]) {
  if (kind === "temperature") return <ClimateIcon />;
  if (kind === "humidity") return <DropletIcon />;
  if (kind === "presence") return <PresenceIcon />;
  return <WindowIcon />;
}

function StrokeIcon({ children }: { children: ReactNode }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{children}</g></svg>; }
function CalendarIcon() { return <StrokeIcon><rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16"/></StrokeIcon>; }
function HomeIcon() { return <StrokeIcon><path d="m4 11 8-6.5 8 6.5v8.5h-6v-5h-4v5H4Z"/></StrokeIcon>; }
function SunIcon() { return <StrokeIcon><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></StrokeIcon>; }
function MoonIcon() { return <StrokeIcon><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5Z"/></StrokeIcon>; }
function ShieldIcon() { return <StrokeIcon><path d="M12 3.2 18.7 6v5c0 4.8-2.6 7.9-6.7 9.8C7.9 18.9 5.3 15.8 5.3 11V6Z"/><path d="m9.2 12 1.7 1.7 3.9-3.9"/></StrokeIcon>; }
function BellIcon() { return <StrokeIcon><path d="M6.7 16.8h10.6l-1.4-2V10a3.9 3.9 0 0 0-7.8 0v4.8Z"/><path d="M10.2 19h3.6"/></StrokeIcon>; }
function BulbIcon() { return <StrokeIcon><path d="M9.3 17.3h5.4M10.2 20h3.6M12 3.2a6.3 6.3 0 0 0-3.7 11.4c.7.5 1 1.3 1 2.2h5.4c0-.9.3-1.7 1-2.2A6.3 6.3 0 0 0 12 3.2Z"/></StrokeIcon>; }
function CoverIcon() { return <StrokeIcon><rect x="5" y="4" width="14" height="16" rx="1.7"/><path d="M5 9h14M8 12h8M8 15h8"/></StrokeIcon>; }
function ClimateIcon() { return <StrokeIcon><path d="M14.4 14.8V5.6a2.4 2.4 0 0 0-4.8 0v9.2a4.4 4.4 0 1 0 4.8 0Z"/><path d="M12 8v8"/></StrokeIcon>; }
function MediaIcon() { return <StrokeIcon><rect x="4" y="5" width="16" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/></StrokeIcon>; }
function CameraIcon() { return <StrokeIcon><rect x="4.5" y="6.5" width="11.5" height="11" rx="2"/><path d="m16 10 4-2.1v8.2L16 14Z"/></StrokeIcon>; }
function DropletIcon() { return <StrokeIcon><path d="M12 3.7c3.1 4.1 5.2 6.8 5.2 9.8a5.2 5.2 0 0 1-10.4 0c0-3 2.1-5.7 5.2-9.8Z"/></StrokeIcon>; }
function PresenceIcon() { return <StrokeIcon><circle cx="12" cy="8" r="2.4"/><path d="M7.7 19c.45-3.4 1.9-5.6 4.3-5.6s3.85 2.2 4.3 5.6M5 9.4a8.1 8.1 0 0 0 0 5.2M19 9.4a8.1 8.1 0 0 1 0 5.2"/></StrokeIcon>; }
function WindowIcon() { return <StrokeIcon><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M12 4v16M5 12h14"/></StrokeIcon>; }
function SceneIcon() { return <StrokeIcon><path d="M4.5 17.5 9 13l3 3 4.5-6 3 7.5Z"/><circle cx="8" cy="7.5" r="2"/></StrokeIcon>; }
function PowerIcon() { return <StrokeIcon><path d="M12 3.6v7.9"/><path d="M7.65 6.55a7.35 7.35 0 1 0 8.7 0"/></StrokeIcon>; }
function SlidersIcon() { return <StrokeIcon><path d="M5 7h8m4 0h2M5 17h3m4 0h7M13 4v6M8 14v6"/></StrokeIcon>; }
function ChevronLeftIcon() { return <StrokeIcon><path d="m14.5 6-6 6 6 6"/></StrokeIcon>; }
function ChevronRightIcon() { return <StrokeIcon><path d="m9.5 6 6 6-6 6"/></StrokeIcon>; }
function CheckIcon() { return <StrokeIcon><path d="m6.2 12.4 3.65 3.65L17.9 8"/></StrokeIcon>; }
function TrashIcon() { return <StrokeIcon><path d="M8.1 8.25h7.8l-.55 9.1a1.9 1.9 0 0 1-1.9 1.78h-2.9a1.9 1.9 0 0 1-1.9-1.78l-.55-9.1Z"/><path d="M6.2 6.4h11.6M9.35 6.4V4.85h5.3V6.4"/></StrokeIcon>; }
function CloseIcon() { return <StrokeIcon><path d="m7.5 7.5 9 9M16.5 7.5l-9 9"/></StrokeIcon>; }

const host = document.createElement("div");
host.id = "family-phone-landscape-root";
host.hidden = true;
document.body.appendChild(host);
const root = createRoot(host);
root.render(<PhoneLandscapeDemo />);

function syncLandscapeRoot() {
  const viewport = window.visualViewport;
  const width = Math.round(viewport?.width ?? window.innerWidth);
  const height = Math.round(viewport?.height ?? window.innerHeight);
  const active = width > height && width <= 1100 && height <= 560;
  document.documentElement.classList.toggle("family-phone-landscape-active", active);
  host.hidden = !active;
}

syncLandscapeRoot();
window.addEventListener("resize", syncLandscapeRoot, { passive: true });
window.addEventListener("orientationchange", syncLandscapeRoot, { passive: true });
window.visualViewport?.addEventListener("resize", syncLandscapeRoot, { passive: true });
