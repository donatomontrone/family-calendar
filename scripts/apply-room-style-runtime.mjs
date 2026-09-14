import fs from 'node:fs';

const homePath = 'src/HomeView.tsx';
let home = fs.readFileSync(homePath, 'utf8');
home = home.replace('import "./desktop-room-mobile-parity-v30.css";\n', '');
fs.writeFileSync(homePath, home);

const uiPath = 'src/ui-interactions.ts';
let ui = fs.readFileSync(uiPath, 'utf8');
const importLine = 'import desktopRoomWorkspaceV26Styles from "./desktop-room-workspace-v26.css?inline";';
if (!ui.includes('desktopRoomMobileParityV30Styles')) {
  ui = ui.replace(importLine, `${importLine}\nimport desktopRoomMobileParityV30Styles from "./desktop-room-mobile-parity-v30.css?inline";`);
  ui = ui.replace('${desktopRoomWorkspaceV26Styles}`;', '${desktopRoomWorkspaceV26Styles}\\n${desktopRoomMobileParityV30Styles}`;');
}
fs.writeFileSync(uiPath, ui);
