---
version: v79
release: v2.0.0
colors:
  canvas-light: "#EEF0F4"
  surface-light: "#FFFFFF"
  label-light: "#1D1D1F"
  secondary-light: "#6E6E73"
  canvas-dark: "#16171B"
  surface-dark: "#26262A"
  label-dark: "#F5F5F7"
  secondary-dark: "#AEAEB2"
  accent-blue: "#0A84FF"
  success: "#34C759"
  warning: "#FF9F0A"
  danger: "#FF453A"
rounded:
  surface: "22-24px"
  tile: "13-14px"
  control: "11-12px"
  page-switch: "15px"
---

# Design Contract

## Baseline

Release **v2.0.0** is the current main visual baseline.

Family Calendar uses one Apple/Home-inspired visual language across CALENDARIO and CASA: system typography, restrained neutral materials, room/device accents, compact controls and explicit active states.

The approved phone interaction language remains the reference. Larger layouts reveal more information without turning the product into an enterprise dashboard.

## Responsive ownership

Current final authorities:

- CASA non-phone: `home-unified-v70.css`;
- shared header: `shared-layout-v71.css`;
- CALENDARIO non-phone: `calendar-phone-first-v74.css`;
- shared canvas/page switch material: `shared-page-chrome-v77.css`;
- standalone-demo final page parity: `demo-page-parity-v79.css`;
- demo classification: `demo-responsive-system.ts`.

Historical CSS may remain for compatibility but must not override these contracts.

Phone portrait and phone landscape remain first-class layouts. Tablet/iPad, desktop, wide and ultra-wide compositions must be derived intentionally rather than by shrinking or stretching one desktop grid.

## Page parity

At the same viewport and theme, CALENDARIO and CASA must have:

- identical page background and gradients;
- identical shared-header geometry/material;
- identical page-switch position, size, inset, typography and thumb motion;
- identical bottom safe-area rhythm;
- identical day/night canvas behavior.

The demo paints the canvas relative to the viewport, not document height, so switching pages cannot shift gradients.

## CALENDARIO

V74 is the current non-phone visual authority. Preserve:

- monthly seven-column calendar;
- multi-day event continuity;
- Agenda where the responsive composition permits it;
- Todo/Shopping segmented control;
- task add/complete/delete;
- Smart Home room/favorites access;
- device controls and whole-home power action;
- internal-scroll ownership where collections overflow.

## CASA

V70 is the current non-phone visual authority. Preserve:

- room selection and room-specific accents;
- dedicated Open space treatment;
- controllable and passive device separation;
- brightness/white-temperature/cover/climate controls;
- house status, climate, alarm, waste and utilities;
- sensor/status readability;
- room-level and whole-home actions;
- natural scrolling for collections without overlapping the page switch.

## Icon system

The v2.0 icon system is part of the product language.

- room and entity icons are both customizable;
- overrides must render consistently in CASA and CALENDARIO;
- catalog keys must be unique;
- categories organize the catalog but the picker remains globally searchable;
- Apple-style silhouettes are project-original line glyphs;
- icon selection must not introduce remote runtime dependencies;
- icon changes must not change tile geometry.

## Typography and material

Use the system font stack. Do not add webfont dependencies.

Use blur only for genuine floating chrome such as the page switch and modal surfaces. Large content surfaces should remain readable and stable rather than excessively glassy.

No normal UI state may change allocated component dimensions.

## Interaction

Hover is enhancement only; touch is primary-capable.

Visible focus is mandatory. Icon-only controls require accessible names.

Motion is restrained: color, shadow, opacity and small transform transitions only. The fixed page switch must never move on hover/press.

## Anti-patterns

Do not:

- create generic admin sidebars;
- use equal-card bento layouts as a default;
- introduce arbitrary negative margins to repair breakpoints;
- overlap content and fixed navigation;
- hide functionality solely to make a layout fit;
- import a third-party icon family at runtime;
- reintroduce page-specific background/switch geometry;
- let legacy responsive layers override V70/V74/V79.
