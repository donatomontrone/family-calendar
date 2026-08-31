import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { Hass, HassState, Area, EntityRegistryEntry } from "./types";

const state = (
  entityId: string,
  value: string,
  name: string,
): HassState => ({
  entity_id: entityId,
  state: value,
  attributes: {
    friendly_name: name,
  },
  last_changed: new Date().toISOString(),
  last_updated: new Date().toISOString(),
});

const states: Record<string, HassState> = {
  "light.soggiorno": state(
    "light.soggiorno",
    "on",
    "Luce soggiorno",
  ),

  "light.cucina": state(
    "light.cucina",
    "off",
    "Luce cucina",
  ),

  "cover.salotto": state(
    "cover.salotto",
    "open",
    "Tenda salotto",
  ),

  "climate.soggiorno": state(
    "climate.soggiorno",
    "heat",
    "Clima",
  ),

  "switch.tv": state(
    "switch.tv",
    "off",
    "TV",
  ),

  "light.camera": state(
    "light.camera",
    "off",
    "Luce camera",
  ),
};

const areas: Area[] = [
  {
    area_id: "soggiorno",
    name: "Soggiorno",
  },
  {
    area_id: "cucina",
    name: "Cucina",
  },
  {
    area_id: "camera",
    name: "Camera",
  },
];

const entityRegistry: EntityRegistryEntry[] = [
  {
    entity_id: "light.soggiorno",
    area_id: "soggiorno",
  },
  {
    entity_id: "light.cucina",
    area_id: "cucina",
  },
  {
    entity_id: "cover.salotto",
    area_id: "soggiorno",
  },
  {
    entity_id: "climate.soggiorno",
    area_id: "soggiorno",
  },
  {
    entity_id: "switch.tv",
    area_id: "soggiorno",
  },
  {
    entity_id: "light.camera",
    area_id: "camera",
  },
];

const hass: Hass = {
  states,

  callService: async (
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ) => {
    console.log("Demo service:", {
      domain,
      service,
      data,
    });
  },

  callWS: async <T,>(
    message: Record<string, unknown>,
  ): Promise<T> => {
    switch (message.type) {
      case "config/area_registry/list":
        return areas as T;

      case "config/entity_registry/list":
        return entityRegistry as T;

      case "family_calendar/favorites/get":
        return {
          entity_ids: [
            "light.soggiorno",
            "cover.salotto",
            "switch.tv",
          ],
        } as T;

      default:
        return {
          entity_ids: message.entity_ids ?? [],
        } as T;
    }
  },
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App hass={hass} />
  </React.StrictMode>,
);