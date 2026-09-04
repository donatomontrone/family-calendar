import type { Hass } from "./types";
import type { Language } from "./i18n";

type Props = {
  hass: Hass;
  entityIds: string[];
  language: Language;
};

export default function RoomInsights({ hass, entityIds, language }: Props) {
  const states = entityIds.map((id) => hass.states[id]).filter(Boolean);
  const lightsOn = states.filter((state) => state.entity_id.startsWith("light.") && state.state === "on").length;
  const openingStates = states.filter((state) => {
    if (!state.entity_id.startsWith("binary_sensor.")) return false;
    return ["door", "window", "opening", "garage_door"].includes(String(state.attributes.device_class ?? ""));
  });
  const openingsOpen = openingStates.filter((state) => state.state === "on").length;
  const presence = states.some((state) => {
    if (!state.entity_id.startsWith("binary_sensor.")) return false;
    const deviceClass = String(state.attributes.device_class ?? "");
    return ["motion", "occupancy", "presence"].includes(deviceClass) && state.state === "on";
  });
  const humidityState = states.find((state) =>
    state.entity_id.startsWith("sensor.") && (
      String(state.attributes.device_class ?? "") === "humidity" ||
      String(state.attributes.unit_of_measurement ?? "") === "%"
    )
  );
  const humidity = humidityState ? Number(humidityState.state) : undefined;
  const climate = states.find((state) => state.entity_id.startsWith("climate."));
  const targetTemperature = climate ? Number(climate.attributes.temperature) : undefined;

  const labels = language === "it" ? {
    noLights: "Luci spente",
    oneLight: "1 luce accesa",
    lights: (count: number) => `${count} luci accese`,
    secure: "Aperture chiuse",
    oneOpen: "1 apertura aperta",
    open: (count: number) => `${count} aperture aperte`,
    presence: "Presenza rilevata",
    humidity: "Umidità",
    climate: "Clima",
  } : {
    noLights: "Lights off",
    oneLight: "1 light on",
    lights: (count: number) => `${count} lights on`,
    secure: "Openings closed",
    oneOpen: "1 opening open",
    open: (count: number) => `${count} openings open`,
    presence: "Presence detected",
    humidity: "Humidity",
    climate: "Climate",
  };

  const lightLabel = lightsOn === 0 ? labels.noLights : lightsOn === 1 ? labels.oneLight : labels.lights(lightsOn);
  const openingLabel = openingsOpen === 0 ? labels.secure : openingsOpen === 1 ? labels.oneOpen : labels.open(openingsOpen);

  return (
    <div className="room-insights" aria-label={language === "it" ? "Stato stanza" : "Room status"}>
      <span className={lightsOn > 0 ? "active" : ""}><BulbIcon />{lightLabel}</span>
      {openingStates.length > 0 && <span className={openingsOpen > 0 ? "warning" : ""}><DoorIcon />{openingLabel}</span>}
      {presence && <span className="presence"><PresenceIcon />{labels.presence}</span>}
      {Number.isFinite(humidity) && <span><DropletIcon />{labels.humidity} {Math.round(humidity as number)}%</span>}
      {Number.isFinite(targetTemperature) && <span><ThermometerIcon />{labels.climate} {(targetTemperature as number).toFixed((targetTemperature as number) % 1 === 0 ? 0 : 1)}°</span>}
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{children}</svg>;
}

function BulbIcon() {
  return <Icon><path d="M9.4 17.2h5.2M10.3 19.7h3.4M12 3.4a6.1 6.1 0 0 0-3.6 11c.7.5 1 1.2 1 2.1h5.2c0-.9.3-1.6 1-2.1A6.1 6.1 0 0 0 12 3.4Z" /></Icon>;
}

function DoorIcon() {
  return <Icon><path d="M7.2 4.2h9.6v15.6H7.2Z"/><circle cx="14" cy="12" r=".65"/></Icon>;
}

function PresenceIcon() {
  return <Icon><circle cx="12" cy="8" r="2.3"/><path d="M7.8 19c.4-3.5 1.8-5.4 4.2-5.4s3.8 1.9 4.2 5.4"/></Icon>;
}

function DropletIcon() {
  return <Icon><path d="M12 3.5c-2 2.9-4.8 6.2-4.8 9.7a4.8 4.8 0 0 0 9.6 0c0-3.5-2.8-6.8-4.8-9.7Z"/></Icon>;
}

function ThermometerIcon() {
  return <Icon><path d="M14.1 14.8V6a2.1 2.1 0 0 0-4.2 0v8.8a4 4 0 1 0 4.2 0Z"/><path d="M12 8.2v7.3"/></Icon>;
}
