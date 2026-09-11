type ExactSharedWindow = Window & {
  __familyCalendarExactSharedUi?: boolean;
  __familyCalendarHomeClimateRoomIndex?: number | null;
  __familyCalendarHomeClimateRoomName?: string | null;
};

const exactWindow = window as ExactSharedWindow;
const RUNTIME_STYLE_ID = "family-calendar-exact-shared-runtime-styles";

const runtimeStyles = `
/* Keep interaction feedback immediate. The previous transition + large glass
 * surfaces caused expensive repaints and visible stutter on page changes. */
main.app-shell,
main.app-shell *,
main.app-shell *::before,
main.app-shell *::after {
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  scroll-behavior: auto !important;
}

/* Never animate the room-temperature affordance. */
main.app-shell.home-page-active .room-head-v4,
main.app-shell.home-page-active .room-head-v4:active,
main.app-shell.home-page-active .room-head-v4 > b,
main.app-shell.home-page-active .room-head-v4 > b:active {
  animation: none !important;
  transition: none !important;
  transform: none !important;
}

/* CASA room climate uses the exact CALENDARIO device-controls surface. */
.reel-backdrop.exact-calendar-climate-context {
  z-index: 2200 !important;
  padding: 0 !important;
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  animation: none !important;
  transition: none !important;
}

.reel-backdrop.exact-calendar-climate-context > .exact-home-climate-controls {
  z-index: 2201 !important;
  animation: none !important;
  transition: none !important;
}

.exact-home-climate-controls .exact-climate-grid {
  display: contents !important;
}

.exact-home-climate-controls .exact-climate-grid > :not([data-room-climate-selected="true"]) {
  display: none !important;
}

.exact-home-climate-controls .device-controls-heading .exact-device-title {
  display: block !important;
  margin: 3px 0 0 !important;
  padding: 0 !important;
  font-size: 12px !important;
  line-height: normal !important;
  font-weight: 700 !important;
  letter-spacing: normal !important;
}

.exact-home-climate-controls .climate-control-title > div > strong {
  display: none !important;
}
`;

function ensureRuntimeStyles() {
  let style = document.getElementById(RUNTIME_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = RUNTIME_STYLE_ID;
    style.textContent = runtimeStyles;
    document.head.appendChild(style);
    return;
  }
  if (style.textContent !== runtimeStyles) style.textContent = runtimeStyles;
}

/* Remove every artifact produced by the previous header-copy implementation.
 * From now on CALENDARIO renders its real SharedHeader React node directly. */
function cleanupLegacyHeaderClone() {
  document.getElementById("family-calendar-exact-home-header-context")?.remove();
  document.querySelectorAll<HTMLElement>("header[data-exact-source-hidden='true']").forEach((header) => {
    header.removeAttribute("data-exact-source-hidden");
    header.style.removeProperty("display");
  });
}

const climateObservers = new WeakMap<HTMLElement, MutationObserver>();

function keepClimateNormalized(modal: HTMLElement) {
  if (climateObservers.has(modal)) return;
  const observer = new MutationObserver(() => {
    if (!modal.isConnected) {
      observer.disconnect();
      climateObservers.delete(modal);
      return;
    }
    if (!modal.classList.contains("exact-home-climate-controls")) normalizeRoomClimateModal();
  });
  observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
  climateObservers.set(modal, observer);
}

function normalizeRoomClimateModal() {
  const shell = document.querySelector<HTMLElement>("main.app-shell.home-page-active");
  if (!shell) return;

  const roomIndex = exactWindow.__familyCalendarHomeClimateRoomIndex;
  if (typeof roomIndex !== "number" || roomIndex < 0) return;

  const modal = shell.querySelector<HTMLElement>(
    ".reel-backdrop .climate-modal.feature-modal, .reel-backdrop .exact-home-climate-controls",
  );
  if (!modal) return;

  const grid = modal.querySelector<HTMLElement>(".climate-grid, .exact-climate-grid");
  if (!grid) return;

  const children = Array.from(grid.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  const selected = children[roomIndex];
  if (!selected) return;

  children.forEach((child, index) => {
    if (index === roomIndex) {
      child.setAttribute("data-room-climate-selected", "true");
      child.style.removeProperty("display");
    } else {
      child.removeAttribute("data-room-climate-selected");
      child.style.setProperty("display", "none", "important");
    }
  });

  const roomName = exactWindow.__familyCalendarHomeClimateRoomName ?? "";
  const deviceName = selected.querySelector<HTMLElement>(".climate-control-title strong")?.textContent?.trim()
    || roomName
    || (document.documentElement.lang.toLowerCase().startsWith("it") ? "Clima" : "Climate");

  const backdrop = modal.closest<HTMLElement>(".reel-backdrop");
  if (!backdrop) return;
  backdrop.classList.add("calendar-page-active", "exact-calendar-climate-context");

  modal.className = "device-controls device-controls-climate exact-home-climate-controls";

  const heading = modal.querySelector<HTMLElement>(".modal-head, .device-controls-heading");
  if (heading) {
    heading.className = "device-controls-heading";
    const kicker = heading.querySelector<HTMLElement>(".reel-kicker, .section-kicker");
    if (kicker) {
      kicker.className = "section-kicker";
      kicker.textContent = document.documentElement.lang.toLowerCase().startsWith("it") ? "CONTROLLI" : "CONTROLS";
    }
    const title = heading.querySelector<HTMLElement>("h2, .exact-device-title");
    if (title) {
      title.className = "exact-device-title";
      title.textContent = deviceName;
    }
    const close = heading.querySelector<HTMLButtonElement>("button");
    if (close) close.removeAttribute("class");
  }

  grid.classList.add("exact-climate-grid");
  selected.classList.add("climate-compact");
  selected.classList.remove("climate-full");
  selected.querySelector<HTMLElement>(".climate-control-title > div > strong")?.style.setProperty("display", "none", "important");

  keepClimateNormalized(modal);
}

function syncExactSharedUi() {
  ensureRuntimeStyles();
  cleanupLegacyHeaderClone();
  normalizeRoomClimateModal();
}

if (!exactWindow.__familyCalendarExactSharedUi) {
  exactWindow.__familyCalendarExactSharedUi = true;
  syncExactSharedUi();

  const shell = document.querySelector<HTMLElement>("main.app-shell");
  if (shell) {
    /* Child insertion is observed only to normalize a newly mounted climate
     * popup in the same mutation microtask, before the browser paints it. */
    const structureObserver = new MutationObserver(syncExactSharedUi);
    structureObserver.observe(shell, { childList: true, subtree: true });
  }
}
