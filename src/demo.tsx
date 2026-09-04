import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { Area, EntityRegistryEntry, Hass, HassState } from "./types";
import "./styles.css";

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

const areas: Area[] = [
  { area_id: "soggiorno", name: "Soggiorno" },
  { area_id: "cucina", name: "Cucina" },
  { area_id: "camera", name: "Camera" },
];

const registry: EntityRegistryEntry[] = [
  { entity_id: "light.soggiorno", area_id: "soggiorno" },
  { entity_id: "cover.salotto", area_id: "soggiorno" },
  { entity_id: "climate.soggiorno", area_id: "soggiorno" },
  { entity_id: "switch.tv", area_id: "soggiorno" },
  { entity_id: "light.cucina", area_id: "cucina" },
  { entity_id: "switch.macchina_caffe", area_id: "cucina" },
  { entity_id: "light.camera", area_id: "camera" },
  { entity_id: "cover.camera", area_id: "camera" },
];

const initialStates: Record<string, HassState> = {
  "light.soggiorno": state("light.soggiorno", "on", "Luce soggiorno", { brightness: 196, demo_hex_color: "#ffd45a" }),
  "cover.salotto": state("cover.salotto", "open", "Tenda salotto", { current_position: 72 }),
  "climate.soggiorno": state("climate.soggiorno", "heat", "Clima soggiorno"),
  "switch.tv": state("switch.tv", "off", "TV"),
  "light.cucina": state("light.cucina", "off", "Luce cucina", { brightness: 150, demo_hex_color: "#ffe8bd" }),
  "switch.macchina_caffe": state("switch.macchina_caffe", "off", "Macchina caffè"),
  "light.camera": state("light.camera", "off", "Luce camera", { brightness: 110, demo_hex_color: "#ffb4a2" }),
  "cover.camera": state("cover.camera", "closed", "Tapparella camera", { current_position: 0 }),
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
          }
        }
        if (service === "turn_off") nextState = "off";

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
