const DOMAIN_ACCENTS: Record<string, string> = {
  cover: "#64b5f6",
  switch: "#34c759",
  lock: "#34c759",
  fan: "#5e5ce6",
  media_player: "#0a84ff",
  vacuum: "#af52de",
  climate: "#ff9f0a",
};

const ROOM_CARD_SELECTOR = ".room-card-v4";
const ACTIVE_CONTROL_SELECTOR = ".room-device-button-v4.active";

function domainFromControl(control: HTMLElement) {
  const domainClass = [...control.classList].find((name) => name.startsWith("domain-"));
  return domainClass?.slice("domain-".length) ?? "";
}

function accentForControl(control: HTMLElement) {
  const domain = domainFromControl(control);

  if (domain === "light") {
    const inlineAccent = control.style.getPropertyValue("--room-device-accent").trim();
    if (inlineAccent) return inlineAccent;

    const computedAccent = getComputedStyle(control).getPropertyValue("--room-device-accent").trim();
    if (computedAccent) return computedAccent;

    return "#ffd60a";
  }

  return DOMAIN_ACCENTS[domain] ?? "#0a84ff";
}

function updateRoomCard(card: HTMLElement) {
  const activeControls = [...card.querySelectorAll<HTMLElement>(ACTIVE_CONTROL_SELECTOR)];
  const selectedActive = activeControls.find((control) => control.classList.contains("selected"));
  const activeLight = activeControls.find((control) => control.classList.contains("domain-light"));
  const preferredControl = selectedActive ?? activeLight ?? activeControls[0];

  const accent = preferredControl
    ? accentForControl(preferredControl)
    : card.querySelector(".room-climate-status-v6")
      ? DOMAIN_ACCENTS.climate
      : null;

  if (!accent) {
    if (card.dataset.roomActive === "true") delete card.dataset.roomActive;
    if (card.style.getPropertyValue("--room-active-accent")) card.style.removeProperty("--room-active-accent");
    return;
  }

  if (card.dataset.roomActive !== "true") card.dataset.roomActive = "true";
  if (card.style.getPropertyValue("--room-active-accent").trim() !== accent) {
    card.style.setProperty("--room-active-accent", accent);
  }
}

function refreshRoomCardAccents() {
  document.querySelectorAll<HTMLElement>(ROOM_CARD_SELECTOR).forEach(updateRoomCard);
}

let frame = 0;
function scheduleRefresh() {
  if (frame) return;
  frame = window.requestAnimationFrame(() => {
    frame = 0;
    refreshRoomCardAccents();
  });
}

const observer = new MutationObserver(scheduleRefresh);
observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["class", "style"],
});

scheduleRefresh();
