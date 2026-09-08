type RoomDragState = {
  strip: HTMLElement;
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
};

type UiWindow = Window & {
  __familyCalendarUiInteractions?: boolean;
};

const uiWindow = window as UiWindow;

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

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const strip = roomStripFromTarget(event.target);
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return;

    drag = {
      strip,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: strip.scrollLeft,
      moved: false,
    };

    try {
      strip.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an enhancement; document listeners still handle the drag.
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const delta = event.clientX - drag.startX;

    if (!drag.moved && Math.abs(delta) > 5) {
      drag.moved = true;
      drag.strip.classList.add("is-horizontal-dragging");
    }

    if (!drag.moved) return;
    event.preventDefault();
    drag.strip.scrollLeft = drag.startScrollLeft - delta;
  };

  const finishPointer = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = drag;
    drag = null;

    try {
      current.strip.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore browsers that release capture automatically.
    }

    if (current.moved) {
      event.preventDefault();
      suppressRoomClickUntil = performance.now() + 250;
    }

    requestAnimationFrame(() => current.strip.classList.remove("is-horizontal-dragging"));
  };

  const onWheel = (event: WheelEvent) => {
    const strip = roomStripFromTarget(event.target);
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    const max = strip.scrollWidth - strip.clientWidth;
    const next = Math.max(0, Math.min(max, strip.scrollLeft + event.deltaY));
    if (next === strip.scrollLeft) return;

    event.preventDefault();
    strip.scrollLeft = next;
  };

  const syncSegmentWidth = () => {
    const taskSegment = document.querySelector<HTMLElement>(".tasks-card .segmented-control");
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

  const mutationObserver = new MutationObserver(() => requestAnimationFrame(syncSegmentWidth));
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
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

  requestAnimationFrame(syncSegmentWidth);
}
