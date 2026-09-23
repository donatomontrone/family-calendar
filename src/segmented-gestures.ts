type GestureState = {
  control: HTMLElement;
  buttons: HTMLButtonElement[];
  pressedButton: HTMLButtonElement | null;
  pointerId: number;
  startX: number;
  startOffset: number;
  currentOffset: number;
  maxOffset: number;
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


  const syncRestOffset = (control: HTMLElement, preferredButton?: HTMLButtonElement | null) => {
    const buttons = directButtons(control);
    if (buttons.length < 2) return;

    const firstLeft = buttons[0]?.offsetLeft ?? 0;
    const activeButton = preferredButton ?? buttons.find((button) => button.classList.contains("active")) ?? buttons[0];
    const offset = Math.max(0, activeButton.offsetLeft - firstLeft);
    control.style.setProperty("--segment-rest-offset", `${offset}px`);
  };

  const syncAllRestOffsets = () => {
    document.querySelectorAll<HTMLElement>(
      ".segmented-control, .page-dock, .desktop-room-mode-v32, .room-light-mode-v4",
    ).forEach((control) => syncRestOffset(control));
  };

  const controlFromTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    return target.closest<HTMLElement>(
      ".segmented-control, .page-dock, .desktop-room-mode-v32, .room-light-mode-v4",
    );
  };

  const buttonFromTarget = (target: EventTarget | null, control: HTMLElement) => {
    if (!(target instanceof Element)) return null;
    const button = target.closest<HTMLButtonElement>("button");
    return button && button.parentElement === control ? button : null;
  };

  const offsetsFor = (buttons: HTMLButtonElement[]) => {
    const firstLeft = buttons[0]?.offsetLeft ?? 0;
    return buttons.map((button) => button.offsetLeft - firstLeft);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    const control = controlFromTarget(event.target);
    if (!control) return;

    const buttons = directButtons(control);
    if (buttons.length < 2) return;

    const activeIndex = Math.max(0, buttons.findIndex((button) => button.classList.contains("active")));
    const offsets = offsetsFor(buttons);
    syncRestOffset(control, buttons[activeIndex] ?? buttons[0]);
    const startOffset = offsets[activeIndex] ?? 0;
    const maxOffset = offsets[offsets.length - 1] ?? 0;

    gesture = {
      control,
      buttons,
      pressedButton: buttonFromTarget(event.target, control),
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset,
      currentOffset: startOffset,
      maxOffset,
      moved: false,
    };

    control.style.setProperty("--segment-drag-offset", `${startOffset}px`);

    try {
      control.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an enhancement; document listeners still work.
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    const delta = event.clientX - gesture.startX;
    if (!gesture.moved && Math.abs(delta) > 5) {
      gesture.moved = true;
      gesture.control.classList.add("segment-dragging");
    }

    if (!gesture.moved) return;

    event.preventDefault();
    const nextOffset = Math.max(0, Math.min(gesture.maxOffset, gesture.startOffset + delta));
    gesture.currentOffset = nextOffset;
    gesture.control.style.setProperty("--segment-drag-offset", `${nextOffset}px`);
  };

  const settleTimers = new WeakMap<HTMLElement, number>();

  const invokeButton = (
    control: HTMLElement,
    button: HTMLButtonElement | undefined | null,
    fromOffset: number,
  ) => {
    if (!button || button.disabled) return;

    const buttons = directButtons(control);
    const targetIndex = buttons.indexOf(button);
    if (targetIndex < 0) return;

    const offsets = offsetsFor(buttons);
    const maxOffset = offsets[offsets.length - 1] ?? 0;
    const startOffset = Math.max(0, Math.min(maxOffset, fromOffset));
    const targetOffset = offsets[targetIndex] ?? 0;
    const previousTimer = settleTimers.get(control);
    if (previousTimer !== undefined) window.clearTimeout(previousTimer);

    const cleanup = () => {
      settleTimers.delete(control);
      syncRestOffset(control, button);
      control.classList.remove("segment-dragging", "segment-settling");
      control.style.removeProperty("--segment-drag-offset");
      control.style.removeProperty("--segment-settle-offset");
    };

    suppressClick = { control, until: performance.now() + 360 };

    if (
      Math.abs(targetOffset - startOffset) < 0.5 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      control.style.setProperty("--segment-rest-offset", `${targetOffset}px`);
      button.click();
      cleanup();
      return;
    }

    // Freeze the thumb exactly where the gesture started/ended, let React
    // commit the new active button, then animate to the target on the next
    // paint. This makes both directions identical instead of depending on
    // :has() and React's commit timing.
    control.classList.add("segment-settling");
    control.style.setProperty("--segment-settle-offset", `${startOffset}px`);
    control.style.setProperty("--segment-rest-offset", `${targetOffset}px`);
    button.click();

    requestAnimationFrame(() => {
      control.classList.remove("segment-dragging");
      control.style.removeProperty("--segment-drag-offset");

      requestAnimationFrame(() => {
        control.style.setProperty("--segment-settle-offset", `${targetOffset}px`);
        const timer = window.setTimeout(cleanup, 340);
        settleTimers.set(control, timer);
      });
    });
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

    if (!cancelled) {
      if (current.moved) {
        event.preventDefault();
        const offsets = offsetsFor(current.buttons);
        let targetIndex = 0;
        let smallestDistance = Number.POSITIVE_INFINITY;

        offsets.forEach((offset, index) => {
          const distance = Math.abs(offset - current.currentOffset);
          if (distance < smallestDistance) {
            smallestDistance = distance;
            targetIndex = index;
          }
        });

        invokeButton(current.control, current.buttons[targetIndex], current.currentOffset);
        return;
      }

      if (current.pressedButton) {
        event.preventDefault();
        invokeButton(current.control, current.pressedButton, current.startOffset);
        return;
      }
    }

    requestAnimationFrame(() => {
      current.control.classList.remove("segment-dragging", "segment-settling");
      current.control.style.removeProperty("--segment-drag-offset");
      current.control.style.removeProperty("--segment-settle-offset");
      syncRestOffset(current.control);
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

  syncAllRestOffsets();
  document.addEventListener("family-calendar-responsive-sync", syncAllRestOffsets);

  const segmentedObserver = new MutationObserver((mutations) => {
    const controls = new Set<HTMLElement>();

    mutations.forEach((mutation) => {
      if (!(mutation.target instanceof Element)) return;
      const control = mutation.target.closest<HTMLElement>(
        ".segmented-control, .page-dock, .desktop-room-mode-v32, .room-light-mode-v4",
      );
      if (control) controls.add(control);
    });

    controls.forEach((control) => syncRestOffset(control));
  });

  segmentedObserver.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
  });

  window.addEventListener("resize", syncAllRestOffsets, { passive: true });
}
