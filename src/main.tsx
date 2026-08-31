import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import type { Hass } from "./types";

// Oggetto Hass finto con entità di prova
const mockHass: Partial<Hass> = {
  states: {
    "light.salotto": {
      entity_id: "light.salotto",
      state: "on",
      attributes: { friendly_name: "Luce Salotto" },
      last_changed: "",
      last_updated: "",
      context: { id: "", parent_id: null, user_id: null }
    },
    "switch.presa_tv": {
      entity_id: "switch.presa_tv",
      state: "off",
      attributes: { friendly_name: "Presa TV" },
      last_changed: "",
      last_updated: "",
      context: { id: "", parent_id: null, user_id: null }
    }
  },
  // Mock per le funzioni o WebSocket
  callService: async (domain, service, target) => {
    console.log(`[Mock Call] ${domain}.${service}`, target);
  }
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App hass={mockHass as Hass} />
  </React.StrictMode>
);
