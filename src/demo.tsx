import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { Area, EntityRegistryEntry, Hass, HassState } from "./types";
import "./styles.css";
import "./theme.css";
import "./home-view.css";
import "./apple-home.css";
import "./stability.css";
import "./reel-home.css";
import "./climate.css";

const isoNow = () => new Date().toISOString();
const state = (
  entityId: string,
  value: string,
  name: string,
  attributes: Record<string, unknown> = {},
): HassState => ({
  entity_id: entityId,
  state: value,
  attributes: { friendly_name: name, ...attributes },
  last_changed: isoNow(),
  last_updated: isoNow(),
});

const climateAttributes = (
  currentTemperature: number,
  targetTemperature: number,
  fanMode = "auto",
  presetMode = "comfort",
): Record<string, unknown> => ({
  current_temperature: currentTemperature,
  temperature: targetTemperature,
  min_temp: 16,
  max_temp: 30,
  target_temp_step: 0.5,
  hvac_modes: ["off", "heat", "cool", "heat_cool", "fan_only", "dry"],
  hvac_action: "idle",
  fan_modes: ["auto", "low", "medium", "high"],
  fan_mode: fanMode,
  preset_modes: ["none", "eco", "comfort", "sleep"],
  preset_mode: presetMode,
});

const areas: Area[] = [
  { area_id: "soggiorno", name: "Soggiorno" },
  { area_id: "cucina", name: "Cucina" },
  { area_id: "camera", name: "Camera" },
  { area_id: "studio", name: "Studio" },
];

const registry: EntityRegistryEntry[] = [
  { entity_id: "light.soggiorno", area_id: "soggiorno" },
  { entity_id: "cover.salotto", area_id: "soggiorno" },
  { entity_id: "climate.soggiorno", area_id: "soggiorno" },
  { entity_id: "switch.tv", area_id: "soggiorno" },
  { entity_id: "media_player.soggiorno", area_id: "soggiorno" },
  { entity_id: "sensor.temperatura_soggiorno", area_id: "soggiorno" },
  { entity_id: "binary_sensor.porta_ingresso", area_id: "soggiorno" },
  { entity_id: "camera.soggiorno", area_id: "soggiorno" },

  { entity_id: "light.cucina", area_id: "cucina" },
  { entity_id: "switch.macchina_caffe", area_id: "cucina" },
  { entity_id: "climate.cucina", area_id: "cucina" },
  { entity_id: "sensor.temperatura_cucina", area_id: "cucina" },
  { entity_id: "binary_sensor.movimento_cucina", area_id: "cucina" },
  { entity_id: "camera.cucina", area_id: "cucina" },

  { entity_id: "light.camera", area_id: "camera" },
  { entity_id: "cover.camera", area_id: "camera" },
  { entity_id: "climate.camera", area_id: "camera" },
  { entity_id: "media_player.camera", area_id: "camera" },
  { entity_id: "sensor.temperatura_camera", area_id: "camera" },
  { entity_id: "binary_sensor.finestra_camera", area_id: "camera" },

  { entity_id: "light.studio", area_id: "studio" },
  { entity_id: "switch.scrivania", area_id: "studio" },
  { entity_id: "climate.studio", area_id: "studio" },
  { entity_id: "sensor.temperatura_studio", area_id: "studio" },
  { entity_id: "binary_sensor.presenza_studio", area_id: "studio" },
  { entity_id: "camera.studio", area_id: "studio" },
];

const initialStates: Record<string, HassState> = {
  "light.soggiorno": state("light.soggiorno", "on", "Luce soggiorno", { brightness: 196, demo_hex_color: "#ffd45a" }),
  "cover.salotto": state("cover.salotto", "open", "Tenda salotto", { current_position: 72 }),
  "climate.soggiorno": state("climate.soggiorno", "heat_cool", "Clima soggiorno", { ...climateAttributes(22.6, 23), hvac_action: "idle" }),
  "switch.tv": state("switch.tv", "off", "TV"),
  "media_player.soggiorno": state("media_player.soggiorno", "playing", "Apple TV soggiorno", { volume_level: 0.34, media_title: "Living Room" }),
  "sensor.temperatura_soggiorno": state("sensor.temperatura_soggiorno", "22.6", "Temperatura soggiorno", { device_class: "temperature", unit_of_measurement: "°C" }),
  "binary_sensor.porta_ingresso": state("binary_sensor.porta_ingresso", "off", "Porta ingresso", { device_class: "door" }),
  "camera.soggiorno": state("camera.soggiorno", "streaming", "Camera soggiorno"),

  "light.cucina": state("light.cucina", "on", "Luce cucina", { brightness: 150, demo_hex_color: "#ffe8bd" }),
  "switch.macchina_caffe": state("switch.macchina_caffe", "off", "Macchina caffè"),
  "climate.cucina": state("climate.cucina", "cool", "Clima cucina", { ...climateAttributes(23.3, 22, "medium", "eco"), hvac_action: "cooling" }),
  "sensor.temperatura_cucina": state("sensor.temperatura_cucina", "23.3", "Temperatura cucina", { device_class: "temperature", unit_of_measurement: "°C" }),
  "binary_sensor.movimento_cucina": state("binary_sensor.movimento_cucina", "on", "Movimento cucina", { device_class: "motion" }),
  "camera.cucina": state("camera.cucina", "streaming", "Camera cucina"),

  "light.camera": state("light.camera", "off", "Luce camera", { brightness: 110, demo_hex_color: "#ffb4a2" }),
  "cover.camera": state("cover.camera", "closed", "Tapparella camera", { current_position: 0 }),
  "climate.camera": state("climate.camera", "heat", "Clima camera", { ...climateAttributes(21.9, 22.5, "low", "sleep"), hvac_action: "heating" }),
  "media_player.camera": state("media_player.camera", "paused", "HomePod camera", { volume_level: 0.22 }),
  "sensor.temperatura_camera": state("sensor.temperatura_camera", "21.9", "Temperatura camera", { device_class: "temperature", unit_of_measurement: "°C" }),
  "binary_sensor.finestra_camera": state("binary_sensor.finestra_camera", "off", "Finestra camera", { device_class: "window" }),

  "light.studio": state("light.studio", "on", "Luce studio", { brightness: 210, demo_hex_color: "#d9e9ff" }),
  "switch.scrivania": state("switch.scrivania", "on", "Scrivania"),
  "climate.studio": state("climate.studio", "fan_only", "Clima studio", { ...climateAttributes(22.4, 22, "high", "none"), hvac_action: "fan" }),
  "sensor.temperatura_studio": state("sensor.temperatura_studio", "22.4", "Temperatura studio", { device_class: "temperature", unit_of_measurement: "°C" }),
  "binary_sensor.presenza_studio": state("binary_sensor.presenza_studio", "on", "Presenza studio", { device_class: "presence" }),
  "camera.studio": state("camera.studio", "streaming", "Camera studio"),

  "alarm_control_panel.casa": state("alarm_control_panel.casa", "disarmed", "Allarme casa"),
  "weather.casa": state("weather.casa", "sunny", "Meteo casa", { temperature: 24.5 }),
  "scene.relax": state("scene.relax", "scening", "Relax"),
  "scene.esco": state("scene.esco", "scening", "Esco"),
  "scene.buonanotte": state("scene.buonanotte", "scening", "Buonanotte"),
  "scene.ospiti": state("scene.ospiti", "scening", "Modalità ospiti"),
  "scene.film": state("scene.film", "scening", "Serata film"),
};

