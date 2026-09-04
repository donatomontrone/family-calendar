import type { Hass } from "./types";

export type Language = "it" | "en";

const strings = {
  it: {
    agenda: "Agenda",
    upcoming: "Prossimi impegni",
    today: "Oggi",
    tomorrow: "Domani",
    noEvents: "Nessun impegno",
    lists: "Liste",
    todo: "Da fare",
    shopping: "Spesa",
    calendar: "Calendario",
    views: "Visualizzazioni",
    previousMonth: "Mese precedente",
    nextMonth: "Mese successivo",
    smartHome: "Casa intelligente",
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
    agenda: "Agenda",
    upcoming: "Upcoming",
    today: "Today",
    tomorrow: "Tomorrow",
    noEvents: "No events",
    lists: "Lists",
    todo: "To do",
    shopping: "Shopping",
    calendar: "Calendar",
    views: "Views",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    smartHome: "Smart home",
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

/**
 * Family Calendar deliberately supports two UI languages only:
 * - Home Assistant locale starting with `it` -> Italian
 * - every other Home Assistant locale -> English
 *
 * The browser locale is used only by the standalone demo, where no real
 * Home Assistant locale exists yet.
 */
export function getLanguage(hass?: Hass): Language {
  const language = hass?.locale?.language ?? navigator.language;
  return language.toLowerCase().startsWith("it") ? "it" : "en";
}

export function t(key: TranslationKey, language: Language): string {
  return strings[language][key];
}
