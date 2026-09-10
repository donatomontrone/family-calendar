import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { Area, EntityRegistryEntry, Hass, HassState } from "./types";
import "./segmented-gestures";
import "./ui-interactions";
import "./styles.css";
import "./theme.css";
import "./home-view.css";
import "./apple-home.css";
import "./stability.css";
import "./reel-home.css";
import "./climate.css";
import "./home-features.css";
import "./readability.css";
import "./segmented.css";
import "./design-system.css";
import "./design-tuning.css";
import "./calendar-smart-home-polish.css";
import "./smart-home-device-cards.css";
import "./control-language.css";
import "./apple-guidelines.css";
import "./calendar-v3.css";

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

const whiteAmbianceAttributes = (kelvin: number): Record<string, unknown> => ({
  min_color_temp_kelvin: 2200,
  max_color_temp_kelvin: 6500,
  color_temp_kelvin: kelvin,
  supported_color_modes: ["color_temp"],
  color_mode: "color_temp",
});

const areas: Area[] = [
  { area_id: "open_space", name: "Open space" },
  { area_id: "disimpegno", name: "Disimpegno" },
  { area_id: "bagno_padronale", name: "Bagno padronale" },
  { area_id: "bagno_servizio", name: "Bagno di servizio" },
  { area_id: "cameretta", name: "Cameretta" },
  { area_id: "camera_letto", name: "Camera da letto" },
  { area_id: "esterno", name: "Esterno" },
];

const registry: EntityRegistryEntry[] = [
  // Open space: cucina, sala da pranzo, studio e salotto.
  { entity_id: "light.soggiorno", area_id: "open_space" },
  { entity_id: "light.cucina", area_id: "open_space" },
  { entity_id: "light.sala_da_pranzo", area_id: "open_space" },
  { entity_id: "light.studio", area_id: "open_space" },
  { entity_id: "cover.salotto", area_id: "open_space" },
  { entity_id: "climate.soggiorno", area_id: "open_space" },
  { entity_id: "climate.cucina", area_id: "open_space" },
  { entity_id: "climate.studio", area_id: "open_space" },
  { entity_id: "switch.tv", area_id: "open_space" },
  { entity_id: "switch.macchina_caffe", area_id: "open_space" },
  { entity_id: "switch.scrivania", area_id: "open_space" },
  { entity_id: "media_player.soggiorno", area_id: "open_space" },
  { entity_id: "sensor.temperatura_soggiorno", area_id: "open_space" },
  { entity_id: "sensor.umidita_soggiorno", area_id: "open_space" },
  { entity_id: "sensor.temperatura_cucina", area_id: "open_space" },
  { entity_id: "sensor.umidita_cucina", area_id: "open_space" },
  { entity_id: "sensor.temperatura_studio", area_id: "open_space" },
  { entity_id: "sensor.umidita_studio", area_id: "open_space" },
  { entity_id: "binary_sensor.movimento_cucina", area_id: "open_space" },
  { entity_id: "binary_sensor.presenza_studio", area_id: "open_space" },
  { entity_id: "camera.cucina", area_id: "open_space" },
  { entity_id: "camera.studio", area_id: "open_space" },

  { entity_id: "light.disimpegno", area_id: "disimpegno" },
  { entity_id: "binary_sensor.porta_ingresso", area_id: "disimpegno" },
  { entity_id: "sensor.temperatura_disimpegno", area_id: "disimpegno" },

  { entity_id: "light.bagno_padronale", area_id: "bagno_padronale" },
  { entity_id: "sensor.umidita_bagno_padronale", area_id: "bagno_padronale" },
  { entity_id: "binary_sensor.presenza_bagno_padronale", area_id: "bagno_padronale" },

  { entity_id: "light.bagno_servizio", area_id: "bagno_servizio" },
  { entity_id: "sensor.umidita_bagno_servizio", area_id: "bagno_servizio" },

  { entity_id: "light.cameretta", area_id: "cameretta" },
  { entity_id: "cover.cameretta", area_id: "cameretta" },
  { entity_id: "climate.cameretta", area_id: "cameretta" },
  { entity_id: "sensor.temperatura_cameretta", area_id: "cameretta" },
  { entity_id: "sensor.umidita_cameretta", area_id: "cameretta" },
  { entity_id: "binary_sensor.finestra_cameretta", area_id: "cameretta" },

  { entity_id: "light.camera", area_id: "camera_letto" },
  { entity_id: "cover.camera", area_id: "camera_letto" },
  { entity_id: "climate.camera", area_id: "camera_letto" },
  { entity_id: "media_player.camera", area_id: "camera_letto" },
  { entity_id: "sensor.temperatura_camera", area_id: "camera_letto" },
  { entity_id: "sensor.umidita_camera", area_id: "camera_letto" },
  { entity_id: "binary_sensor.finestra_camera", area_id: "camera_letto" },

  { entity_id: "light.patio", area_id: "esterno" },
  { entity_id: "camera.patio", area_id: "esterno" },
  { entity_id: "binary_sensor.presenza_patio", area_id: "esterno" },
  { entity_id: "sensor.temperatura_esterno", area_id: "esterno" },
];

