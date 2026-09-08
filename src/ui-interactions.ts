import calendarV4Styles from "./calendar-v4.css?inline";
import calendarV5Styles from "./calendar-v5.css?inline";
import calendarV6Styles from "./calendar-v6.css?inline";
import calendarV7Styles from "./calendar-v7.css?inline";

type RoomDragState = {
  strip: HTMLElement;
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
};

type UiWindow = Window & {
  __familyCalendarUiInteractions?: boolean;
  __familyCalendarHeaderActionHandler?: EventListener;
};

const uiWindow = window as UiWindow;
const FINAL_STYLE_ID = "family-calendar-v4-styles";
const finalStyles = `${calendarV4Styles}\n${calendarV5Styles}\n${calendarV6Styles}\n${calendarV7Styles}`;

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
    requestAnimationFrame(() => {
      ensureFinalStyles();
      syncSegmentWidth();
    });
  };

  const mutationObserver = new MutationObserver(scheduleUiSync);
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: false });
  document.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
  document.addEventListener("pointerup", finishPointer, { capture: true, passive: false });
  document.addEventListener("pointercancel", finishPointer, { capture: true, passive: false });
  document.addEventListener("wheel", onWheel, { capture: true, passive: false });
  document.addEventListener("click", (event) => {
    if (!event.isTrusted || performance.now() > suppressRoomClickUntil) return;
    if (!roomStripFromTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  scheduleUiSync();
} else {
  // Even on HMR/module re-evaluation, refresh the final style layer immediately.
  ensureFinalStyles();
}