function DemoHarness() {
  const [states, setStates] = useState(initialStates);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("family-calendar-demo-favorites");
      return stored ? JSON.parse(stored) : ["light.soggiorno", "cover.salotto", "switch.tv"];
    } catch {
      return ["light.soggiorno", "cover.salotto", "switch.tv"];
    }
  });

  const hass = useMemo<Hass>(() => ({
    states,
    locale: { language: navigator.language },
    callService: async (domain, service, data) => {
      const entityId = String(data?.entity_id ?? "");
      setStates((current) => {
        const existing = current[entityId];
        if (!existing) return current;

        let nextState = existing.state;
        const nextAttributes = { ...existing.attributes };

        if (service === "toggle") nextState = existing.state === "on" ? "off" : "on";
        if (service === "open_cover") {
          nextState = "open";
          nextAttributes.current_position = 100;
        }
        if (service === "close_cover") {
          nextState = "closed";
          nextAttributes.current_position = 0;
        }
        if (service === "stop_cover") nextState = existing.state;
        if (service === "set_cover_position") {
          const position = Number(data?.position ?? 0);
          nextState = position > 0 ? "open" : "closed";
          nextAttributes.current_position = position;
        }
        if (service === "turn_on") {
          nextState = domain === "climate" ? "heat" : "on";
          if (domain === "light" && data?.brightness_pct !== undefined) {
            nextAttributes.brightness = Math.round((Number(data.brightness_pct) / 100) * 255);
          }
          if (domain === "light" && Array.isArray(data?.rgb_color)) {
            const [r, g, b] = data.rgb_color.map(Number);
            nextAttributes.demo_hex_color = `#${[r, g, b].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
            nextAttributes.rgb_color = [r, g, b];
          }
        }
        if (service === "turn_off") {
          nextState = "off";
          if (domain === "climate") nextAttributes.hvac_action = "off";
        }
        if (domain === "climate" && service === "set_temperature") {
          nextAttributes.temperature = Number(data?.temperature ?? nextAttributes.temperature ?? 22);
        }
        if (domain === "climate" && service === "set_hvac_mode") {
          const mode = String(data?.hvac_mode ?? "off");
          nextState = mode;
          nextAttributes.hvac_action = mode === "heat" ? "heating" : mode === "cool" ? "cooling" : mode === "fan_only" ? "fan" : mode === "dry" ? "drying" : mode === "off" ? "off" : "idle";
        }
        if (domain === "climate" && service === "set_fan_mode") nextAttributes.fan_mode = String(data?.fan_mode ?? "auto");
        if (domain === "climate" && service === "set_preset_mode") nextAttributes.preset_mode = String(data?.preset_mode ?? "none");
        if (domain === "media_player" && service === "media_play_pause") nextState = existing.state === "playing" ? "paused" : "playing";
        if (domain === "media_player" && service === "volume_set") nextAttributes.volume_level = Number(data?.volume_level ?? 0.35);

        return {
          ...current,
          [entityId]: {
            ...existing,
            state: nextState,
            attributes: nextAttributes,
            last_changed: isoNow(),
            last_updated: isoNow(),
          },
        };
      });
    },
    callWS: async <T,>(message: Record<string, unknown>): Promise<T> => {
      if (message.type === "config/area_registry/list") return areas as T;
      if (message.type === "config/entity_registry/list") return registry as T;
      if (message.type === "family_calendar/favorites/get") return { entity_ids: favorites } as T;
      if (message.type === "family_calendar/favorites/set") {
        const next = Array.isArray(message.entity_ids) ? message.entity_ids.map(String) : [];
        setFavorites(next);
        localStorage.setItem("family-calendar-demo-favorites", JSON.stringify(next));
        return { entity_ids: next } as T;
      }
      throw new Error(`Unsupported demo WebSocket command: ${String(message.type)}`);
    },
  }), [states, favorites]);

  return <App hass={hass} demo />;
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(
  <React.StrictMode>
    <DemoHarness />
  </React.StrictMode>,
);