const initialStates: Record<string, HassState> = {
  "light.soggiorno": state("light.soggiorno", "on", "Luce salotto", { brightness: 196, ...whiteAmbianceAttributes(2850) }),
  "light.cucina": state("light.cucina", "on", "Luce cucina", { brightness: 150, ...whiteAmbianceAttributes(3400) }),
  "light.sala_da_pranzo": state("light.sala_da_pranzo", "on", "Luce sala da pranzo", { brightness: 184, ...whiteAmbianceAttributes(3000) }),
  "light.studio": state("light.studio", "on", "Luce studio", { brightness: 210, ...whiteAmbianceAttributes(5200) }),
  "cover.salotto": state("cover.salotto", "open", "Tenda salotto", { current_position: 72 }),
  "climate.soggiorno": state("climate.soggiorno", "heat_cool", "Clima salotto", { ...climateAttributes(22.6, 23), hvac_action: "idle" }),
  "climate.cucina": state("climate.cucina", "cool", "Clima cucina", { ...climateAttributes(23.3, 22, "medium", "eco"), hvac_action: "cooling" }),
  "climate.studio": state("climate.studio", "fan_only", "Clima studio", { ...climateAttributes(22.4, 22, "high", "none"), hvac_action: "fan" }),
  "switch.tv": state("switch.tv", "off", "TV"),
  "switch.macchina_caffe": state("switch.macchina_caffe", "off", "Macchina caffè"),
  "switch.scrivania": state("switch.scrivania", "on", "Scrivania"),
  "media_player.soggiorno": state("media_player.soggiorno", "playing", "Apple TV salotto", { volume_level: 0.34, media_title: "Salotto" }),
  "sensor.temperatura_soggiorno": state("sensor.temperatura_soggiorno", "22.6", "Temperatura salotto", { device_class: "temperature", unit_of_measurement: "°C" }),
  "sensor.umidita_soggiorno": state("sensor.umidita_soggiorno", "46", "Umidità salotto", { device_class: "humidity", unit_of_measurement: "%" }),
  "sensor.temperatura_cucina": state("sensor.temperatura_cucina", "23.3", "Temperatura cucina", { device_class: "temperature", unit_of_measurement: "°C" }),
  "sensor.umidita_cucina": state("sensor.umidita_cucina", "52", "Umidità cucina", { device_class: "humidity", unit_of_measurement: "%" }),
  "sensor.temperatura_studio": state("sensor.temperatura_studio", "22.4", "Temperatura studio", { device_class: "temperature", unit_of_measurement: "°C" }),
  "sensor.umidita_studio": state("sensor.umidita_studio", "44", "Umidità studio", { device_class: "humidity", unit_of_measurement: "%" }),
  "binary_sensor.movimento_cucina": state("binary_sensor.movimento_cucina", "on", "Movimento cucina", { device_class: "motion" }),
  "binary_sensor.presenza_studio": state("binary_sensor.presenza_studio", "on", "Presenza studio", { device_class: "presence" }),
  "camera.cucina": state("camera.cucina", "streaming", "Camera cucina"),
  "camera.studio": state("camera.studio", "streaming", "Camera studio"),

  "light.disimpegno": state("light.disimpegno", "off", "Luce disimpegno", { brightness: 130, ...whiteAmbianceAttributes(3000) }),
  "binary_sensor.porta_ingresso": state("binary_sensor.porta_ingresso", "off", "Porta ingresso", { device_class: "door" }),
  "sensor.temperatura_disimpegno": state("sensor.temperatura_disimpegno", "22.1", "Temperatura disimpegno", { device_class: "temperature", unit_of_measurement: "°C" }),

  "light.bagno_padronale": state("light.bagno_padronale", "on", "Luce bagno padronale", { brightness: 170, ...whiteAmbianceAttributes(3500) }),
  "sensor.umidita_bagno_padronale": state("sensor.umidita_bagno_padronale", "55", "Umidità bagno padronale", { device_class: "humidity", unit_of_measurement: "%" }),
  "binary_sensor.presenza_bagno_padronale": state("binary_sensor.presenza_bagno_padronale", "off", "Presenza bagno padronale", { device_class: "presence" }),

  "light.bagno_servizio": state("light.bagno_servizio", "off", "Luce bagno di servizio", { brightness: 145, ...whiteAmbianceAttributes(3300) }),
  "sensor.umidita_bagno_servizio": state("sensor.umidita_bagno_servizio", "58", "Umidità bagno di servizio", { device_class: "humidity", unit_of_measurement: "%" }),

  "light.cameretta": state("light.cameretta", "on", "Luce cameretta", { brightness: 165, ...whiteAmbianceAttributes(3200) }),
  "cover.cameretta": state("cover.cameretta", "open", "Tapparella cameretta", { current_position: 48 }),
  "climate.cameretta": state("climate.cameretta", "heat", "Clima cameretta", { ...climateAttributes(21.7, 22), hvac_action: "heating" }),
  "sensor.temperatura_cameretta": state("sensor.temperatura_cameretta", "21.7", "Temperatura cameretta", { device_class: "temperature", unit_of_measurement: "°C" }),
  "sensor.umidita_cameretta": state("sensor.umidita_cameretta", "48", "Umidità cameretta", { device_class: "humidity", unit_of_measurement: "%" }),
  "binary_sensor.finestra_cameretta": state("binary_sensor.finestra_cameretta", "off", "Finestra cameretta", { device_class: "window" }),

  "light.camera": state("light.camera", "off", "Luce camera da letto", { brightness: 110, ...whiteAmbianceAttributes(2500) }),
  "cover.camera": state("cover.camera", "closed", "Tapparella camera da letto", { current_position: 0 }),
  "climate.camera": state("climate.camera", "heat", "Clima camera da letto", { ...climateAttributes(21.9, 22.5, "low", "sleep"), hvac_action: "heating" }),
  "media_player.camera": state("media_player.camera", "paused", "HomePod camera da letto", { volume_level: 0.22 }),
  "sensor.temperatura_camera": state("sensor.temperatura_camera", "21.9", "Temperatura camera da letto", { device_class: "temperature", unit_of_measurement: "°C" }),
  "sensor.umidita_camera": state("sensor.umidita_camera", "49", "Umidità camera da letto", { device_class: "humidity", unit_of_measurement: "%" }),
  "binary_sensor.finestra_camera": state("binary_sensor.finestra_camera", "off", "Finestra camera da letto", { device_class: "window" }),

  "light.patio": state("light.patio", "off", "Luce patio", { brightness: 150, ...whiteAmbianceAttributes(2700) }),
  "camera.patio": state("camera.patio", "streaming", "Camera patio"),
  "binary_sensor.presenza_patio": state("binary_sensor.presenza_patio", "off", "Presenza patio", { device_class: "presence" }),
  "sensor.temperatura_esterno": state("sensor.temperatura_esterno", "20.8", "Temperatura esterno", { device_class: "temperature", unit_of_measurement: "°C" }),

  "alarm_control_panel.casa": state("alarm_control_panel.casa", "disarmed", "Allarme casa"),
  "weather.casa": state("weather.casa", "sunny", "Meteo casa", { temperature: 24.5 }),
  "scene.relax": state("scene.relax", "scening", "Relax"),
  "scene.esco": state("scene.esco", "scening", "Esco"),
  "scene.buonanotte": state("scene.buonanotte", "scening", "Buonanotte"),
  "scene.ospiti": state("scene.ospiti", "scening", "Modalità ospiti"),
  "scene.film": state("scene.film", "scening", "Serata film"),
};

const demoNotifications = [
  {
    notification_id: "demo-door",
    title: "Porta ingresso",
    message: "La porta d'ingresso è stata aperta alle 15:32.",
    status: "unread",
    created_at: isoNow(),
  },
  {
    notification_id: "demo-vacuum",
    title: "Aspirapolvere",
    message: "Pulizia completata. Il robot è tornato alla base.",
    status: "read",
    created_at: isoNow(),
  },
];

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
    locale: { language: "it-IT" },
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
          if (domain === "light" && data?.color_temp_kelvin !== undefined) {
            nextAttributes.color_temp_kelvin = Number(data.color_temp_kelvin);
            nextAttributes.color_mode = "color_temp";
          }
          if (domain === "light" && Array.isArray(data?.rgb_color)) {
            const [r, g, b] = data.rgb_color.map(Number);
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
        if (domain === "alarm_control_panel" && service === "alarm_arm_away") nextState = "armed_away";
        if (domain === "alarm_control_panel" && service === "alarm_disarm") nextState = "disarmed";

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
      if (message.type === "persistent_notification/get") return demoNotifications as T;
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
