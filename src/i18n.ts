export type Language = "it" | "en";

const strings = {
  it: {
    upcoming: "PROSSIMI IMPEGNI",
    todo: "Promemoria",
    shopping: "Spesa",
    home: "CASA",
    normal: "Normale",
    favorites: "★ Preferiti",
    room: "Stanza...",
    add: "+ Aggiungi",
    online: "● Casa online",
    hint: "Tasto destro / pressione prolungata per Preferiti."
  },
  en: {
    upcoming: "UPCOMING",
    todo: "TO DO",
    shopping: "SHOPPING",
    home: "HOME",
    normal: "Normal",
    favorites: "★ Favorites",
    room: "Room...",
    add: "+ Add",
    online: "● Home online",
    hint: "Right-click / long-press to manage Favorites."
  }
} as const;

export function getLanguage(): Language {
  return navigator.language.toLowerCase().startsWith("it") ? "it" : "en";
}

export function t(key: keyof typeof strings.it, language = getLanguage()) {
  return strings[language][key];
}
