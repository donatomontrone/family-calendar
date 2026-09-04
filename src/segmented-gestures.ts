type GestureState = {
  control: HTMLElement;
  buttons: HTMLButtonElement[];
  pointerId: number;
  startX: number;
  startOffset: number;
  currentOffset: number;
  maxOffset: number;
  activeIndex: number;
  moved: boolean;
};

type GestureWindow = Window & {
  __familyCalendarSegmentedGestures?: boolean;
};

const gestureWindow = window as GestureWindow;

if (!gestureWindow.__familyCalendarSegmentedGestures) {
  gestureWindow.__familyCalendarSegmentedGestures = true;

  let gesture: GestureState | null = null;
  let suppressClick: { control: HTMLElement; until: number } | null = null;

  const directButtons = (control: HTMLElement) =>
    Array.from(control.children).filter((child): child is HTMLButtonElement => child instanceof HTMLButtonElement);

  const controlFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    return target.closest<HTMLElement>(".page-dock, .segmented-control");
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    const control = controlFromTarget(event.target);
    if (!control) return;

    const buttons = directButtons(control);
    if (buttons.length < 2) return;

    const activeIndex = Math.max(0, buttons.findIndex((button) => button.classList.contains("active")));
    const firstLeft = buttons[0].offsetLeft;
    const offsets = buttons.map((button) => button.offsetLeft - firstLeft);
    const startOffset = offsets[activeIndex] ?? 0;
    const maxOffset = offsets[offsets.length - 1] ?? 0;

    gesture = {
      control,
      buttons,
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset,
      currentOffset: startOffset,
      maxOffset,
      activeIndex,
      moved: false,
    };

    control.style.setProperty("--segment-drag-offset", `${startOffset}px`);

    try {
      control.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is only an enhancement; document listeners still work.
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    const delta = event.clientX - gesture.startX;
    if (Math.abs(delta) > 4) {
      gesture.moved = true;
      gesture.control.classList.add("segment-dragging");
      event.preventDefault();
    }

    if (!gesture.moved) return;

    const nextOffset = Math.max(0, Math.min(gesture.maxOffset, gesture.startOffset + delta));
    gesture.currentOffset = nextOffset;
    gesture.control.style.setProperty("--segment-drag-offset", `${nextOffset}px`);
  };

  const finishGesture = (event: PointerEvent, cancelled = false) => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    const current = gesture;
    gesture = null;

    try {
      current.control.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore browsers that already released pointer capture.
    }

    if (current.moved) {
      event.preventDefault();

      if (!cancelled) {
        const firstLeft = current.buttons[0].offsetLeft;
        const offsets = current.buttons.map((button) => button.offsetLeft - firstLeft);
        let targetIndex = 0;
        let smallestDistance = Number.POSITIVE_INFINITY;

        offsets.forEach((offset, index) => {
          const distance = Math.abs(offset - current.currentOffset);
          if (distance < smallestDistance) {
            smallestDistance = distance;
            targetIndex = index;
          }
        });

        suppressClick = { control: current.control, until: performance.now() + 350 };
        if (targetIndex !== current.activeIndex) current.buttons[targetIndex]?.click();
      }
    }

    requestAnimationFrame(() => {
      current.control.classList.remove("segment-dragging");
      current.control.style.removeProperty("--segment-drag-offset");
    });
  };

  document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: false });
  document.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
  document.addEventListener("pointerup", (event) => finishGesture(event), { capture: true, passive: false });
  document.addEventListener("pointercancel", (event) => finishGesture(event, true), { capture: true, passive: false });

  document.addEventListener("click", (event) => {
    if (!event.isTrusted || !suppressClick) return;
    if (performance.now() > suppressClick.until) {
      suppressClick = null;
      return;
    }

    const control = controlFromTarget(event.target);
    if (control !== suppressClick.control) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = null;
  }, true);
}
