import type { Hass } from "./types";

export type Language = "it" | "en";

const strings = {
  it: {
    upcoming: "Prossimi impegni",
    today: "Oggi",
    tomorrow: "Domani",
    noEvents: "Nessun impegno",
    todo: "Da fare",
    shopping: "Spesa",
    home: "Casa",
    favorites: "Preferiti",
    room: "Stanza",
    add: "Aggiungi",
    online: "Casa online",
    todayButton: "Oggi",
    devices: "Dispositivi",
    noDevices: "Nessun dispositivo disponibile",
    demo: "Modalità demo",
    demoHint: "Dati simulati: puoi provare l'interfaccia senza Home Assistant.",
    turnOffAll: "Spegni tutto",
    brightness: "Intensità",
    color: "Colore",
    position: "Posizione",
    controls: "Controlli",
    close: "Chiudi",
    delete: "Elimina",
    wholeHome: "Tutta la casa",
  },
  en: {
    upcoming: "Upcoming",
    today: "Today",
    tomorrow: "Tomorrow",
    noEvents: "No events",
    todo: "To do",
    shopping: "Shopping",
    home: "Home",
    favorites: "Favorites",
    room: "Room",
    add: "Add",
    online: "Home online",
    todayButton: "Today",
    devices: "Devices",
    noDevices: "No devices available",
    demo: "Demo mode",
    demoHint: "Simulated data: test the interface without Home Assistant.",
    turnOffAll: "Turn off all",
    brightness: "Brightness",
    color: "Color",
    position: "Position",
    controls: "Controls",
    close: "Close",
    delete: "Delete",
    wholeHome: "Whole home",
  },
} as const;

export type TranslationKey = keyof typeof strings.it;

export function getLanguage(hass?: Hass): Language {
  const language = hass?.locale?.language ?? navigator.language;
  return language.toLowerCase().startsWith("it") ? "it" : "en";
}

export function t(key: TranslationKey, language: Language): string {
  return strings[language][key];
}
