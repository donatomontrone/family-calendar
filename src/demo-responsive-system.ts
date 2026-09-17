import responsiveStyles from "./demo-responsive-system.css?inline";
import statusConsistencyStyles from "./demo-status-consistency-v45.css?inline";

const STYLE_ID = "family-calendar-demo-responsive-system";
const LEGACY_STYLE_ID = "family-calendar-demo-phone-landscape-final";

/*
 * A few legacy project styles are injected from SharedHeader itself, after the
 * normal Vite stylesheet order.  These rules are part of the SAME exclusive
 * responsive contract and deliberately use the root viewport attribute plus
 * the real component IDs so those late legacy declarations cannot re-enable a
 * second layout model.
 */
const responsiveRootOverrides = String.raw`
/* Natural document flow for every intermediate screen. Never crop information
 * to 100dvh merely to keep the whole dashboard above the fold. */
html:is([data-demo-viewport="desktop"],[data-demo-viewport="compact"],[data-demo-viewport="tablet"]) body #root > main.app-shell {
  height: auto !important;
  min-height: 100dvh !important;
  max-height: none !important;
  grid-template-rows: auto auto !important;
  align-content: start !important;
  overflow-x: hidden !important;
  overflow-y: visible !important;
}

html:is([data-demo-viewport="desktop"],[data-demo-viewport="compact"],[data-demo-viewport="tablet"]) body #root > main.app-shell > #family-shared-header-host {
  height: 68px !important;
  min-height: 68px !important;
  max-height: 68px !important;
  margin: 0 0 12px !important;
}

html:is([data-demo-viewport="desktop"],[data-demo-viewport="compact"],[data-demo-viewport="tablet"]) body #root > main.app-shell > #family-shared-header-host > #family-shared-header {
  height: 68px !important;
  min-height: 68px !important;
  max-height: 68px !important;
  padding: 5px 6px 9px !important;
  grid-template-rows: 54px !important;
  grid-auto-rows: 0 !important;
  align-items: center !important;
  overflow: visible !important;
}

html[data-demo-viewport="tablet"] body #root > main.app-shell > #family-shared-header-host,
html[data-demo-viewport="tablet"] body #root > main.app-shell > #family-shared-header-host > #family-shared-header {
  height: 62px !important;
  min-height: 62px !important;
  max-height: 62px !important;
}

html[data-demo-viewport="tablet"] body #root > main.app-shell > #family-shared-header-host > #family-shared-header {
  padding: 4px 5px 8px !important;
  grid-template-rows: 50px !important;
}

/* Explicit natural rows prevent a legacy 100dvh grid from distributing equal
 * fractions and placing Calendar on top of Agenda/Lists. */
html[data-demo-viewport="desktop"] body #root > main.app-shell.calendar-page-active > .dashboard-grid {
  height: auto !important;
  grid-template-rows: auto auto !important;
}
html[data-demo-viewport="compact"] body #root > main.app-shell.calendar-page-active > .dashboard-grid {
  height: auto !important;
  grid-template-rows: auto auto !important;
}
html[data-demo-viewport="tablet"] body #root > main.app-shell.calendar-page-active > .dashboard-grid {
  height: auto !important;
  grid-template-rows: auto auto auto !important;
}

/* Typography contract for non-XL desktop/tablet.  It intentionally avoids the
 * 7–9px legacy labels that were only tolerable on the 32-inch composition. */
html:is([data-demo-viewport="desktop"],[data-demo-viewport="compact"],[data-demo-viewport="tablet"]) body #root main.app-shell.home-page-active .desktop-room-tab-copy-v26 strong {
  font-size: 11.5px !important;
  line-height: 1.12 !important;
}
html:is([data-demo-viewport="desktop"],[data-demo-viewport="compact"],[data-demo-viewport="tablet"]) body #root main.app-shell.home-page-active :is(
  .desktop-room-tab-copy-v26 small,
  .desktop-room-section-head-v32 small,
  .desktop-room-device-v32 small,
  .desktop-room-status-row-v32 small,
  .room-device-button-v4 small,
  .room-passive-device-v4 small,
  .alarm-row small,
  .waste-value small,
  .thermostat-v4-stats small,
  .house-message span,
  .reel-tools-grid span
) {
  font-size: 10px !important;
  line-height: 1.2 !important;
}
html:is([data-demo-viewport="desktop"],[data-demo-viewport="compact"],[data-demo-viewport="tablet"]) body #root main.app-shell.home-page-active :is(
  .desktop-room-device-v32 strong,
  .desktop-room-status-row-v32 strong,
  .room-device-button-v4 strong,
  .room-passive-device-v4 strong
) {
  font-size: 11.5px !important;
  line-height: 1.15 !important;
}
html:is([data-demo-viewport="desktop"],[data-demo-viewport="compact"],[data-demo-viewport="tablet"]) body #root main.app-shell.calendar-page-active .entity-main strong {
  font-size: 11px !important;
  line-height: 1.15 !important;
}
html:is([data-demo-viewport="desktop"],[data-demo-viewport="compact"],[data-demo-viewport="tablet"]) body #root main.app-shell.calendar-page-active .entity-main small {
  font-size: 10px !important;
  line-height: 1.15 !important;
}

/* Phone landscape is a single exclusive contract.  Beat the historical
 * SharedHeader/mobile media rules that are injected later in the React tree. */
html[data-demo-viewport="phone-landscape"] body #root > main.app-shell > #family-shared-header-host,
html[data-demo-viewport="phone-landscape"] body #root > main.app-shell > #family-shared-header-host > #family-shared-header {
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
}
html[data-demo-viewport="phone-landscape"] body #root > main.app-shell > #family-shared-header-host > #family-shared-header {
  padding: 0 2px !important;
  grid-template-columns: minmax(86px, 1fr) auto minmax(86px, 1fr) !important;
  grid-template-rows: 32px !important;
  grid-auto-rows: 0 !important;
  row-gap: 0 !important;
  overflow: visible !important;
}
html[data-demo-viewport="phone-landscape"] body #root #family-shared-header .reel-clock {
  position: static !important;
  inset: auto !important;
  grid-column: 2 !important;
  grid-row: 1 !important;
  align-self: center !important;
  justify-self: center !important;
  margin: 0 !important;
  transform: none !important;
  font-size: 16px !important;
  line-height: 1 !important;
}
html[data-demo-viewport="phone-landscape"] body #root #family-shared-header .reel-top-actions {
  position: static !important;
  inset: auto !important;
  grid-column: 3 !important;
  grid-row: 1 !important;
  align-self: center !important;
  justify-self: end !important;
  transform: none !important;
}

html[data-demo-viewport="phone-landscape"] body #root main.app-shell.calendar-page-active .calendar-toolbar h1 {
  margin: 0 !important;
  font-size: 13.5px !important;
  line-height: 1 !important;
}
html[data-demo-viewport="phone-landscape"] body #root main.app-shell.calendar-page-active .month-grid {
  height: 100% !important;
  min-height: 0 !important;
  max-height: 100% !important;
  grid-template-rows: 18px repeat(6, minmax(0, 1fr)) !important;
  overflow: hidden !important;
}
html[data-demo-viewport="phone-landscape"] body #root main.app-shell.calendar-page-active .weekday {
  min-height: 0 !important;
  height: auto !important;
  padding: 4px 2px 2px !important;
  font-size: 8px !important;
  line-height: 1 !important;
}
html[data-demo-viewport="phone-landscape"] body #root main.app-shell.calendar-page-active .calendar-day {
  min-width: 0 !important;
  min-height: 0 !important;
  height: auto !important;
  padding: 3px !important;
  overflow: hidden !important;
}
html[data-demo-viewport="phone-landscape"] body #root main.app-shell.calendar-page-active .calendar-event {
  width: 100% !important;
  min-width: 0 !important;
  height: 11px !important;
  min-height: 11px !important;
  max-height: 11px !important;
  padding: 0 3px !important;
  border-radius: 4px !important;
  overflow: hidden !important;
  font-size: 7.8px !important;
  line-height: 11px !important;
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
}
`;

