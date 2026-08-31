import { mkdir, copyFile } from "node:fs/promises";
await mkdir("custom_components/family_calendar/frontend", {recursive:true});
await copyFile("dist/family-calendar-panel.js","custom_components/family_calendar/frontend/family-calendar-panel.js");
