type ExactSharedWindow = Window & {
  __familyCalendarExactSharedUi?: boolean;
};

const exactWindow = window as ExactSharedWindow;
const RUNTIME_STYLE_ID = "family-calendar-exact-shared-runtime-styles";

const runtimeStyles = `
/* Interaction feedback stays immediate. Large glass surfaces plus animated
 * layout changes caused visible stutter on mobile, so motion is deliberately
 * disabled across the dashboard. */
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

main.app-shell.home-page-active .room-head-v4,
main.app-shell.home-page-active .room-temperature-button,
main.app-shell.home-page-active .room-temperature-button:active,
main.app-shell.home-page-active .room-temperature-button > b {
  animation: none !important;
  transition: none !important;
  transform: none !important;
}
`;

function ensureRuntimeStyles() {
  let style = document.getElementById(RUNTIME_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = RUNTIME_STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== runtimeStyles) style.textContent = runtimeStyles;
}

function cleanupLegacyArtifacts() {
  document.getElementById("family-calendar-exact-home-header-context")?.remove();
  document.querySelectorAll<HTMLElement>("header[data-exact-source-hidden='true']").forEach((header) => {
    header.removeAttribute("data-exact-source-hidden");
    header.style.removeProperty("display");
  });
}

if (!exactWindow.__familyCalendarExactSharedUi) {
  exactWindow.__familyCalendarExactSharedUi = true;
  ensureRuntimeStyles();
  cleanupLegacyArtifacts();
} else {
  ensureRuntimeStyles();
  cleanupLegacyArtifacts();
}
