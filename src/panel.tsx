import React from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "./App";
import type { Hass } from "./types";

class FamilyCalendarPanel extends HTMLElement {
  private root?: Root;
  private currentHass?: Hass;

  set hass(value: Hass) {
    this.currentHass = value;
    this.renderPanel();
  }

  connectedCallback() {
    this.renderPanel();
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
  }

  private renderPanel() {
    if (!this.currentHass || !this.isConnected) return;
    if (!this.root) this.root = createRoot(this);
    this.root.render(<App hass={this.currentHass} />);
  }
}

if (!customElements.get("family-calendar-panel")) {
  customElements.define("family-calendar-panel", FamilyCalendarPanel);
}
