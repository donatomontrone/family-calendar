import fs from 'node:fs';

const homePath = 'src/HomeView.tsx';
let home = fs.readFileSync(homePath, 'utf8');

const formattedNeedle = '  const formatted = domain === "light" && lightMode === "temperature" ? `${Math.round(value)} K` : `${Math.round(value)}%`;';
const formattedReplacement = `${formattedNeedle}\n  const lightIsOn = domain === "light" && state.state === "on";`;
if (!home.includes('const lightIsOn = domain === "light" && state.state === "on";')) {
  if (!home.includes(formattedNeedle)) throw new Error('RoomQuickControl formatted value anchor not found');
  home = home.replace(formattedNeedle, formattedReplacement);
}

const oldButtons = `          <div className="room-light-mode-v4">\n            <button className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")} aria-label={language === "it" ? "Luminosità" : "Brightness"}><SunIcon /></button>\n            <button className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")} aria-label={language === "it" ? "Temperatura bianco" : "White temperature"}><ThermometerIcon /></button>\n          </div>`;

const newButtons = `          <div className="room-light-mode-v4">\n            <button\n              type="button"\n              className={\`room-power-toggle-v31 ${'${'}lightIsOn ? "active" : ""}\`}\n              onClick={() => void hass.callService("light", lightIsOn ? "turn_off" : "turn_on", { entity_id: entityId })}\n              aria-label={language === "it" ? (lightIsOn ? "Spegni luce" : "Accendi luce") : (lightIsOn ? "Turn light off" : "Turn light on")}\n              title={language === "it" ? (lightIsOn ? "Spegni" : "Accendi") : (lightIsOn ? "Turn off" : "Turn on")}\n            ><PowerIcon /></button>\n            <button type="button" className={lightMode === "brightness" ? "active" : ""} onClick={() => onLightMode("brightness")} aria-label={language === "it" ? "Luminosità" : "Brightness"}><SunIcon /></button>\n            <button type="button" className={lightMode === "temperature" ? "active" : ""} onClick={() => onLightMode("temperature")} aria-label={language === "it" ? "Temperatura bianco" : "White temperature"}><ThermometerIcon /></button>\n          </div>`;

if (!home.includes('room-power-toggle-v31')) {
  if (!home.includes(oldButtons)) throw new Error('RoomQuickControl light mode buttons anchor not found');
  home = home.replace(oldButtons, newButtons);
}
fs.writeFileSync(homePath, home);

const cssPath = 'src/desktop-room-mobile-parity-v30.css';
let css = fs.readFileSync(cssPath, 'utf8');
const cssMarker = '/* V31 explicit selected-light power control */';
if (!css.includes(cssMarker)) {
  css += `\n\n${cssMarker}\n@media (min-width: 701px) {\n  main.app-shell.home-page-active .desktop-room-stage-v26 .room-light-mode-v4 > .room-power-toggle-v31 {\n    margin-right: 2px !important;\n  }\n\n  main.app-shell.home-page-active .desktop-room-stage-v26 .room-light-mode-v4 > .room-power-toggle-v31 svg {\n    width: 15px !important;\n    height: 15px !important;\n  }\n}\n`;
}
fs.writeFileSync(cssPath, css);
