import { createContext, useContext, type ReactNode } from "react";

export type IconOverrideMap = Record<string, string>;
export type IconCategory =
  | "lighting"
  | "home"
  | "climate"
  | "security"
  | "media"
  | "appliances"
  | "energy"
  | "outdoor";

export type IconOption = {
  key: string;
  category: IconCategory;
  it: string;
  en: string;
  keywords: string[];
};

type IconDefinition = IconOption & { glyph: ReactNode };

export const ICON_CATEGORY_ORDER: IconCategory[] = [
  "lighting",
  "home",
  "climate",
  "security",
  "media",
  "appliances",
  "energy",
  "outdoor",
];

const def = (
  key: string,
  category: IconCategory,
  it: string,
  en: string,
  keywords: string[],
  glyph: ReactNode,
): IconDefinition => ({ key, category, it, en, keywords, glyph });

const ICON_DEFINITIONS: IconDefinition[] = [
  // Lighting — Hue/Home-inspired semantic coverage.
  def("bulb","lighting","Lampadina","Bulb",["luce","light","bulb"],<><path d="M9.3 17.3h5.4M10.2 20h3.6M12 3.2a6.3 6.3 0 0 0-3.7 11.4c.7.5 1 1.3 1 2.2h5.4c0-.9.3-1.7 1-2.2A6.3 6.3 0 0 0 12 3.2Z"/></>),
  def("bulb-globe","lighting","Lampadina globe","Globe bulb",["globe","sfera","hue"],<><circle cx="12" cy="9.5" r="5.2"/><path d="M9.5 15h5M10 18h4M10.8 20h2.4"/></>),
  def("bulb-filament","lighting","Filamento","Filament bulb",["filament","vintage","edison"],<><path d="M8.5 14.5A5.8 5.8 0 1 1 15.5 14.5L14 17H10l-1.5-2.5ZM10 20h4M9.5 17h5"/><path d="m10 9 2 3 2-3"/></>),
  def("pendant","lighting","Sospensione","Pendant",["pendant","sospensione","lamp"],<><path d="M12 3v5M7 9h10l2 5H5l2-5ZM8 18h8"/></>),
  def("pendant-round","lighting","Sospensione tonda","Round pendant",["pendant","round"],<><path d="M12 3v5"/><path d="M7 9c0 4 2 6 5 6s5-2 5-6H7ZM9 19h6"/></>),
  def("ceiling","lighting","Plafoniera","Ceiling light",["ceiling","soffitto"],<><path d="M5 5h14M8 8h8l2 5H6l2-5ZM9 17h6"/></>),
  def("ceiling-round","lighting","Plafoniera tonda","Round ceiling",["ceiling","round"],<><path d="M7 7h10"/><ellipse cx="12" cy="12" rx="6" ry="4"/><path d="M9 18h6"/></>),
  def("chandelier","lighting","Lampadario","Chandelier",["chandelier","lampadario"],<><path d="M12 3v5M7 8h10M8 8v3M16 8v3M12 8v3M6 14h4M10 14h4M14 14h4M7 14v3M12 14v3M17 14v3"/></>),
  def("floor-lamp","lighting","Piantana","Floor lamp",["floor","piantana"],<><path d="M9 5h6l2 6H7l2-6ZM12 11v8M8.5 20h7"/></>),
  def("table-lamp","lighting","Lampada tavolo","Table lamp",["table","desk","comodino"],<><path d="M9 6h6l2 5H7l2-5ZM12 11v5M9 19h6"/></>),
  def("wall-lamp","lighting","Applique","Wall lamp",["wall","applique","sconce"],<><path d="M5 5v14M5 9h5l3 3-3 3H5M15 9v6"/></>),
  def("spotlight","lighting","Faretto","Spotlight",["spot","faretto"],<><path d="M8 5h8l1 5H7l1-5ZM12 10v3M9 17l3-4 3 4"/></>),
  def("spot-double","lighting","Doppio faretto","Double spot",["spot","double"],<><path d="M5 6h14M8 6v4M16 6v4"/><path d="m6 10 4 1-2 4-4-1 2-4ZM14 11l4-1 2 4-4 1-2-4Z"/></>),
  def("spot-triple","lighting","Triplo faretto","Triple spot",["spot","triple"],<><path d="M4 6h16M7 6v4M12 6v4M17 6v4"/><circle cx="7" cy="13" r="2"/><circle cx="12" cy="13" r="2"/><circle cx="17" cy="13" r="2"/></>),
  def("light-strip","lighting","Striscia LED","Light strip",["led","strip","lightstrip"],<><path d="M5 7h10a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6"/><path d="M7 7h.01M11 7h.01M15 7h.01M18 10h.01M16 14h.01M12 15h.01"/></>),
  def("light-bar","lighting","Barra luce","Light bar",["bar","lightbar"],<><rect x="5" y="7" width="14" height="10" rx="5"/><path d="M8 12h8"/></>),
  def("gradient","lighting","Luce gradient","Gradient light",["gradient","ambient"],<><path d="M6 18V6M10 20V4M14 18V6M18 16V8"/></>),
  def("candle","lighting","Candela","Candle",["candle","candela"],<><path d="M9 10h6v10H9z"/><path d="M12 9c-2-2-1-4 0-6 1 2 2 4 0 6Z"/></>),
  def("lantern","lighting","Lanterna","Lantern",["lantern","outdoor"],<><path d="M8 8h8l2 12H6L8 8ZM9 8V5h6v3M9 12h6M10 16h4"/></>),
  def("outdoor-wall","lighting","Luce esterna","Outdoor wall light",["outdoor","wall"],<><path d="M5 4v16M5 8h7l3 4-3 4H5M15 10h4M15 14h4"/></>),

  // Home / rooms / openings.
  def("switch","home","Interruttore","Switch",["switch","relay"],<><rect x="6" y="4" width="12" height="16" rx="3"/><circle cx="12" cy="10" r="2.3"/><path d="M12 12.3V16"/></>),
  def("dimmer","home","Dimmer","Dimmer",["dimmer","rotary"],<><rect x="5" y="4" width="14" height="16" rx="3"/><circle cx="12" cy="12" r="3.2"/><path d="M12 8.8V6"/></>),
  def("outlet","home","Presa","Outlet",["presa","socket"],<><rect x="5" y="4" width="14" height="16" rx="3"/><path d="M9 9v3M15 9v3M9.5 16h5"/></>),
  def("smart-plug","home","Presa smart","Smart plug",["plug","smart","presa"],<><rect x="6" y="4" width="12" height="16" rx="4"/><path d="M9 9v3M15 9v3M9 16h6"/></>),
  def("blinds","home","Tapparella","Blinds",["cover","shutter"],<><rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M5 8h14M7 11h10M7 14h10M12 17v3"/></>),
  def("shutters","home","Persiana","Shutters",["shutter","persiana"],<><rect x="4" y="4" width="7" height="16"/><rect x="13" y="4" width="7" height="16"/><path d="M6 8h3M6 12h3M6 16h3M15 8h3M15 12h3M15 16h3"/></>),
  def("curtains","home","Tende","Curtains",["curtain","tenda"],<><path d="M5 4h14M7 5v15M17 5v15M7 8c3 2 3 6 0 9M17 8c-3 2-3 6 0 9"/></>),
  def("awning","home","Tenda da sole","Awning",["awning","tenda","sole"],<><path d="M4 6h16l-2 5H6L4 6ZM6 11v9M18 11v9M6 15h12"/></>),
  def("window","home","Finestra","Window",["window","opening"],<><rect x="4.5" y="4" width="15" height="16" rx="1.5"/><path d="M12 4v16M4.5 12h15"/></>),
  def("window-open","home","Finestra aperta","Open window",["window","open"],<><path d="M5 4h14v16H5V4ZM12 4v16M12 4l6 3v10l-6 3"/></>),
  def("door","home","Porta","Door",["door","entrance"],<><path d="M6 20V4h12v16M9 20V7h6v13M13 13h.01"/></>),
  def("door-open","home","Porta aperta","Open door",["door","open"],<><path d="M5 20V4h13v16M8 5l8 2v12l-8 1V5ZM13 13h.01"/></>),
  def("garage","home","Garage","Garage",["garage","door"],<><path d="M4 20V8l8-4 8 4v12M7 20v-9h10v9M7 14h10M7 17h10"/></>),
  def("gate","home","Cancello","Gate",["gate","cancello"],<><path d="M4 20V7M20 20V7M6 9h12v11H6V9ZM6 12h12M12 9v11"/></>),
  def("stairs","home","Scale","Stairs",["stairs","scale"],<><path d="M4 19h4v-4h4v-4h4V7h4"/></>),
  def("sofa","home","Divano","Sofa",["sofa","salotto"],<><path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M5 11h14a2 2 0 0 1 2 2v5H3v-5a2 2 0 0 1 2-2ZM6 18v2M18 18v2"/></>),
  def("bed","home","Letto","Bed",["bed","camera"],<><path d="M4 19V8M20 19v-6a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v3M4 16h16M6 10V7h5v3"/></>),
  def("desk","home","Scrivania","Desk",["desk","studio"],<><path d="M4 10h16v4H4zM6 14v6M18 14v6M9 14v3h6v-3"/></>),
  def("bath","home","Vasca","Bath",["bath","vasca"],<><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V7a2 2 0 0 1 4 0M7 19v2M17 19v2"/></>),
  def("shower","home","Doccia","Shower",["shower","doccia"],<><path d="M6 20V8a4 4 0 0 1 8 0M14 8h4M16 11v.01M13 13v.01M18 14v.01M15 17v.01"/></>),
  def("toilet","home","WC","Toilet",["toilet","wc"],<><path d="M7 4h8v7H7V4ZM6 11h11a5 5 0 0 1-5 6H9a3 3 0 0 1-3-3v-3ZM9 17v3h6"/></>),
  def("faucet","home","Rubinetto","Faucet",["faucet","rubinetto"],<><path d="M5 10h12v5H5M9 10V7h6M12 7V4M9 4h6M17 12h2v4h-2"/></>),
  def("closet","home","Armadio","Closet",["closet","armadio"],<><rect x="5" y="4" width="14" height="16" rx="1"/><path d="M12 4v16M10 12h.01M14 12h.01"/></>),
  def("room","home","Stanza","Room",["room","home"],<><path d="m4 11 8-7 8 7v9H4v-9ZM9 20v-6h6v6"/></>),

  // Climate / air.
  def("thermometer","climate","Temperatura","Temperature",["temperature","clima"],<><path d="M14.4 14.8V5.6a2.4 2.4 0 0 0-4.8 0v9.2a4.4 4.4 0 1 0 4.8 0Z"/><path d="M12 8v8"/></>),
  def("thermostat","climate","Termostato","Thermostat",["thermostat","clima"],<><circle cx="12" cy="12" r="7"/><path d="M12 8v5l3 2M7 5l2 2M17 5l-2 2"/></>),
  def("radiator","climate","Radiatore","Radiator",["radiator","termosifone"],<><rect x="5" y="5" width="14" height="13" rx="2"/><path d="M8 7v9M12 7v9M16 7v9M7 18v2M17 18v2"/></>),
  def("floor-heat","climate","Riscaldamento a pavimento","Floor heating",["floor","heat"],<><path d="M4 17h16M5 13h14M7 9h10"/><path d="M8 6c0-1 1-1 1-2M12 7c0-1 1-1 1-2M16 6c0-1 1-1 1-2"/></>),
  def("fan","climate","Ventola","Fan",["fan","ventola"],<><circle cx="12" cy="12" r="2"/><path d="M12 10c-1-5 2-7 4-5 1.8 2-.4 5-3 6M14 12c5-1 7 2 5 4-2 1.8-5-.4-6-3M12 14c1 5-2 7-4 5-1.8-2 .4-5 3-6M10 12c-5 1-7-2-5-4 2-1.8 5 .4 6 3"/></>),
  def("ceiling-fan","climate","Ventilatore soffitto","Ceiling fan",["ceiling","fan"],<><path d="M12 3v6"/><circle cx="12" cy="11" r="2"/><path d="M10 11H4c0-2 2-3 6-2M14 11h6c0 2-2 3-6 2M12 13v7c-2 0-3-2-2-6"/></>),
  def("ac","climate","Climatizzatore","Air conditioner",["ac","air conditioner"],<><rect x="4" y="5" width="16" height="7" rx="2"/><path d="M7 9h10M8 15c0 2-2 2-2 4M12 15c0 2-2 2-2 4M16 15c0 2-2 2-2 4"/></>),
  def("snowflake","climate","Raffrescamento","Cooling",["cool","snow"],<><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 5l3 2 3-2M9 19l3-2 3 2"/></>),
  def("flame","climate","Riscaldamento","Heating",["heat","flame"],<><path d="M13 3c.5 3-2 4.3-1 7 1-1.5 2.8-2.3 4-4 2.2 3 3.2 5.3 2.5 8.2A6.8 6.8 0 0 1 5 13c0-3.6 2.2-6.3 5.4-9-.2 3.3 1.2 4.2 2.6 5"/></>),
  def("droplet","climate","Umidità","Humidity",["humidity","water"],<><path d="M12 3.7c3.1 4.1 5.2 6.8 5.2 9.8a5.2 5.2 0 0 1-10.4 0c0-3 2.1-5.7 5.2-9.8Z"/><path d="M9.5 14.2a2.8 2.8 0 0 0 2.7 2.1"/></>),
  def("air-purifier","climate","Purificatore aria","Air purifier",["air","purifier"],<><rect x="6" y="4" width="12" height="16" rx="3"/><circle cx="12" cy="13" r="3"/><path d="M9 8h6M10 13h4M12 11v4"/></>),
  def("air-quality","climate","Qualità aria","Air quality",["air","quality","co2"],<><circle cx="12" cy="12" r="7"/><path d="M8 14c2-4 6-4 8 0M9 9h.01M15 9h.01"/></>),
  def("humidifier","climate","Umidificatore","Humidifier",["humidifier","humidity"],<><rect x="6" y="7" width="12" height="12" rx="3"/><path d="M12 4c1 1 2 2 2 3M9 4c1 1 2 2 2 3M9 14c2-3 4-3 6 0"/></>),
  def("dehumidifier","climate","Deumidificatore","Dehumidifier",["dehumidifier","dry"],<><rect x="6" y="5" width="12" height="14" rx="3"/><path d="M9 10h6M10 14h4M12 3v2"/></>),

  // Security / sensors.
  def("sensor","security","Sensore","Sensor",["sensor","radar"],<><circle cx="12" cy="12" r="2.2"/><path d="M7.7 7.7a6.1 6.1 0 0 0 0 8.6M16.3 7.7a6.1 6.1 0 0 1 0 8.6M5 5a9.9 9.9 0 0 0 0 14M19 5a9.9 9.9 0 0 1 0 14"/></>),
  def("motion","security","Movimento","Motion",["motion","movimento"],<><circle cx="12" cy="7.5" r="2.2"/><path d="M8 20c.5-4 1.8-6.2 4-6.2s3.5 2.2 4 6M5 10a8 8 0 0 0 0 4M19 10a8 8 0 0 1 0 4"/></>),
  def("presence","security","Presenza","Presence",["presence","presenza"],<><circle cx="12" cy="8" r="2.5"/><path d="M7 19c.8-4 2.3-6 5-6s4.2 2 5 6"/></>),
  def("contact","security","Contatto","Contact sensor",["contact","door","window"],<><rect x="5" y="6" width="5" height="12" rx="1"/><rect x="14" y="7" width="5" height="10" rx="1"/><path d="M12 9v6"/></>),
  def("lock","security","Serratura","Lock",["lock","serratura"],<><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3M12 14v2"/></>),
  def("unlock","security","Serratura aperta","Unlocked",["unlock","open"],<><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 5-2M12 14v2"/></>),
  def("shield","security","Sicurezza","Security",["alarm","shield"],<><path d="M12 3.5 19 6v5.3c0 4.4-2.8 7.4-7 9.2-4.2-1.8-7-4.8-7-9.2V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></>),
  def("siren","security","Sirena","Siren",["siren","alarm"],<><path d="M7 16h10l-1-7a4 4 0 0 0-8 0l-1 7ZM5 20h14M4 9H2M22 9h-2M6 4 4 2M18 4l2-2"/></>),
  def("camera","security","Telecamera","Camera",["camera","video"],<><rect x="4.5" y="6.5" width="11.5" height="11" rx="2"/><path d="m16 10 4-2.1v8.2L16 14Z"/></>),
  def("camera-dome","security","Telecamera dome","Dome camera",["camera","dome"],<><path d="M6 12a6 6 0 0 1 12 0H6ZM5 15h14M9 12a3 3 0 0 0 6 0"/></>),
  def("doorbell","security","Videocitofono","Doorbell",["doorbell","bell","citofono"],<><rect x="7" y="4" width="10" height="16" rx="3"/><circle cx="12" cy="9" r="2"/><path d="M10 15h4"/></>),
  def("smoke","security","Fumo","Smoke",["smoke","fire"],<><path d="M5 17h14M7 13c0-2 2-2 2-4s-2-2-2-4M12 13c0-2 2-2 2-4s-2-2-2-4M17 13c0-2 2-2 2-4"/></>),
  def("co","security","Monossido CO","CO detector",["co","carbon","monoxide"],<><circle cx="12" cy="12" r="7"/><path d="M10 10a2 2 0 1 0 0 4M15 10a2 2 0 1 0 0 4"/></>),
  def("leak","security","Perdita acqua","Leak sensor",["leak","water"],<><path d="M12 4c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9Z"/><path d="m7 20 10-10"/></>),
  def("flood","security","Allagamento","Flood",["flood","water"],<><path d="M3 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2M3 19c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2M12 3v8"/></>),
  def("glassbreak","security","Rottura vetro","Glass break",["glass","break"],<><rect x="5" y="4" width="14" height="16"/><path d="m12 4-2 6 3 2-3 4 2 4M13 12l4-3M10 10 7-2"/></>),

  // Media / network.
  def("tv","media","Televisore","TV",["tv","television"],<><rect x="4" y="5" width="16" height="12" rx="2"/><path d="M9 21h6M12 17v4"/></>),
  def("monitor","media","Monitor","Monitor",["monitor","display"],<><rect x="4" y="4" width="16" height="12" rx="2"/><path d="M9 20h6M12 16v4"/></>),
  def("projector","media","Proiettore","Projector",["projector","cinema"],<><rect x="4" y="7" width="16" height="10" rx="2"/><circle cx="15" cy="12" r="2.5"/><path d="M7 10h3M7 14h2"/></>),
  def("speaker","media","Altoparlante","Speaker",["speaker","audio"],<><path d="M5.2 10h3.2l4.5-3.7v11.4L8.4 14H5.2Z"/><path d="M16 9.1a4.3 4.3 0 0 1 0 5.8M18.4 6.8a7.5 7.5 0 0 1 0 10.4"/></>),
  def("soundbar","media","Soundbar","Soundbar",["soundbar","audio"],<><rect x="4" y="9" width="16" height="6" rx="3"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/></>),
  def("homepod","media","Smart speaker","Smart speaker",["homepod","speaker"],<><rect x="7" y="4" width="10" height="16" rx="5"/><path d="M9 8c2-2 4-2 6 0M9 12h6M10 16h4"/></>),
  def("headphones","media","Cuffie","Headphones",["headphones","audio"],<><path d="M5 13V11a7 7 0 0 1 14 0v2M5 13h3v6H6a1 1 0 0 1-1-1v-5ZM19 13h-3v6h2a1 1 0 0 0 1-1v-5Z"/></>),
  def("gamepad","media","Console","Game controller",["game","console"],<><path d="M7 8h10a4 4 0 0 1 3.5 5.8l-1.5 3a2 2 0 0 1-3 .7l-2-1.5h-4l-2 1.5a2 2 0 0 1-3-.7l-1.5-3A4 4 0 0 1 7 8Z"/><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01"/></>),
  def("remote","media","Telecomando","Remote",["remote","telecomando"],<><rect x="8" y="3" width="8" height="18" rx="3"/><circle cx="12" cy="7" r="1.5"/><path d="M10 11h4M10 14h4M10 17h4"/></>),
  def("router","media","Router","Router",["router","wifi"],<><rect x="5" y="13" width="14" height="6" rx="2"/><path d="M8 13V9M16 13V9M9 8a4 4 0 0 1 6 0M11 6a2 2 0 0 1 2 0M8 16h.01M11 16h.01"/></>),
  def("music","media","Musica","Music",["music","audio"],<><path d="M9 18V7l9-2v11M9 10l9-2"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="16" r="2"/></>),
  def("microphone","media","Microfono","Microphone",["microphone","voice"],<><rect x="9" y="4" width="6" height="10" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></>),

  // Appliances.
  def("coffee","appliances","Macchina caffè","Coffee machine",["coffee","caffe"],<><path d="M6 9h10v5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V9ZM16 11h2a2 2 0 0 1 0 4h-2M8 5c0 1 1 1 1 2M12 4c0 1 1 1 1 3"/></>),
  def("kettle","appliances","Bollitore","Kettle",["kettle","bollitore"],<><path d="M8 8h8l2 10H6L8 8ZM9 8V5h6v3M18 10h2v5h-2"/></>),
  def("oven","appliances","Forno","Oven",["oven","forno"],<><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M7 8h10M8 12h8v6H8zM8 6h.01M11 6h.01M14 6h.01"/></>),
  def("microwave","appliances","Microonde","Microwave",["microwave","microonde"],<><rect x="4" y="6" width="16" height="12" rx="2"/><rect x="6" y="9" width="9" height="6" rx="1"/><path d="M17 10h.01M17 14h.01"/></>),
  def("fridge","appliances","Frigorifero","Fridge",["fridge","frigo"],<><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M7 11h10M14 7v2M14 14v3"/></>),
  def("dishwasher","appliances","Lavastoviglie","Dishwasher",["dishwasher","lavastoviglie"],<><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M8 8h8M9 6h.01M12 6h.01M9 14c2-3 4-3 6 0M9 17h6"/></>),
  def("washer","appliances","Lavatrice","Washer",["washer","lavatrice"],<><rect x="5" y="3.5" width="14" height="17" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7h.01M11 7h4"/></>),
  def("dryer","appliances","Asciugatrice","Dryer",["dryer","asciugatrice"],<><rect x="5" y="3.5" width="14" height="17" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7h.01M11 7h4M10 12c2-2 4-1 4 1"/></>),
  def("vacuum","appliances","Aspirapolvere","Vacuum",["vacuum","aspirapolvere"],<><path d="M7 17h10l-1.5-7h-7L7 17ZM9 10V6h6v4M5 20h14"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></>),
  def("robot","appliances","Robot aspirapolvere","Robot vacuum",["robot","narwal","roborock"],<><circle cx="12" cy="12" r="7"/><path d="M8 12h8M10 9h.01M14 9h.01M9 16h6"/></>),
  def("iron","appliances","Ferro da stiro","Iron",["iron","ferro"],<><path d="M4 17h16l-3-8H9c-1 0-2 1-2 2v6M13 9V6h3l1 3"/></>),
  def("stove","appliances","Piano cottura","Cooktop",["stove","cooktop"],<><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><circle cx="9" cy="15" r="2"/><circle cx="15" cy="15" r="2"/></>),
  def("hood","appliances","Cappa","Hood",["hood","cappa"],<><path d="M8 4h8l2 7H6l2-7ZM5 14h14M8 17h8M10 20h4"/></>),
  def("toaster","appliances","Tostapane","Toaster",["toaster","toast"],<><rect x="5" y="9" width="14" height="9" rx="3"/><path d="M8 9V6h8v3M17 12h2M8 18v2M16 18v2"/></>),

  // Energy.
  def("battery","energy","Batteria","Battery",["battery","batteria"],<><rect x="5" y="7" width="13" height="10" rx="2"/><path d="M18 10h2v4h-2M8 12h7"/></>),
  def("battery-charge","energy","Batteria in carica","Charging battery",["battery","charge"],<><rect x="5" y="7" width="13" height="10" rx="2"/><path d="M18 10h2v4h-2M12 9l-2 4h3l-1 3"/></>),
  def("solar","energy","Pannello solare","Solar panel",["solar","panel"],<><path d="M5 11h14l-2 8H7l-2-8ZM8 14h8M9 11l1-4h4l1 4M12 3v2M5 5l2 2M19 5l-2 2"/></>),
  def("meter","energy","Contatore","Energy meter",["meter","energy"],<><rect x="6" y="4" width="12" height="16" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M12 11l2-2M9 17h6"/></>),
  def("bolt","energy","Energia","Energy",["bolt","energy","electric"],<><path d="m13 3-6 10h5l-1 8 6-11h-5l1-7Z"/></>),
  def("ev-charger","energy","Wallbox EV","EV charger",["ev","charger","wallbox"],<><rect x="6" y="4" width="10" height="16" rx="2"/><path d="m11 8-2 4h3l-1 4M16 8h2l2 2v6"/></>),
  def("generator","energy","Generatore","Generator",["generator","power"],<><rect x="4" y="7" width="16" height="10" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h3M14 13h3M6 17v2M18 17v2"/></>),

  // Outdoor / mobility.
  def("car","outdoor","Auto","Car",["car","auto"],<><path d="m5 15 1.5-5h11L19 15v4h-2v-2H7v2H5v-4ZM8 10l1-3h6l1 3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></>),
  def("scooter","outdoor","Monopattino","Scooter",["scooter","mobility"],<><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M7 18h6l3-8h3M16 10l-2-4h3M12 14H8"/></>),
  def("bike","outdoor","Bici","Bike",["bike","bici"],<><circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="m6 16 4-7 3 7M10 9h4M13 16h5M14 9l4 7"/></>),
  def("leaf","outdoor","Giardino","Garden",["leaf","garden"],<><path d="M19 4C11 4 6 8 6 14c0 3 2 5 5 5 6 0 8-7 8-15Z"/><path d="M5 20c3-6 6-9 11-12"/></>),
  def("tree","outdoor","Albero","Tree",["tree","garden"],<><path d="M12 4c-4 0-6 3-5 6-2 1-2 5 2 5h6c4 0 4-4 2-5 1-3-1-6-5-6ZM12 15v6M9 21h6"/></>),
  def("garden","outdoor","Aiuola","Flower bed",["garden","flower"],<><path d="M12 20v-8M12 13c-4 0-5-4-3-5 2-1 3 2 3 5ZM12 13c4 0 5-4 3-5-2-1-3 2-3 5ZM6 20h12"/></>),
  def("sun","outdoor","Sole","Sun",["sun","sole"],<><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></>),
  def("rain","outdoor","Pioggia","Rain",["rain","pioggia"],<><path d="M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0 1 6ZM8 18l-1 2M12 18l-1 2M16 18l-1 2"/></>),
  def("weather","outdoor","Meteo","Weather",["weather","meteo"],<><circle cx="9" cy="9" r="3"/><path d="M9 3V1M3 9H1M5 5 3 3M14 5l2-2"/><path d="M7 18h10a3 3 0 0 0 0-6 5 5 0 0 0-9 2 2 2 0 0 0-1 4Z"/></>),
  def("pool","outdoor","Piscina","Pool",["pool","piscina"],<><path d="M3 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2M3 19c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2M7 14V7h4M7 10h4"/></>),
  def("sprinkler","outdoor","Irrigazione","Sprinkler",["sprinkler","irrigation"],<><path d="M12 20v-8M8 12h8M6 9l-3-2M18 9l3-2M9 7 7-3M15 7l-7-3"/></>),
  def("patio","outdoor","Patio","Patio",["patio","terrace"],<><path d="M4 10h16M6 10l2-5h8l2 5M7 10v10M17 10v10M10 15h4M10 20v-5M14 20v-5"/></>),
  def("grill","outdoor","Barbecue","Grill",["grill","bbq"],<><path d="M6 9h12a6 6 0 0 1-12 0ZM9 15l-2 6M15 15l2 6M8 21h8M9 6h6"/></>),
];

export const ICON_OPTIONS: IconOption[] = ICON_DEFINITIONS.map(({ glyph: _glyph, ...option }) => option);
const ICON_GLYPHS = Object.fromEntries(ICON_DEFINITIONS.map(({ key, glyph }) => [key, glyph])) as Record<string, ReactNode>;

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
  const glyph = key ? ICON_GLYPHS[key] : null;
  return glyph ? <Glyph>{glyph}</Glyph> : null;
}

export function EntityIcon({ entityId, fallback }: { entityId: string; fallback: ReactNode }) {
  const overrides = useEntityIconOverrides();
  return <>{renderEntityOverrideIcon(overrides[entityId]) ?? fallback}</>;
}
