import phoneLandscapeV44Styles from "./demo-phone-landscape-v44.css?inline";
import phoneLandscapeV45Styles from "./demo-phone-landscape-v45.css?inline";
import statusConsistencyV45Styles from "./demo-status-consistency-v45.css?inline";

const STYLE_ID = "family-calendar-demo-landscape-runtime";
const css = `${phoneLandscapeV44Styles}\n${phoneLandscapeV45Styles}\n${statusConsistencyV45Styles}`;

let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
if (!style) {
  style = document.createElement("style");
  style.id = STYLE_ID;
  document.head.appendChild(style);
}

if (style.textContent !== css) style.textContent = css;

const root = document.documentElement;

function syncPhoneLandscapeMode() {
  const viewport = window.visualViewport;
  const width = Math.round(viewport?.width ?? window.innerWidth);
  const height = Math.round(viewport?.height ?? window.innerHeight);
  const active = width > height && width <= 1100 && height <= 560;

  root.classList.toggle("demo-phone-landscape", active);
  root.classList.toggle("demo-phone-landscape-narrow", active && width <= 760);
  root.classList.toggle("demo-phone-landscape-short", active && height <= 370);
}

syncPhoneLandscapeMode();
window.addEventListener("resize", syncPhoneLandscapeMode, { passive: true });
window.addEventListener("orientationchange", syncPhoneLandscapeMode, { passive: true });
window.visualViewport?.addEventListener("resize", syncPhoneLandscapeMode, { passive: true });
