import calendarV4Styles from "./calendar-v4.css?inline";
import calendarV5Styles from "./calendar-v5.css?inline";
import calendarV6Styles from "./calendar-v6.css?inline";
import calendarV7Styles from "./calendar-v7.css?inline";
import calendarV8Styles from "./calendar-v8.css?inline";
import calendarV9Styles from "./calendar-v9.css?inline";
import calendarV10Styles from "./calendar-v10.css?inline";
import calendarV11Styles from "./calendar-v11.css?inline";
import calendarV12Styles from "./calendar-v12.css?inline";
import calendarV13Styles from "./calendar-v13.css?inline";

type RoomDragState = {
  strip: HTMLElement;
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
};

type CalendarSegment = {
  element: HTMLElement;
  dayIndex: number;
  label: string;
  tone: string;
};

type UiWindow = Window & {
  __familyCalendarUiInteractions?: boolean;
  __familyCalendarHeaderActionHandler?: EventListener;
};

const uiWindow = window as UiWindow;
const FINAL_STYLE_ID = "family-calendar-v4-styles";
const finalStyles = `${calendarV4Styles}\n${calendarV5Styles}\n${calendarV6Styles}\n${calendarV7Styles}\n${calendarV8Styles}\n${calendarV9Styles}\n${calendarV10Styles}\n${calendarV11Styles}\n${calendarV12Styles}\n${calendarV13Styles}`;
const CALENDAR_TONES = ["mint", "blue", "amber", "violet"];

function ensureFinalStyles() {
  let style = document.getElementById(FINAL_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = FINAL_STYLE_ID;
  }
  if (style.textContent !== finalStyles) style.textContent = finalStyles;

  // Keep the final calendar contract physically last. The HA panel can inject
  // its bundled stylesheet after this module has initially executed.
  if (style.parentElement !== document.head || style !== document.head.lastElementChild) {
    document.head.appendChild(style);
  }
}

function eventLabel(element: HTMLElement) {
  const continuation = element.querySelector<HTMLElement>(".continuation");
  if (continuation?.textContent?.trim()) return continuation.textContent.trim();

  let label = element.textContent?.trim() ?? "";
  const time = element.querySelector<HTMLElement>(":scope > span:not(.continuation)")?.textContent?.trim();
  if (time && label.startsWith(time)) label = label.slice(time.length).trim();
  return label;
}

function eventTone(element: HTMLElement) {
  return CALENDAR_TONES.find((tone) => element.classList.contains(tone)) ?? "mint";
}

function syncCalendarEventBridges() {
  const grid = document.querySelector<HTMLElement>(".app-shell.calendar-page-active .month-grid");
  if (!grid) return;

  const days = Array.from(grid.querySelectorAll<HTMLElement>(":scope > .calendar-day"));
  if (days.length === 0) return;

  const originals = days.flatMap((day) => Array.from(day.querySelectorAll<HTMLElement>(".calendar-event")));
  originals.forEach((element) => element.classList.remove("is-bridged"));

  let layer = grid.querySelector<HTMLElement>(":scope > .calendar-event-bridge-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "calendar-event-bridge-layer";
    layer.setAttribute("aria-hidden", "true");
    grid.appendChild(layer);
  }
  layer.replaceChildren();

  const dayIndex = new Map<HTMLElement, number>();
  days.forEach((day, index) => dayIndex.set(day, index));

  const segments: CalendarSegment[] = [];
  originals.forEach((element) => {
    if (!element.classList.contains("continues-before") && !element.classList.contains("continues-after")) return;
    const day = element.closest<HTMLElement>(".calendar-day");
    const index = day ? dayIndex.get(day) : undefined;
    if (index === undefined) return;
    const label = eventLabel(element);
    segments.push({ element, dayIndex: index, label, tone: eventTone(element) });
  });

  const groups = new Map<string, CalendarSegment[]>();
  segments.forEach((segment) => {
    const key = `${segment.tone}\u0000${segment.label}`;
    const group = groups.get(key) ?? [];
    group.push(segment);
    groups.set(key, group);
  });

  const gridRect = grid.getBoundingClientRect();

  groups.forEach((group) => {
    group.sort((a, b) => a.dayIndex - b.dayIndex);

    const sequences: CalendarSegment[][] = [];
    let sequence: CalendarSegment[] = [];
    group.forEach((segment) => {
      const previous = sequence[sequence.length - 1];
      if (previous && segment.dayIndex !== previous.dayIndex + 1) {
        sequences.push(sequence);
        sequence = [];
      }
      sequence.push(segment);
    });
    if (sequence.length) sequences.push(sequence);

    sequences.forEach((continuous) => {
      if (continuous.length === 0) return;
      continuous.forEach((segment) => segment.element.classList.add("is-bridged"));

      let runStart = 0;
      for (let index = 0; index < continuous.length; index += 1) {
        const current = continuous[index];
        const next = continuous[index + 1];
        const closesWeek = current.dayIndex % 7 === 6;
        const closesSequence = !next;
        if (!closesWeek && !closesSequence) continue;

        const run = continuous.slice(runStart, index + 1);
        const first = run[0];
        const last = run[run.length - 1];
        const firstRect = first.element.getBoundingClientRect();
        const lastRect = last.element.getBoundingClientRect();
        if (firstRect.width <= 0 || firstRect.height <= 0 || lastRect.width <= 0) {
          runStart = index + 1;
          continue;
        }

        const bridge = document.createElement("div");
        bridge.className = `calendar-event calendar-event-bridge ${first.tone}`;
        if (first.element.classList.contains("continues-before")) bridge.classList.add("bridge-continues-before");
        if (last.element.classList.contains("continues-after")) bridge.classList.add("bridge-continues-after");

        bridge.style.left = `${firstRect.left - gridRect.left}px`;
        bridge.style.top = `${firstRect.top - gridRect.top}px`;
        bridge.style.width = `${lastRect.right - firstRect.left}px`;
        bridge.style.height = `${firstRect.height}px`;

        // Exactly one visible label per event. If the real start is outside the
        // visible 42-day window, label the first visible weekly segment instead.
        if (runStart === 0) {
          const firstOriginal = continuous[0].element;
          const time = firstOriginal.querySelector<HTMLElement>(":scope > span:not(.continuation)")?.textContent?.trim();
          if (time && !firstOriginal.classList.contains("continues-before")) {
            const timeElement = document.createElement("span");
            timeElement.textContent = time;
            bridge.append(timeElement, document.createTextNode(` ${first.label}`));
          } else {
            bridge.textContent = first.label;
          }
        }

        layer?.appendChild(bridge);
        runStart = index + 1;
      }
    });
  });
}

