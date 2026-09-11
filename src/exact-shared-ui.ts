type ExactSharedWindow = Window & {
  __familyCalendarExactSharedUi?: boolean;
  __familyCalendarHomeClimateRoomIndex?: number | null;
  __familyCalendarHomeClimateRoomName?: string | null;
};

const exactWindow = window as ExactSharedWindow;
const HEADER_CONTEXT_ID = "family-calendar-exact-home-header-context";
const RUNTIME_STYLE_ID = "family-calendar-exact-shared-runtime-styles";

const runtimeStyles = `
/* Interaction state changes are intentionally immediate. The previous global
 * transition + glass combinations were repainting large blurred surfaces and
 * made every page/control transition visibly stutter. */
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

/* Keep the React CALENDARIO header as the live source, while rendering the
 * visible copy through exactly the same CASA CSS ancestry. */
main.app-shell.calendar-page-active > header.reel-topbar.shared-home-header.casa-header-contract[data-exact-source-hidden="true"] {
  display: none !important;
}

#${HEADER_CONTEXT_ID} {
  position: relative !important;
  width: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: visible !important;
  background: transparent !important;
  box-shadow: none !important;
  pointer-events: none !important;
}

#${HEADER_CONTEXT_ID} > .exact-home-header-reel {
  display: contents !important;
}

#${HEADER_CONTEXT_ID} .exact-home-header-copy,
#${HEADER_CONTEXT_ID} > .exact-home-theme-proxy {
  pointer-events: auto !important;
}

main.app-shell.home-page-active .room-head-v4,
main.app-shell.home-page-active .room-head-v4:active,
main.app-shell.home-page-active .room-head-v4 > b,
main.app-shell.home-page-active .room-head-v4 > b:active {
  animation: none !important;
  transition: none !important;
  transform: none !important;
}

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

function removeCalendarHeaderCopy() {
  document.getElementById(HEADER_CONTEXT_ID)?.remove();
  document.querySelectorAll<HTMLElement>("header[data-exact-source-hidden='true']").forEach((header) => {
    header.removeAttribute("data-exact-source-hidden");
  });
}

function syncCalendarHeader() {
  const shell = document.querySelector<HTMLElement>("main.app-shell.calendar-page-active");
  if (!shell) {
    removeCalendarHeaderCopy();
    return;
  }

  const source = shell.querySelector<HTMLElement>(":scope > header.reel-topbar.shared-home-header.casa-header-contract");
  if (!source) return;

  source.setAttribute("data-exact-source-hidden", "true");

  let context = document.getElementById(HEADER_CONTEXT_ID) as HTMLElement | null;
  if (!context) {
    context = document.createElement("div");
    context.id = HEADER_CONTEXT_ID;
    shell.insertBefore(context, source);
  } else if (context.parentElement !== shell) {
    context.remove();
    shell.insertBefore(context, source);
  }

  const night = shell.classList.contains("night");
  context.className = `app-shell home-page-active ${night ? "night" : "day"}`;

  const signature = `${source.innerHTML}|${night ? "night" : "day"}`;
  if (context.dataset.sourceSignature === signature && context.querySelector(".exact-home-header-copy")) return;

  const headerCopy = source.cloneNode(true) as HTMLElement;
  headerCopy.className = "reel-topbar exact-home-header-copy";
  headerCopy.removeAttribute("data-exact-source-hidden");
  headerCopy.removeAttribute("style");

  const sourceThemeButton = source.querySelector<HTMLButtonElement>(".header-theme-switch");
  headerCopy.querySelector(".header-theme-switch")?.remove();

  const reelContext = document.createElement("section");
  reelContext.className = "reel-home home-refactor-v4 exact-home-header-reel";
  reelContext.appendChild(headerCopy);

  const children: Node[] = [reelContext];
  if (sourceThemeButton) {
    const themeProxy = sourceThemeButton.cloneNode(true) as HTMLButtonElement;
    themeProxy.className = "global-theme-switch home-header-theme-switch exact-home-theme-proxy";
    themeProxy.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      sourceThemeButton.click();
    });
    children.push(themeProxy);
  }

  context.replaceChildren(...children);
  context.dataset.sourceSignature = signature;
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
  syncCalendarHeader();
  normalizeRoomClimateModal();
}

if (!exactWindow.__familyCalendarExactSharedUi) {
  exactWindow.__familyCalendarExactSharedUi = true;
  ensureRuntimeStyles();
  syncExactSharedUi();

  const shell = document.querySelector<HTMLElement>("main.app-shell");
  if (shell) {
    /* Only the root page/theme class matters for the header. */
    const pageObserver = new MutationObserver(syncExactSharedUi);
    pageObserver.observe(shell, { attributes: true, attributeFilter: ["class"] });

    /* React inserts/removes page content and overlays as child nodes. Watching
     * structure only is enough and runs in the mutation microtask before paint. */
    const structureObserver = new MutationObserver(syncExactSharedUi);
    structureObserver.observe(shell, { childList: true, subtree: true });
  }

  /* The source clock changes over time. A single cheap sync replaces watching
   * every character mutation in the entire UI. */
  window.setInterval(syncCalendarHeader, 1000);
}
