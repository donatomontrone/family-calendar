import type { ReactNode } from "react";
import "./ui-interactions";
import type { Hass } from "./types";
import type { Language } from "./i18n";

type SharedHeaderProps = {
  hass: Hass;
  now: Date;
  language: Language;
  onAlarm?: () => void;
  onNotifications?: () => void;
};

export default function SharedHeader({
  hass,
  now,
  language,
  onAlarm,
  onNotifications,
}: SharedHeaderProps) {
  const weather = Object.values(hass.states).find((state) => state.entity_id.startsWith("weather."));
  const alarm = Object.values(hass.states).find((state) => state.entity_id.startsWith("alarm_control_panel."));
  const outside = Number(weather?.attributes.temperature ?? 24.5);
  const armed = Boolean(alarm && alarm.state !== "disarmed");
  const copy = language === "it" ? itCopy : enCopy;

  return (
    <header className="reel-topbar">
      <div className="reel-greeting">
        <strong>{greetingForHour(now.getHours(), copy)}</strong>
        <span>{now.toLocaleDateString(locale(language), { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>
      <div className="reel-clock">{now.toLocaleTimeString(locale(language), { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="reel-top-actions">
        <span className="weather-pill"><SunIcon /><strong>{Number.isFinite(outside) ? outside.toFixed(1) : "—"}°</strong><small>{copy.sunny}</small></span>
        <span className="avatar-stack" aria-label={copy.family}><i>G</i><i>A</i></span>
        <button type="button" className="security-pill" onClick={onAlarm} aria-label={armed ? copy.armed : copy.disarmed}><ShieldIcon /><span>{armed ? copy.armed : copy.disarmed}</span></button>
        <button type="button" className="round-top" onClick={onNotifications} aria-label={copy.notifications}><BellIcon /></button>
      </div>
    </header>
  );
}

const itCopy = {
  sunny: "Soleggiato",
  notifications: "Notifiche",
  armed: "Inserito",
  disarmed: "Disattivo",
  family: "Famiglia",
  goodMorning: "Buongiorno",
  goodAfternoon: "Buon pomeriggio",
  goodEvening: "Buonasera",
  goodNight: "Buonanotte",
};

const enCopy: typeof itCopy = {
  sunny: "Sunny",
  notifications: "Notifications",
  armed: "Armed",
  disarmed: "Disarmed",
  family: "Family",
  goodMorning: "Good morning",
  goodAfternoon: "Good afternoon",
  goodEvening: "Good evening",
  goodNight: "Good night",
};

function greetingForHour(hour: number, copy: typeof itCopy) {
  if (hour < 5) return copy.goodNight;
  if (hour < 12) return copy.goodMorning;
  if (hour < 18) return copy.goodAfternoon;
  return copy.goodEvening;
}

function locale(language: Language) {
  return language === "it" ? "it-IT" : "en-GB";
}

function Svg({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{children}</svg>;
}

function ShieldIcon() {
  return <Svg><><path d="M12 3.2 18.7 6v5c0 4.8-2.6 7.9-6.7 9.8C7.9 18.9 5.3 15.8 5.3 11V6Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/><path d="m9.2 12 1.7 1.7 3.9-3.9" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/></></Svg>;
}

function BellIcon() {
  return <Svg><path d="M6.7 16.8h10.6l-1.4-2V10a3.9 3.9 0 0 0-7.8 0v4.8ZM10.2 19h3.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function SunIcon() {
  return <Svg><><circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.45"/><path d="M12 3.3v2M12 18.7v2M3.3 12h2M18.7 12h2M5.9 5.9l1.4 1.4M16.7 16.7l1.4 1.4M18.1 5.9l-1.4 1.4M7.3 16.7l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"/></></Svg>;
}
