type ExactSharedWindow = Window & {
  __familyCalendarExactSharedUi?: boolean;
};

const exactWindow = window as ExactSharedWindow;
const HEADER_CONTEXT_ID = "family-calendar-exact-home-header-context";
const RUNTIME_STYLE_ID = "family-calendar-exact-shared-runtime-styles";

const runtimeStyles = `
/* The Calendar header source remains mounted for React state/event handling,
 * but the visible header is a literal DOM copy rendered inside the CASA CSS
 * context. CASA itself is never restyled by this runtime layer. */
main.app-shell.calendar-page-active > header.reel-topbar.shared-home-header.casa-header-contract[data-exact-source-hidden="true"] {
  display: none !important;
}

#${HEADER_CONTEXT_ID} {
  display: block !important;
  min-height: 0 !important;
  max-height: none !important;
  height: auto !important;
  padding: 0 !important;
  overflow: visible !important;
  background: transparent !important;
  box-shadow: none !important;
  pointer-events: none !important;
}

#${HEADER_CONTEXT_ID} > .exact-home-header-reel {
  display: contents !important;
  width: auto !important;
  min-width: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  padding: 0 !important;
  overflow: visible !important;
}

#${HEADER_CONTEXT_ID} .exact-home-header-copy,
#${HEADER_CONTEXT_ID} > .exact-home-theme-proxy {
  pointer-events: auto !important;
}

/* The proxy is positioned in the same final slot used by CASA's external
 * appearance button. Desktop uses the header-content origin; phone remains
 * governed by the existing CASA responsive rules. */
@media (min-width: 701px) {
  #${HEADER_CONTEXT_ID} > .exact-home-theme-proxy {
    top: 21px !important;
    right: 5px !important;
  }
}

/* Room temperature is an immediate affordance. No press/scale animation. */
main.app-shell.home-page-active .room-head-v4,
main.app-shell.home-page-active .room-head-v4:active,
main.app-shell.home-page-active .room-head-v4 > b,
main.app-shell.home-page-active .room-head-v4 > b:active {
  animation: none !important;
  transition: none !important;
  transform: none !important;
}

/* The Home room-climate modal is put into a scoped CALENDARIO context at
 * runtime. The backdrop itself must therefore stay visually neutral: the
 * exact Calendar modal supplies its own 100vmax dimming shadow. */
.reel-backdrop.exact-calendar-climate-context {
  padding: 0 !important;
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  animation: none !important;
  transition: none !important;
}

.reel-backdrop.exact-calendar-climate-context > .exact-home-climate-controls,
.reel-backdrop.exact-calendar-climate-context > .exact-home-climate-controls * {
  animation-duration: 0s !important;
}

.reel-backdrop.exact-calendar-climate-context > .exact-home-climate-controls {
  animation: none !important;
  transition: none !important;
}

.exact-home-climate-controls .exact-climate-grid {
  display: contents !important;
}

.exact-home-climate-controls .exact-climate-grid > :not([data-room-climate-selected="true"]) {
  display: none !important;
}

/* CALENDARIO uses <strong> for the selected device title; CASA's existing
 * overlay supplies an <h2>. Give that existing node the exact same geometry
 * without replacing React-owned DOM nodes. */
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
  }
  if (style.textContent !== runtimeStyles) style.textContent = runtimeStyles;
  if (style.parentElement !== document.head || style !== document.head.lastElementChild) {
    document.head.appendChild(style);
  }
}

function numericStyle(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function measureHomeShellPadding(isNight: boolean) {
  const probe = document.createElement("div");
  probe.className = `app-shell home-page-active ${isNight ? "night" : "day"}`;
  probe.setAttribute("aria-hidden", "true");
  probe.style.setProperty("position", "fixed", "important");
  probe.style.setProperty("left", "-20000px", "important");
  probe.style.setProperty("top", "0", "important");
  probe.style.setProperty("width", "100vw", "important");
  probe.style.setProperty("height", "0", "important");
  probe.style.setProperty("min-height", "0", "important");
  probe.style.setProperty("max-height", "0", "important");
  probe.style.setProperty("visibility", "hidden", "important");
  probe.style.setProperty("pointer-events", "none", "important");
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe);
  const result = {
    left: numericStyle(computed.paddingLeft),
    right: numericStyle(computed.paddingRight),
  };
  probe.remove();
  return result;
}

function removeCalendarHeaderCopy() {
  document.getElementById(HEADER_CONTEXT_ID)?.remove();
  document.querySelectorAll<HTMLElement>("header[data-exact-source-hidden='true']").forEach((header) => {
    header.style.removeProperty("display");
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
  source.style.setProperty("display", "none", "important");

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

  const shellStyle = getComputedStyle(shell);
  const calendarPaddingLeft = numericStyle(shellStyle.paddingLeft);
  const calendarPaddingRight = numericStyle(shellStyle.paddingRight);
  const homePadding = measureHomeShellPadding(night);
  const leftDelta = homePadding.left - calendarPaddingLeft;
  const rightDelta = homePadding.right - calendarPaddingRight;

  context.style.setProperty("position", "relative", "important");
  context.style.setProperty("margin-left", `${leftDelta}px`, "important");
  context.style.setProperty("margin-right", `${rightDelta}px`, "important");
  context.style.setProperty("width", `calc(100% - ${leftDelta + rightDelta}px)`, "important");

  const signature = `${source.innerHTML}|${night ? "night" : "day"}|${Math.round(window.innerWidth)}|${leftDelta}|${rightDelta}`;
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

function normalizeRoomClimateModal() {
  const shell = document.querySelector<HTMLElement>("main.app-shell.home-page-active");
  if (!shell) return;

  const modal = shell.querySelector<HTMLElement>(
    ".reel-backdrop .climate-modal.feature-modal.room-climate-modal, .reel-backdrop .exact-home-climate-controls",
  );
  if (!modal) return;

  const grid = modal.querySelector<HTMLElement>(".climate-grid");
  if (!grid) return;

  const selected = grid.querySelector<HTMLElement>(":scope > [data-room-climate-selected='true']");
  if (!selected) return;

  const deviceName = selected.querySelector<HTMLElement>(".climate-control-title strong")?.textContent?.trim()
    || modal.querySelector<HTMLElement>(".modal-head h2, .device-controls-heading .exact-device-title")?.textContent?.trim()
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
  Array.from(grid.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    if (child === selected) child.style.removeProperty("display");
    else child.style.setProperty("display", "none", "important");
  });

  selected.classList.add("climate-compact");
  selected.classList.remove("climate-full");
  selected.querySelector<HTMLElement>(".climate-control-title > div > strong")?.style.setProperty("display", "none", "important");
}

function syncExactSharedUi() {
  ensureRuntimeStyles();
  syncCalendarHeader();
  normalizeRoomClimateModal();
  ensureRuntimeStyles();
}

if (!exactWindow.__familyCalendarExactSharedUi) {
  exactWindow.__familyCalendarExactSharedUi = true;

  let frame = 0;
  const schedule = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      syncExactSharedUi();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("click", schedule, true);
  schedule();
}