/*
 * Header actions are deliberately installed outside the one-time interaction
 * guard. Vite HMR keeps window state alive, so an older guarded listener could
 * otherwise survive a code update and leave Alarm/Notifications unresponsive.
 */
if (uiWindow.__familyCalendarHeaderActionHandler) {
  document.removeEventListener("click", uiWindow.__familyCalendarHeaderActionHandler, true);
}

const headerActionHandler: EventListener = (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>(".security-pill, .round-top");
  if (!button || !button.closest(".app-shell")) return;

  const action = button.classList.contains("security-pill") ? "alarm" : "notifications";
  event.preventDefault();
  event.stopImmediatePropagation();
  document.dispatchEvent(new CustomEvent("family-calendar-header-action", { detail: action }));
};

uiWindow.__familyCalendarHeaderActionHandler = headerActionHandler;
document.addEventListener("click", headerActionHandler, true);

if (!uiWindow.__familyCalendarUiInteractions) {
  uiWindow.__familyCalendarUiInteractions = true;

  let drag: RoomDragState | null = null;
  let suppressRoomClickUntil = 0;
  let observedTaskSegment: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let uiSyncFrame = 0;

  const roomStripFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    return target.closest<HTMLElement>(".room-chip-strip");
  };

  const syncSegmentWidth = () => {
    const taskSegment = document.querySelector<HTMLElement>(".tasks-card .task-segmented-control, .tasks-card .segmented-control");
    if (!taskSegment) return;

    if (taskSegment !== observedTaskSegment) {
      resizeObserver?.disconnect();
      observedTaskSegment = taskSegment;
      resizeObserver = new ResizeObserver(() => syncSegmentWidth());
      resizeObserver.observe(taskSegment);
    }

    const width = taskSegment.getBoundingClientRect().width;
    if (width > 0) {
      document.documentElement.style.setProperty("--family-calendar-segment-width", `${Math.round(width * 100) / 100}px`);
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const strip = roomStripFromTarget(event.target);
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return;

    // Do not capture on pointer-down. Capturing immediately retargets pointer-up
    // to the strip and prevents the room button from receiving its normal click.
    // Capture begins only after we know the user is actually dragging.
    drag = {
      strip,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: strip.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const delta = event.clientX - drag.startX;

    if (!drag.moved && Math.abs(delta) > 4) {
      drag.moved = true;
      drag.strip.classList.add("is-horizontal-dragging");
      try {
        drag.strip.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is an enhancement; document listeners still work.
      }
    }

    if (!drag.moved) return;
    event.preventDefault();
    drag.strip.scrollLeft = drag.startScrollLeft - delta;
  };

  const finishPointer = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = drag;
    drag = null;

    if (current.moved) {
      try {
        current.strip.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore browsers that release capture automatically.
      }
      event.preventDefault();
      suppressRoomClickUntil = performance.now() + 280;
    }

    requestAnimationFrame(() => current.strip.classList.remove("is-horizontal-dragging"));
  };

  const onWheel = (event: WheelEvent) => {
    const strip = roomStripFromTarget(event.target);
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;

    const max = strip.scrollWidth - strip.clientWidth;
    const next = Math.max(0, Math.min(max, strip.scrollLeft + delta));
    if (next === strip.scrollLeft) return;

    event.preventDefault();
    strip.scrollLeft = next;
  };

  const scheduleUiSync = () => {
    if (uiSyncFrame) cancelAnimationFrame(uiSyncFrame);
    uiSyncFrame = requestAnimationFrame(() => {
      uiSyncFrame = 0;
      ensureFinalStyles();
      syncSegmentWidth();
      syncCalendarEventBridges();
    });
  };

  const mutationObserver = new MutationObserver((mutations) => {
    const meaningfulMutation = mutations.some((mutation) => {
      if (mutation.target instanceof Element && mutation.target.closest(".calendar-event-bridge-layer")) return false;
      const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
      if (changedNodes.length === 0) return true;
      return changedNodes.some((node) => !(node instanceof Element && node.matches(".calendar-event-bridge-layer")));
    });
    if (meaningfulMutation) scheduleUiSync();
  });
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: false });
  document.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
  document.addEventListener("pointerup", finishPointer, { capture: true, passive: false });
  document.addEventListener("pointercancel", finishPointer, { capture: true, passive: false });
  document.addEventListener("wheel", onWheel, { capture: true, passive: false });
  window.addEventListener("resize", scheduleUiSync, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleUiSync, { passive: true });
  document.addEventListener("click", (event) => {
    if (!event.isTrusted || performance.now() > suppressRoomClickUntil) return;
    if (!roomStripFromTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  scheduleUiSync();
} else {
  // Even on HMR/module re-evaluation, refresh the final style layer and measured
  // calendar bridges immediately.
  ensureFinalStyles();
  requestAnimationFrame(syncCalendarEventBridges);
}
