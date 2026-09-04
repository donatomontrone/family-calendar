import React from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "./App";
import type { Hass } from "./types";
import baseStyles from "./styles.css?inline";
import themeStyles from "./theme.css?inline";

const STYLE_ID = "family-calendar-panel-styles";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `${baseStyles}\n${themeStyles}`;
  document.head.appendChild(style);
}

class FamilyCalendarPanel extends HTMLElement {
  private root?: Root;
  private currentHass?: Hass;

  set hass(value: Hass) {
    this.currentHass = value;
    this.renderPanel();
  }

  connectedCallback() {
    ensureStyles();
    this.renderPanel();
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
  }

  private renderPanel() {
    if (!this.currentHass || !this.isConnected) return;
    ensureStyles();
    if (!this.root) this.root = createRoot(this);
    this.root.render(<App hass={this.currentHass} />);
  }
}

if (!customElements.get("family-calendar-panel")) {
  customElements.define("family-calendar-panel", FamilyCalendarPanel);
}
