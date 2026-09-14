import fs from 'node:fs';

const path = 'src/HomeView.tsx';
let source = fs.readFileSync(path, 'utf8');

source = source.replace('  const lightIsOn = domain === "light" && state.state === "on";\n\n  return (\n    <div className={`room-quick-control-v4 domain-${domain}`}>', '  return (\n    <div className={`room-quick-control-v4 domain-${domain}`}>');

const powerButton = `            <button\n              type="button"\n              className={\`room-power-toggle-v31 \${lightIsOn ? "active" : ""}\`}\n              onClick={() => void hass.callService("light", lightIsOn ? "turn_off" : "turn_on", { entity_id: entityId })}\n              aria-label={language === "it" ? (lightIsOn ? "Spegni luce" : "Accendi luce") : (lightIsOn ? "Turn light off" : "Turn light on")}\n              title={language === "it" ? (lightIsOn ? "Spegni" : "Accendi") : (lightIsOn ? "Turn off" : "Turn on")}\n            ><PowerIcon /></button>\n`;

if (!source.includes(powerButton)) {
  throw new Error('Mobile room power button block not found');
}
source = source.replace(powerButton, '');

fs.writeFileSync(path, source);
