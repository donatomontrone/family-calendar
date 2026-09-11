import type { ReactNode } from "react";
import "./ui-interactions";
import "./calendar-header-home.css";
import "./home-v4.css";
import type { Hass } from "./types";
import type { Language } from "./i18n";

type SharedHeaderProps = {
  hass: Hass;
  now: Date;
  language: Language;
  onAlarm?: () => void;
  onNotifications?: () => void;
  onThemeToggle?: () => void;
  isNight?: boolean;
  themeLabel?: string;
};

export default function SharedHeader({
  hass,
  now,
  language,
  onAlarm,
  onNotifications,
  onThemeToggle,
  isNight = false,
  themeLabel,
}: SharedHeaderProps) {
  const weather = Object.values(hass.states).find((state) => state.entity_id.startsWith("weather."));
  const alarm = Object.values(hass.states).find((state) => state.entity_id.startsWith("alarm_control_panel."));
  const outside = Number(weather?.attributes.temperature ?? 24.5);
  const armed = Boolean(alarm && alarm.state !== "disarmed");
  const copy = language === "it" ? itCopy : enCopy;

  return (
    <header className="reel-topbar shared-home-header casa-header-contract">
      <div className="reel-greeting">
        <strong>{greetingForHour(now.getHours(), copy)}</strong>
        <span>{now.toLocaleDateString(locale(language), { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>
      <div className="reel-clock">{now.toLocaleTimeString(locale(language), { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="reel-top-actions">
        <span className="weather-pill"><SunIcon /><strong>{outside.toFixed(1)}°</strong><small>{copy.sunny}</small></span>
        <span className="avatar-stack"><i>G</i><i>A</i></span>
        <button type="button" className="security-pill" onClick={onAlarm}><ShieldIcon /><span>{armed ? copy.armed : copy.disarmed}</span></button>
        <button type="button" className="round-top" onClick={onNotifications} aria-label={copy.notifications}><BellIcon /></button>
        {onThemeToggle && (
          <button type="button" className="header-theme-switch" onClick={onThemeToggle} aria-label={themeLabel ?? copy.appearance}>
            {isNight ? <SunIcon /> : <MoonIcon />}
          </button>
        )}
      </div>
    </header>
  );
}

/* Keep these strings byte-for-byte aligned with HomeView: the shared calendar
 * header is a second renderer of the approved CASA header, not a variation. */
const itCopy = {
  sunny: "Sereno",
  notifications: "Notifiche",
  appearance: "Aspetto",
  armed: "Inserito",
  disarmed: "Disinserito",
  goodMorning: "Buongiorno",
  goodAfternoon: "Buon pomeriggio",
  goodEvening: "Buonasera",
};

const enCopy: typeof itCopy = {
  sunny: "Sunny",
  notifications: "Notifications",
  appearance: "Appearance",
  armed: "Armed",
  disarmed: "Disarmed",
  goodMorning: "Good morning",
  goodAfternoon: "Good afternoon",
  goodEvening: "Good evening",
};

function greetingForHour(hour: number, copy: typeof itCopy) {
  return hour < 12 ? copy.goodMorning : hour < 18 ? copy.goodAfternoon : copy.goodEvening;
}

function locale(language: Language) {
  return language === "it" ? "it-IT" : "en-GB";
}

/* These SVGs are the same definitions used by HomeView's approved CASA header. */
function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
}

function StrokeIcon({ children }: { children: ReactNode }) {
  return <Icon><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</g></Icon>;
}

function ShieldIcon() {
  return <StrokeIcon><path d="M12 3.2 18.7 6v5c0 4.8-2.6 7.9-6.7 9.8C7.9 18.9 5.3 15.8 5.3 11V6Z"/><path d="m9.2 12 1.7 1.7 3.9-3.9"/></StrokeIcon>;
}

function BellIcon() {
  return <StrokeIcon><path d="M6.7 16.8h10.6l-1.4-2V10a3.9 3.9 0 0 0-7.8 0v4.8Z"/><path d="M10.2 19h3.6"/></StrokeIcon>;
}

function SunIcon() {
  return <StrokeIcon><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></StrokeIcon>;
}

function MoonIcon() {
  return <StrokeIcon><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5Z"/></StrokeIcon>;
}
