import phoneLandscapeV41Styles from "./demo-phone-landscape-v41.css?inline";
import phoneLandscapeV42Styles from "./demo-phone-landscape-v42.css?inline";
import phoneLandscapeV43Styles from "./demo-phone-landscape-v43.css?inline";
import statusConsistencyV43Styles from "./demo-status-consistency-v43.css?inline";

const STYLE_ID = "family-calendar-demo-landscape-runtime";
const css = `${phoneLandscapeV41Styles}\n${phoneLandscapeV42Styles}\n${phoneLandscapeV43Styles}\n${statusConsistencyV43Styles}`;

let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
if (!style) {
  style = document.createElement("style");
  style.id = STYLE_ID;
  document.head.appendChild(style);
}

if (style.textContent !== css) style.textContent = css;