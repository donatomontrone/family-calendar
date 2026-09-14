import fs from 'node:fs';

const path = 'src/HomeView.tsx';
let text = fs.readFileSync(path, 'utf8');

text = text.replace(
  'import DeviceControls from "./DeviceControls";',
  'import DeviceControls from "./DeviceControls";\nimport "./desktop-room-mobile-parity-v30.css";'
);
text = text.replace(
  'import { getWhiteTemperature, whiteTemperatureAccent } from "./light-temperature";',
  'import { getWhiteTemperature } from "./light-temperature";'
);

const oldRun = `  const runEntity = (entityId: string) => {\n    if (editableIds.includes(entityId)) setSelectedControl(entityId);\n    if (domainOf(entityId) === "cover") return;\n    void activateEntity(hass, entityId);\n  };`;
const newRun = `  const runEntity = (entityId: string) => {\n    const domain = domainOf(entityId);\n    if (domain === "light" || domain === "cover") {\n      setSelectedControl(entityId);\n      return;\n    }\n    void activateEntity(hass, entityId);\n  };`;
if (!text.includes(oldRun)) throw new Error('runEntity block not found');
text = text.replace(oldRun, newRun);

const inlineAccent = '  const style = domain === "light" ? ({ "--room-device-accent": whiteTemperatureAccent(getWhiteTemperature(state.attributes)) } as CSSProperties) : undefined;\n';
if (!text.includes(inlineAccent)) throw new Error('inline light accent not found');
text = text.replace(inlineAccent, '');
text = text.replace('      style={style}\n', '');

fs.writeFileSync(path, text);
