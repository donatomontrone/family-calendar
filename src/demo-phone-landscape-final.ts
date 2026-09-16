import phoneLandscapeFinalStyles from "./demo-phone-landscape-final.css?inline";
import phoneLandscapePolishV2Styles from "./demo-phone-landscape-polish-v2.css?inline";
import statusConsistencyStyles from "./demo-status-consistency-v45.css?inline";

const STYLE_ID = "family-calendar-demo-phone-landscape-final";
const css = `${statusConsistencyStyles}\n${phoneLandscapeFinalStyles}\n${phoneLandscapePolishV2Styles}`;

let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
if (!style) {
  style = document.createElement("style");
  style.id = STYLE_ID;
  document.head.appendChild(style);
}
if (style.textContent !== css) style.textContent = css;

const root = document.documentElement;

function viewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.round(viewport?.width ?? window.innerWidth),
    height: Math.round(viewport?.height ?? window.innerHeight),
  };
}

function syncPhoneLandscapeLayout() {
  const { width, height } = viewportSize();
  const active = width > height && width <= 1100 && height <= 560;

  root.classList.toggle("demo-phone-landscape-final", active);
  root.classList.toggle("demo-phone-landscape-final-narrow", active && width <= 700);
  root.classList.toggle("demo-phone-landscape-final-short", active && height <= 390);
}

syncPhoneLandscapeLayout();
window.addEventListener("resize", syncPhoneLandscapeLayout, { passive: true });
window.addEventListener("orientationchange", syncPhoneLandscapeLayout, { passive: true });
window.visualViewport?.addEventListener("resize", syncPhoneLandscapeLayout, { passive: true });
window.visualViewport?.addEventListener("scroll", syncPhoneLandscapeLayout, { passive: true });
