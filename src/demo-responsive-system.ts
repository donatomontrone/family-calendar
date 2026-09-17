import responsiveStyles from "./demo-responsive-system.css?inline";
import statusConsistencyStyles from "./demo-status-consistency-v45.css?inline";

const STYLE_ID = "family-calendar-demo-responsive-system";
const LEGACY_STYLE_ID = "family-calendar-demo-phone-landscape-final";
const css = `${statusConsistencyStyles}\n${responsiveStyles}`;

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
