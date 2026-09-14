import fs from 'node:fs';

const path = 'src/HomeView.tsx';
const fragmentPath = 'scripts/desktop-room-v32-fragment.txt';
let source = fs.readFileSync(path, 'utf8');
const fragment = fs.readFileSync(fragmentPath, 'utf8').trimEnd();

const activeStates = 'const ACTIVE_STATES = new Set(["on", "open", "heat", "cool", "heat_cool", "auto", "fan_only", "dry", "playing", "unlocked", "cleaning"]);';
if (!source.includes('const ROOM_ACCENTS = [')) {
  if (!source.includes(activeStates)) throw new Error('ACTIVE_STATES anchor not found');
  source = source.replace(activeStates, `${activeStates}\nconst ROOM_ACCENTS = ["#4f8cff", "#34c759", "#30b0c7", "#ff9f0a", "#8e7dff", "#ff6482", "#32ade6"];`);
}

const desktopRoomLine = '  const desktopRoom = rooms.find((room) => room.area.area_id === desktopRoomId) ?? rooms[0] ?? null;';
if (!source.includes('const desktopRoomAccent =')) {
  if (!source.includes(desktopRoomLine)) throw new Error('desktopRoom anchor not found');
  source = source.replace(desktopRoomLine, `${desktopRoomLine}\n  const desktopRoomIndex = Math.max(0, rooms.findIndex((room) => room.area.area_id === desktopRoom?.area.area_id));\n  const desktopRoomAccent = ROOM_ACCENTS[desktopRoomIndex % ROOM_ACCENTS.length];`);
}

const oldBlock = `          <div className="desktop-room-stage-v26">\n            {desktopRoom && (\n              <RoomCard\n                key={\`desktop-\${desktopRoom.area.area_id}\`}\n                hass={hass}\n                room={desktopRoom}\n                language={language}\n                onClimate={(entityId) => setRoomClimateEntityId(entityId)}\n              />\n            )}\n          </div>`;

const newBlock = `          <div className="desktop-room-stage-v26">\n            {desktopRoom && (\n              <DesktopRoomPanel\n                key={\`desktop-\${desktopRoom.area.area_id}\`}\n                hass={hass}\n                room={desktopRoom}\n                language={language}\n                accent={desktopRoomAccent}\n                onClimate={(entityId) => setRoomClimateEntityId(entityId)}\n              />\n            )}\n          </div>`;

if (!source.includes('<DesktopRoomPanel')) {
  if (!source.includes(oldBlock)) throw new Error('desktop RoomCard block not found');
  source = source.replace(oldBlock, newBlock);
}

if (!source.includes('function DesktopRoomPanel(')) {
  const anchor = '\nfunction RoomCard(';
  if (!source.includes(anchor)) throw new Error('RoomCard function anchor not found');
  source = source.replace(anchor, `\n${fragment}\n\nfunction RoomCard(`);
}

fs.writeFileSync(path, source);
