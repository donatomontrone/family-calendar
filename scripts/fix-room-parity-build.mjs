import fs from 'node:fs';

const homePath = 'src/HomeView.tsx';
let home = fs.readFileSync(homePath, 'utf8');
home = home.replace(
  'import { getWhiteTemperature } from "./light-temperature";',
  'import { getWhiteTemperature, whiteTemperatureAccent } from "./light-temperature";'
);
fs.writeFileSync(homePath, home);

const cssPath = 'src/desktop-room-mobile-parity-v30.css';
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace(
  'button.room-device-button-v4.room-device-button-v4.selected {',
  'button.room-device-button-v4.room-device-button-v4.active.selected {'
);
fs.writeFileSync(cssPath, css);