const css = `${statusConsistencyStyles}\n${responsiveStyles}\n${responsiveRootOverrides}`;

// Remove the old phone-landscape runtime style if Vite/HMR left it behind.
document.getElementById(LEGACY_STYLE_ID)?.remove();

let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
if (!style) {
  style = document.createElement("style");
  style.id = STYLE_ID;
  document.head.appendChild(style);
}
if (style.textContent !== css) style.textContent = css;

type DemoViewport =
  | "xl"
  | "desktop"
  | "compact"
  | "tablet"
  | "phone-landscape"
  | "phone-portrait";

const root = document.documentElement;

function viewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.round(viewport?.width ?? window.innerWidth),
    height: Math.round(viewport?.height ?? window.innerHeight),
  };
}

function classifyViewport(width: number, height: number): DemoViewport {
  const landscape = width > height;
  const touchLike = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const screenWidth = window.screen.width || width;
  const screenHeight = window.screen.height || height;
  const screenMin = Math.min(screenWidth, screenHeight);

  // Resolve phone landscape before generic width bands. This prevents a high-DPR
  // phone from falling into tablet/desktop simply because its CSS viewport is wide.
  const physicalPhoneLandscape =
    landscape &&
    touchLike &&
    screenMin <= 600 &&
    width <= 1400 &&
    height <= 850;

  // Also support desktop browser/device emulation of phone landscape.
  const compactLandscapeViewport =
    landscape &&
    width <= 1100 &&
    height <= 560;

  if (physicalPhoneLandscape || compactLandscapeViewport) return "phone-landscape";
  if (!landscape && width <= 767) return "phone-portrait";
  if (width >= 1800) return "xl";
  if (width >= 1440) return "desktop";
  if (width >= 1100) return "compact";
  if (width >= 768) return "tablet";
  return "phone-portrait";
}

function syncResponsiveMode() {
  const { width, height } = viewportSize();
  const mode = classifyViewport(width, height);

  // A single attribute is the source of truth. The responsive CSS therefore has
  // mutually exclusive contracts instead of stacked max-width overrides.
  root.dataset.demoViewport = mode;
  root.style.setProperty("--demo-viewport-width", `${width}px`);
  root.style.setProperty("--demo-viewport-height", `${height}px`);

  // Clear every previous landscape marker so legacy files can never become a
  // second responsive state machine.
  root.classList.remove(
    "demo-phone-landscape",
    "demo-phone-landscape-narrow",
    "demo-phone-landscape-short",
    "demo-phone-landscape-final",
    "demo-phone-landscape-final-narrow",
    "demo-phone-landscape-final-short",
  );
}

syncResponsiveMode();
window.addEventListener("resize", syncResponsiveMode, { passive: true });
window.addEventListener("orientationchange", syncResponsiveMode, { passive: true });
window.visualViewport?.addEventListener("resize", syncResponsiveMode, { passive: true });
window.visualViewport?.addEventListener("scroll", syncResponsiveMode, { passive: true });
