# Changelog

All notable changes to Family Calendar are documented in this file.

The project follows Semantic Versioning.

## [1.0.0] - 2026-09-09

First stable UI baseline.

### Added

- full-screen Calendar page for Home Assistant;
- monthly calendar with multi-day event presentation;
- upcoming agenda panel;
- Todo and Shopping lists with add/complete flows;
- Apple-style swipe-to-delete interaction for list rows;
- internal list/device scrolling with hidden scrollbars;
- jump-to-bottom affordances for overflowing lists and device grids;
- Smart Home card with room navigation and favorites;
- whole-home and room-scoped Turn off all action;
- domain-aware device cards and status presentation;
- passive/informational entity handling for sensors, cameras and speakers;
- White Ambiance light controls for brightness and white temperature;
- cover position controls;
- climate controls for target temperature, HVAC mode, fan and presets;
- modal device-control panels;
- shared header with weather, alarm, notifications and theme control;
- automatic light/dark theme driven by Home Assistant `sun.sun`;
- manual theme override;
- Italian/English localization;
- standalone demo backed by simulated Home Assistant data;
- Home Assistant custom integration, config flow, Store persistence and custom WebSocket API;
- frontend build pipeline and compiled Home Assistant bundle;
- CI validation with frontend build, bundle verification, Hassfest and HACS.

### Changed

- completed the Calendar-page visual system and declared it stable for v1.0;
- standardized segmented controls and interaction feedback;
- adopted system typography with Apple-like hierarchy and spacing;
- normalized device-state colors for light and dark appearance;
- improved active/passive Smart Home semantics;
- reworked list composition to keep controls fixed while content scrolls internally;
- refined touch/mouse gesture handling and pointer capture behavior;
- consolidated responsive behavior for tablet and wall-display layouts.

### Notes

v1.0.0 is the first stable **UI** release. Real `calendar.*` and `todo.*` adapters, Google/Microsoft source integration and further HOME-page refinement remain future milestones documented in `ROADMAP.md`.
