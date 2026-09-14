const DESKTOP_QUERY = "(min-width: 701px)";
const ROOM_GRID_SELECTOR = ".app-shell.home-page-active .reel-home.home-refactor-v4 .reel-room-grid";
const INTERACTIVE_SELECTOR = "button, input, select, textarea, label, a";

type DragState = {
  grid: HTMLElement;
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
};

type CarouselWindow = Window & {
  __familyCalendarDesktopRoomCarouselV25?: boolean;
};

const carouselWindow = window as CarouselWindow;
let drag: DragState | null = null;
let wheelLockedUntil = 0;

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function roomGridFromTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(ROOM_GRID_SELECTOR);
}

function maxPage(grid: HTMLElement) {
  if (grid.clientWidth <= 0) return 0;
  return Math.max(0, Math.ceil((grid.scrollWidth - grid.clientWidth) / grid.clientWidth));
}

function goToPage(grid: HTMLElement, page: number, behavior: ScrollBehavior = "smooth") {
  const next = Math.max(0, Math.min(maxPage(grid), page));
  grid.scrollTo({ left: next * grid.clientWidth, behavior });
}

function currentPage(grid: HTMLElement) {
  if (grid.clientWidth <= 0) return 0;
  return Math.round(grid.scrollLeft / grid.clientWidth);
}

function snapToNearestPage(grid: HTMLElement) {
  goToPage(grid, currentPage(grid));
}

function annotateReadableItem(target: Element) {
  const item = target.closest<HTMLElement>(".room-device-button-v4, .room-passive-device-v4");
  if (!item || item.title) return;
  const name = item.querySelector<HTMLElement>("strong")?.textContent?.trim();
  const status = item.querySelector<HTMLElement>("small")?.textContent?.trim();
  const title = [name, status].filter(Boolean).join(" · ");
  if (title) item.title = title;
}

function onWheel(event: WheelEvent) {
  if (!isDesktop()) return;
  const grid = roomGridFromTarget(event.target);
  if (!grid || grid.scrollWidth <= grid.clientWidth + 1) return;
  if (event.target instanceof Element && event.target.closest('input[type="range"]')) return;

  const dominant = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (Math.abs(dominant) < 2) return;

  event.preventDefault();
  const now = performance.now();
  if (now < wheelLockedUntil) return;

  const direction = dominant > 0 ? 1 : -1;
  goToPage(grid, currentPage(grid) + direction);
  wheelLockedUntil = now + 320;
}

function onPointerDown(event: PointerEvent) {
  if (!isDesktop() || event.button !== 0) return;
  const grid = roomGridFromTarget(event.target);
  if (!grid || grid.scrollWidth <= grid.clientWidth + 1) return;
  if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;

  drag = {
    grid,
    pointerId: event.pointerId,
    startX: event.clientX,
    startScrollLeft: grid.scrollLeft,
    moved: false,
  };
  grid.classList.add("is-dragging-v25");
  grid.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const delta = event.clientX - drag.startX;
  if (Math.abs(delta) > 3) drag.moved = true;
  if (!drag.moved) return;
  event.preventDefault();
  drag.grid.scrollLeft = drag.startScrollLeft - delta;
}

function finishDrag(event: PointerEvent) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const { grid } = drag;
  grid.releasePointerCapture?.(event.pointerId);
  grid.classList.remove("is-dragging-v25");
  drag = null;
  snapToNearestPage(grid);
}

function onKeyDown(event: KeyboardEvent) {
  if (!isDesktop()) return;
  const grid = roomGridFromTarget(event.target);
  if (!grid || grid.scrollWidth <= grid.clientWidth + 1) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  goToPage(grid, currentPage(grid) + (event.key === "ArrowRight" ? 1 : -1));
}

function onPointerOver(event: PointerEvent) {
  if (!isDesktop() || !(event.target instanceof Element)) return;
  const grid = roomGridFromTarget(event.target);
  if (grid && grid.tabIndex < 0) {
    grid.tabIndex = 0;
    grid.setAttribute("aria-label", "Stanze. Usa la rotellina, trascina oppure usa le frecce per cambiare pagina.");
  }
  annotateReadableItem(event.target);
}

if (!carouselWindow.__familyCalendarDesktopRoomCarouselV25) {
  carouselWindow.__familyCalendarDesktopRoomCarouselV25 = true;
  document.addEventListener("wheel", onWheel, { passive: false });
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointermove", onPointerMove, { passive: false });
  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("pointerover", onPointerOver);
}
