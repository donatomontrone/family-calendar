import responsiveStyles from "./demo-responsive-system.css?inline";
import phoneLandscapeStyles from "./phone-landscape-v40.css?inline";
import statusConsistencyStyles from "./demo-status-consistency-v45.css?inline";
import demoPhoneLandscapeFixesV50Styles from "./demo-phone-landscape-fixes-v50.css?inline";
import phonePortraitControlsV51Styles from "./phone-portrait-controls-v51.css?inline";
import alarmLandscapeV52Styles from "./alarm-landscape-v52.css?inline";
import largeScreenV60Styles from "./large-screen-v60.css?inline";
import demoCalendarTabletLayoutV63Styles from "./demo-calendar-tablet-layout-v63.css?inline";
import demoSegmentedMotionV64Styles from "./demo-segmented-motion-v64.css?inline";
import visualPolishV65Styles from "./visual-polish-v65.css?inline";
import bottomRhythmV66Styles from "./bottom-rhythm-v66.css?inline";
import homeRefactorV67Styles from "./home-refactor-v67.css?inline";
import pageSwitchAlignmentV68Styles from "./page-switch-alignment-v68.css?inline";
import homeUnifiedV70Styles from "./home-unified-v70.css?inline";
import sharedLayoutV71Styles from "./shared-layout-v71.css?inline";
import calendarPhoneFirstV74Styles from "./calendar-phone-first-v74.css?inline";
import iconCustomizationV76Styles from "./icon-customization-v76.css?inline";

const STYLE_ID = "family-calendar-demo-responsive-system";
const LEGACY_RUNTIME_STYLE_ID = "family-calendar-v4-styles";
const css = `${statusConsistencyStyles}\n${responsiveStyles}\n${phoneLandscapeStyles}\n${demoPhoneLandscapeFixesV50Styles}\n${phonePortraitControlsV51Styles}\n${alarmLandscapeV52Styles}\n${largeScreenV60Styles}\n${demoCalendarTabletLayoutV63Styles}\n${demoSegmentedMotionV64Styles}\n${visualPolishV65Styles}\n${bottomRhythmV66Styles}\n${homeRefactorV67Styles}\n${pageSwitchAlignmentV68Styles}\n${homeUnifiedV70Styles}\n${sharedLayoutV71Styles}\n${calendarPhoneFirstV74Styles}\n${iconCustomizationV76Styles}`;

type DemoViewport =
  | "xl"
  | "wide"
  | "desktop"
  | "tablet-landscape"
  | "tablet-portrait"
  | "phone-landscape"
  | "phone-portrait";

const root = document.documentElement;

function ensureResponsiveStyle() {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
  }
  if (style.textContent !== css) style.textContent = css;

  const legacyRuntime = document.getElementById(LEGACY_RUNTIME_STYLE_ID);
  if (legacyRuntime?.parentElement === document.head) {
    if (style.parentElement !== document.head || legacyRuntime.nextElementSibling !== style) {
      document.head.insertBefore(style, legacyRuntime.nextElementSibling);
    }
    return;
  }

  if (style.parentElement !== document.head || style !== document.head.lastElementChild) {
    document.head.appendChild(style);
  }
}

function viewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.round(viewport?.width ?? window.innerWidth),
    height: Math.round(viewport?.height ?? window.innerHeight),
  };
}

function classifyViewport(width: number, height: number): DemoViewport {
  const landscape = width > height;
  const calendarActive = Boolean(document.querySelector("main.app-shell.calendar-page-active"));

  // CALENDARIO demo-only: small tablets must use tablet composition rather than
  // inheriting the phone contract. CASA keeps the original classifier.
  if (calendarActive && !landscape && width >= 560 && height >= 700) {
    return "tablet-portrait";
  }
  if (calendarActive && landscape && width >= 720 && height >= 480 && width <= 1400) {
    return "tablet-landscape";
  }
  const touchLike = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const screenWidth = window.screen.width || width;
  const screenHeight = window.screen.height || height;
  const screenMin = Math.min(screenWidth, screenHeight);

  // Phone landscape is resolved before every generic width band. This catches
  // high-DPR phones whose CSS width can otherwise look like a small tablet.
  const physicalPhoneLandscape =
    landscape &&
    touchLike &&
    screenMin <= 620 &&
    width <= 1200 &&
    height <= 650;

  // Also support browser/device emulation and compact non-touch test windows.
  const emulatedPhoneLandscape =
    landscape &&
    width <= 960 &&
    height <= 520;

  if (physicalPhoneLandscape || emulatedPhoneLandscape || (landscape && width < 768)) {
    return "phone-landscape";
  }

  if (!landscape && width <= 767) return "phone-portrait";

  // The two proven reference contracts stay untouched.
  if (width >= 1800) return "xl";

  // Intermediate contracts are mutually exclusive. Orientation only matters
  // once the layout reaches tablet widths.
  if (width >= 1440) return "wide";
  if (width >= 1180) return "desktop";
  if (landscape) return "tablet-landscape";
  return "tablet-portrait";
}

let lastResponsiveSignature = "";

function syncResponsiveMode() {
  ensureResponsiveStyle();

  const { width, height } = viewportSize();
  const mode = classifyViewport(width, height);

  root.dataset.demoViewport = mode;
  root.dataset.demoOrientation = width > height ? "landscape" : "portrait";
  root.dataset.demoAdaptive = mode === "xl" || mode === "phone-portrait" ? "reference" : "adaptive";
  root.style.setProperty("--demo-viewport-width", `${width}px`);
  root.style.setProperty("--demo-viewport-height", `${height}px`);

  // Clear every historical marker. Only data-demo-viewport is authoritative.
  root.classList.remove(
    "demo-phone-landscape",
    "demo-phone-landscape-narrow",
    "demo-phone-landscape-short",
    "demo-phone-landscape-final",
    "demo-phone-landscape-final-narrow",
    "demo-phone-landscape-final-short",
  );

  const signature = `${mode}:${width}x${height}`;
  if (signature !== lastResponsiveSignature) {
    lastResponsiveSignature = signature;
    requestAnimationFrame(() => {
      document.dispatchEvent(new CustomEvent("family-calendar-responsive-sync"));
    });
  }
}

syncResponsiveMode();
window.addEventListener("resize", syncResponsiveMode, { passive: true });
window.addEventListener("orientationchange", syncResponsiveMode, { passive: true });
window.visualViewport?.addEventListener("resize", syncResponsiveMode, { passive: true });
window.visualViewport?.addEventListener("scroll", syncResponsiveMode, { passive: true });

const calendarPageObserver = new MutationObserver((mutations) => {
  if (mutations.some((mutation) => mutation.type === "attributes" && mutation.attributeName === "class")) {
    syncResponsiveMode();
  }
});
calendarPageObserver.observe(document.body, {
  subtree: true,
  attributes: true,
  attributeFilter: ["class"],
});
