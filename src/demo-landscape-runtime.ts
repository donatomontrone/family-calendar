import phoneLandscapeV47Styles from "./demo-phone-landscape-v47.css?inline";
import statusConsistencyV45Styles from "./demo-status-consistency-v45.css?inline";

const STYLE_ID = "family-calendar-demo-landscape-runtime";
const css = `${phoneLandscapeV47Styles}\n${statusConsistencyV45Styles}`;

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
  root.classList.toggle("demo-phone-landscape-narrow", active && width <= 650);
  root.classList.toggle("demo-phone-landscape-short", active && height <= 370);
}

syncPhoneLandscapeMode();
window.addEventListener("resize", syncPhoneLandscapeMode, { passive: true });
window.addEventListener("orientationchange", syncPhoneLandscapeMode, { passive: true });
window.visualViewport?.addEventListener("resize", syncPhoneLandscapeMode, { passive: true });
