import { createContext, useContext, type ReactNode } from "react";

export type IconOverrideMap = Record<string, string>;
export type IconCategory = "lighting" | "home" | "climate" | "security" | "media" | "appliances" | "outdoor";

export type IconOption = {
  key: string;
  category: IconCategory;
  it: string;
  en: string;
  keywords: string[];
};

export const ICON_CATEGORY_ORDER: IconCategory[] = ["lighting","home","climate","security","media","appliances","outdoor"];

export const ICON_OPTIONS: IconOption[] = [
  { key:"bulb", category:"lighting", it:"Lampadina", en:"Bulb", keywords:["luce","light"] },
  { key:"lamp", category:"lighting", it:"Lampada", en:"Lamp", keywords:["piantana","bedside","floor"] },
  { key:"ceiling", category:"lighting", it:"Plafoniera", en:"Ceiling light", keywords:["soffitto","ceiling"] },
  { key:"strip", category:"lighting", it:"Striscia LED", en:"Light strip", keywords:["led","strip"] },
  { key:"switch", category:"home", it:"Interruttore", en:"Switch", keywords:["switch","relay"] },
  { key:"outlet", category:"home", it:"Presa", en:"Outlet", keywords:["presa","plug","socket"] },
  { key:"blinds", category:"home", it:"Tapparella", en:"Blinds", keywords:["cover","shutter"] },
  { key:"curtains", category:"home", it:"Tenda", en:"Curtains", keywords:["cover","curtain"] },
  { key:"window", category:"home", it:"Finestra", en:"Window", keywords:["window","opening"] },
  { key:"door", category:"home", it:"Porta", en:"Door", keywords:["door","entrance"] },
  { key:"thermometer", category:"climate", it:"Temperatura", en:"Temperature", keywords:["clima","temperature","thermostat"] },
  { key:"fan", category:"climate", it:"Ventola", en:"Fan", keywords:["fan","ventola"] },
  { key:"snowflake", category:"climate", it:"Raffrescamento", en:"Cooling", keywords:["cool","ac","freddo"] },
  { key:"flame", category:"climate", it:"Riscaldamento", en:"Heating", keywords:["heat","caldo"] },
  { key:"droplet", category:"climate", it:"Umidità", en:"Humidity", keywords:["water","humidity","acqua"] },
  { key:"sensor", category:"security", it:"Sensore", en:"Sensor", keywords:["sensor","radar"] },
  { key:"motion", category:"security", it:"Movimento", en:"Motion", keywords:["presence","motion","presenza"] },
  { key:"lock", category:"security", it:"Serratura", en:"Lock", keywords:["lock","porta"] },
  { key:"shield", category:"security", it:"Sicurezza", en:"Security", keywords:["alarm","allarme","shield"] },
  { key:"camera", category:"security", it:"Telecamera", en:"Camera", keywords:["camera","video"] },
  { key:"smoke", category:"security", it:"Fumo", en:"Smoke", keywords:["smoke","fire","fumo"] },
  { key:"tv", category:"media", it:"Televisore", en:"TV", keywords:["tv","television"] },
  { key:"speaker", category:"media", it:"Altoparlante", en:"Speaker", keywords:["speaker","audio","homepod"] },
  { key:"headphones", category:"media", it:"Cuffie", en:"Headphones", keywords:["headphones","audio"] },
  { key:"coffee", category:"appliances", it:"Caffè", en:"Coffee", keywords:["coffee","caffe"] },
  { key:"washer", category:"appliances", it:"Lavatrice", en:"Washer", keywords:["washer","washing"] },
  { key:"vacuum", category:"appliances", it:"Aspirapolvere", en:"Vacuum", keywords:["vacuum","clean"] },
  { key:"robot", category:"appliances", it:"Robot", en:"Robot", keywords:["robot","narwal"] },
  { key:"car", category:"outdoor", it:"Auto", en:"Car", keywords:["car","auto"] },
  { key:"leaf", category:"outdoor", it:"Giardino", en:"Garden", keywords:["leaf","garden","giardino"] },
  { key:"sun", category:"outdoor", it:"Sole", en:"Sun", keywords:["sun","outdoor","esterno"] },
];

const IconOverrideContext = createContext<IconOverrideMap>({});

export function EntityIconOverrideProvider({ value, children }: { value: IconOverrideMap; children: ReactNode }) {
  return <IconOverrideContext.Provider value={value}>{children}</IconOverrideContext.Provider>;
}

export function useEntityIconOverrides() {
  return useContext(IconOverrideContext);
}

