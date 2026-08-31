import React from "react";import{createRoot,type Root}from"react-dom/client";import App from "./App";import type{Hass}from"./types";
class FamilyCalendarPanel extends HTMLElement{private root?:Root;private _hass?:Hass;set hass(v:Hass){this._hass=v;this.render()}connectedCallback(){this.render()}disconnectedCallback(){this.root?.unmount()}private render(){if(!this._hass)return;if(!this.root)this.root=createRoot(this);this.root.render(React.createElement(App,{hass:this._hass}))}}
customElements.define("family-calendar-panel",FamilyCalendarPanel);
