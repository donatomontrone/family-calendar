import fs from 'node:fs';

const homePath = 'src/HomeView.tsx';
let source = fs.readFileSync(homePath, 'utf8');

const start = source.indexOf('function RoomQuickControl(');
const end = source.indexOf('\nfunction RoomSheet(', start);
if (start < 0 || end < 0) throw new Error('RoomQuickControl block not found');
let block = source.slice(start, end);

if (!block.includes('room-mobile-power-v35')) {
  const formattedLine = '  const formatted = domain === "light" && lightMode === "temperature" ? `${Math.round(value)} K` : `${Math.round(value)}%`;\n';
  if (!block.includes(formattedLine)) throw new Error('RoomQuickControl formatted line not found');
  block = block.replace(formattedLine, `${formattedLine}  const lightIsOn = domain === "light" && state.state === "on";\n`);

  const oldMode = `        {domain === "light" && (\n          <div className="room-light-mode-v4">\n            <button type="button" className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")} aria-label={language === "it" ? "Luminosità" : "Brightness"}><SunIcon /></button>\n            <button type="button" className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")} aria-label={language === "it" ? "Temperatura bianco" : "White temperature"}><ThermometerIcon /></button>\n          </div>\n        )}`;

  const newMode = `        {domain === "light" && (\n          <div className="room-quick-actions-v35">\n            <button\n              type="button"\n              className={\`room-mobile-power-v35 \${lightIsOn ? "active" : ""}\`}\n              onClick={() => void hass.callService("light", lightIsOn ? "turn_off" : "turn_on", { entity_id: entityId })}\n              aria-label={language === "it" ? (lightIsOn ? "Spegni luce" : "Accendi luce") : (lightIsOn ? "Turn light off" : "Turn light on")}\n              aria-pressed={lightIsOn}\n              title={language === "it" ? (lightIsOn ? "Spegni" : "Accendi") : (lightIsOn ? "Turn off" : "Turn on")}\n            ><PowerIcon /></button>\n            <div className="room-light-mode-v4">\n              <button type="button" className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")} aria-label={language === "it" ? "Luminosità" : "Brightness"}><SunIcon /></button>\n              <button type="button" className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")} aria-label={language === "it" ? "Temperatura bianco" : "White temperature"}><ThermometerIcon /></button>\n            </div>\n          </div>\n        )}`;

  if (!block.includes(oldMode)) throw new Error('RoomQuickControl mode block not found');
  block = block.replace(oldMode, newMode);
  source = source.slice(0, start) + block + source.slice(end);
  fs.writeFileSync(homePath, source);
}

const cssPath = 'src/home-mobile-power-v35.css';
const css = `/* CASA V35 — phone light power control without changing the approved two-mode selector. */
@media (max-width: 700px), (max-height: 520px) and (max-width: 940px) {
  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-quick-control-head {
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 10px !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-quick-control-head > div:first-child {
    min-width: 0 !important;
    flex: 1 1 auto !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-quick-actions-v35 {
    flex: 0 0 auto !important;
    min-width: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 6px !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-mobile-power-v35 {
    width: 34px !important;
    height: 34px !important;
    min-width: 34px !important;
    min-height: 34px !important;
    padding: 0 !important;
    display: grid !important;
    place-items: center !important;
    border: 1px solid rgba(60, 60, 67, .10) !important;
    border-radius: 11px !important;
    background: rgba(118, 118, 128, .08) !important;
    color: var(--home-secondary, #6e6e73) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.62), 0 2px 7px rgba(0,0,0,.035) !important;
    -webkit-tap-highlight-color: transparent !important;
    cursor: pointer !important;
    transition: transform .14s cubic-bezier(.2,.8,.2,1), background-color .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-mobile-power-v35 svg,
  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-mobile-power-v35 svg * {
    width: 15px !important;
    height: 15px !important;
    color: inherit !important;
    stroke: currentColor !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-mobile-power-v35.active {
    border-color: var(--room-shared-accent) !important;
    background: var(--room-shared-accent) !important;
    color: #fff !important;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--room-shared-accent) 22%, transparent), inset 0 1px 0 rgba(255,255,255,.22) !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-mobile-power-v35:active {
    transform: scale(.94) !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-light-mode-v4 {
    flex: 0 0 auto !important;
    margin: 0 !important;
  }

  main.app-shell.home-page-active.night .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-mobile-power-v35:not(.active) {
    border-color: rgba(255,255,255,.08) !important;
    background: rgba(255,255,255,.07) !important;
    color: #b8b8bd !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.035) !important;
  }
}

@media (max-width: 360px) {
  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-quick-control-head {
    gap: 7px !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-quick-actions-v35 {
    gap: 4px !important;
  }

  main.app-shell.home-page-active .reel-home.home-refactor-v4 .room-quick-control-v4.domain-light .room-mobile-power-v35 {
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    min-height: 32px !important;
  }
}
`;
fs.writeFileSync(cssPath, css);

const uiPath = 'src/ui-interactions.ts';
let ui = fs.readFileSync(uiPath, 'utf8');
const importAnchor = 'import desktopRoomMobileParityV30Styles from "./desktop-room-mobile-parity-v30.css?inline";';
const importLine = 'import homeMobilePowerV35Styles from "./home-mobile-power-v35.css?inline";';
if (!ui.includes(importLine)) {
  if (!ui.includes(importAnchor)) throw new Error('ui-interactions import anchor not found');
  ui = ui.replace(importAnchor, `${importAnchor}\n${importLine}`);
}
const finalAnchor = '${desktopRoomMobileParityV30Styles}`;';
if (!ui.includes('${homeMobilePowerV35Styles}')) {
  if (!ui.includes(finalAnchor)) throw new Error('ui-interactions finalStyles anchor not found');
  ui = ui.replace(finalAnchor, '${desktopRoomMobileParityV30Styles}\\n${homeMobilePowerV35Styles}`;');
}
fs.writeFileSync(uiPath, ui);