function Glyph({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</g></svg>;
}

export function renderEntityOverrideIcon(key?: string | null): ReactNode | null {
  switch (key) {
    case "bulb": return <Glyph><path d="M9.3 17.3h5.4M10.2 20h3.6M12 3.2a6.3 6.3 0 0 0-3.7 11.4c.7.5 1 1.3 1 2.2h5.4c0-.9.3-1.7 1-2.2A6.3 6.3 0 0 0 12 3.2Z"/></Glyph>;
    case "lamp": return <Glyph><path d="M8 5h8l2 6H6l2-6ZM12 11v8M8.5 20h7"/></Glyph>;
    case "ceiling": return <Glyph><path d="M5 5h14M8 8h8l2 5H6l2-5ZM12 13v3M9 19h6"/></Glyph>;
    case "strip": return <Glyph><rect x="4" y="7" width="16" height="10" rx="3"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></Glyph>;
    case "switch": return <Glyph><rect x="6" y="4" width="12" height="16" rx="3"/><circle cx="12" cy="10" r="2.3"/><path d="M12 12.3V16"/></Glyph>;
    case "outlet": return <Glyph><rect x="5" y="4" width="14" height="16" rx="3"/><path d="M9 9v3M15 9v3M9.5 16h5"/></Glyph>;
    case "blinds": return <Glyph><rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M5 8h14M7 11h10M7 14h10M12 17v3"/></Glyph>;
    case "curtains": return <Glyph><path d="M5 4h14M7 5v15M17 5v15M7 8c3 2 3 6 0 9M17 8c-3 2-3 6 0 9"/></Glyph>;
    case "window": return <Glyph><rect x="4.5" y="4" width="15" height="16" rx="1.5"/><path d="M12 4v16M4.5 12h15"/></Glyph>;
    case "door": return <Glyph><path d="M6 20V4h12v16M9 20V7h6v13M13 13h.01"/></Glyph>;
    case "thermometer": return <Glyph><path d="M14.4 14.8V5.6a2.4 2.4 0 0 0-4.8 0v9.2a4.4 4.4 0 1 0 4.8 0Z"/><path d="M12 8v8"/></Glyph>;
    case "fan": return <Glyph><circle cx="12" cy="12" r="2"/><path d="M12 10c-1-5 2-7 4-5 1.8 2-.4 5-3 6M14 12c5-1 7 2 5 4-2 1.8-5-.4-6-3M12 14c1 5-2 7-4 5-1.8-2 .4-5 3-6M10 12c-5 1-7-2-5-4 2-1.8 5 .4 6 3"/></Glyph>;
    case "snowflake": return <Glyph><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 5l3 2 3-2M9 19l3-2 3 2"/></Glyph>;
    case "flame": return <Glyph><path d="M13 3c.5 3-2 4.3-1 7 1-1.5 2.8-2.3 4-4 2.2 3 3.2 5.3 2.5 8.2A6.8 6.8 0 0 1 5 13c0-3.6 2.2-6.3 5.4-9-.2 3.3 1.2 4.2 2.6 5"/></Glyph>;
    case "droplet": return <Glyph><path d="M12 3.7c3.1 4.1 5.2 6.8 5.2 9.8a5.2 5.2 0 0 1-10.4 0c0-3 2.1-5.7 5.2-9.8Z"/><path d="M9.5 14.2a2.8 2.8 0 0 0 2.7 2.1"/></Glyph>;
    case "sensor": return <Glyph><circle cx="12" cy="12" r="2.2"/><path d="M7.7 7.7a6.1 6.1 0 0 0 0 8.6M16.3 7.7a6.1 6.1 0 0 1 0 8.6M5 5a9.9 9.9 0 0 0 0 14M19 5a9.9 9.9 0 0 1 0 14"/></Glyph>;
    case "motion": return <Glyph><circle cx="12" cy="7.5" r="2.2"/><path d="M8 20c.5-4 1.8-6.2 4-6.2s3.5 2.2 4 6M5 10a8 8 0 0 0 0 4M19 10a8 8 0 0 1 0 4"/></Glyph>;
    case "lock": return <Glyph><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3M12 14v2"/></Glyph>;
    case "shield": return <Glyph><path d="M12 3.5 19 6v5.3c0 4.4-2.8 7.4-7 9.2-4.2-1.8-7-4.8-7-9.2V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></Glyph>;
    case "camera": return <Glyph><rect x="4.5" y="6.5" width="11.5" height="11" rx="2"/><path d="m16 10 4-2.1v8.2L16 14Z"/></Glyph>;
    case "smoke": return <Glyph><path d="M5 17h14M7 13c0-2 2-2 2-4s-2-2-2-4M12 13c0-2 2-2 2-4s-2-2-2-4M17 13c0-2 2-2 2-4"/></Glyph>;
    case "tv": return <Glyph><rect x="4" y="5" width="16" height="12" rx="2"/><path d="M9 21h6M12 17v4"/></Glyph>;
    case "speaker": return <Glyph><path d="M5.2 10h3.2l4.5-3.7v11.4L8.4 14H5.2Z"/><path d="M16 9.1a4.3 4.3 0 0 1 0 5.8M18.4 6.8a7.5 7.5 0 0 1 0 10.4"/></Glyph>;
    case "headphones": return <Glyph><path d="M5 13V11a7 7 0 0 1 14 0v2M5 13h3v6H6a1 1 0 0 1-1-1v-5ZM19 13h-3v6h2a1 1 0 0 0 1-1v-5Z"/></Glyph>;
    case "coffee": return <Glyph><path d="M6 9h10v5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V9ZM16 11h2a2 2 0 0 1 0 4h-2M8 5c0 1 1 1 1 2M12 4c0 1 1 1 1 3"/></Glyph>;
    case "washer": return <Glyph><rect x="5" y="3.5" width="14" height="17" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7h.01M11 7h4"/></Glyph>;
    case "vacuum": return <Glyph><path d="M7 17h10l-1.5-7h-7L7 17ZM9 10V6h6v4M5 20h14"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></Glyph>;
    case "robot": return <Glyph><rect x="5" y="7" width="14" height="12" rx="3"/><path d="M12 4v3M9 12h.01M15 12h.01M9 16h6"/></Glyph>;
    case "car": return <Glyph><path d="m5 15 1.5-5h11L19 15v4h-2v-2H7v2H5v-4ZM8 10l1-3h6l1 3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></Glyph>;
    case "leaf": return <Glyph><path d="M19 4C11 4 6 8 6 14c0 3 2 5 5 5 6 0 8-7 8-15Z"/><path d="M5 20c3-6 6-9 11-12"/></Glyph>;
    case "sun": return <Glyph><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></Glyph>;
    default: return null;
  }
}

export function EntityIcon({ entityId, fallback }: { entityId: string; fallback: ReactNode }) {
  const overrides = useEntityIconOverrides();
  return <>{renderEntityOverrideIcon(overrides[entityId]) ?? fallback}</>;
}
