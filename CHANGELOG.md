# Changelog

All notable changes to Family Calendar are documented in this file.

The project follows Semantic Versioning.

## [1.0.2] - 2026-09-09

Second iPhone polish patch for the stable Calendar page.

### Fixed

- prevented iOS Safari from zooming the LISTE text input by using a 16px focused input size on phone layouts;
- stabilized the Smart Home room rail so switching from Favorites to a room no longer shifts or clips the room buttons vertically;
- moved Alarm and Notifications dialogs to the document top layer through a React portal and centered them against the dynamic visual viewport;
- preserved light/dark modal appearance after portalling the shared header dialogs;
- repaired multi-day event continuity on iPhone by allowing event segments to overlap the calendar grid boundary instead of being clipped by each day cell.

### Notes

This patch remains scoped to Calendar-page phone behavior. Desktop and tablet layouts are unchanged from the established stable baseline.

## [1.0.1] - 2026-09-09

Phone-layout patch for the stable Calendar page.

### Fixed

- rebuilt the Calendar page composition for iPhone-sized viewports without changing the established desktop/tablet layout;
- removed the legacy 600px minimum width from the phone month view, so all seven days fit the viewport without horizontal calendar scrolling;
- changed the phone Calendar page from a clipped fixed-height wall-display canvas to a natural single-column vertical document with a hidden scrollbar;
- preserved stable fixed geometry for the Lists card while allowing only its task region to scroll internally;
- gave the Smart Home card a stable phone height with a two-column accessory grid and internal hidden scrolling when required;
- compacted the shared header for narrow screens while retaining weather, family avatars, alarm, notifications and manual theme switching;
- improved month toolbar, weekday, day-cell and event sizing for narrow displays;
- reserved iPhone safe areas for the notch, Dynamic Island and Home indicator;
- constrained device-control and header-action dialogs to the iPhone visual viewport;
- added standalone-demo viewport metadata for `viewport-fit=cover` and iOS standalone presentation.

### Notes

This patch intentionally changes only the Calendar-page phone presentation. Desktop and tablet layouts remain on the v1.0.0 visual baseline. The hosted GitHub Pages demo is deployed automatically from `master`.

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
