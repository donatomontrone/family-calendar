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
    allGood: "Tutto regolare",
    todayButton: "Oggi",
    devices: "Dispositivi",
    noDevices: "Nessun dispositivo disponibile",
    favoriteHint: "Tasto destro o pressione prolungata per aggiungere ai preferiti.",
    demo: "Modalità demo",
    demoHint: "Dati simulati: puoi provare l'interfaccia senza Home Assistant.",
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
    allGood: "All systems normal",
    todayButton: "Today",
    devices: "Devices",
    noDevices: "No devices available",
    favoriteHint: "Right-click or long-press to add to favorites.",
    demo: "Demo mode",
    demoHint: "Simulated data: test the interface without Home Assistant.",
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
