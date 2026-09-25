# Changelog

All notable changes to Family Calendar are documented in this file.

The project follows Semantic Versioning.

## [2.0.0] - 2026-09-25

Major UI consolidation release.

### Added

- persistent icon customization for Home Assistant entities and rooms, stored through the Family Calendar Home Assistant Store and dedicated WebSocket commands;
- room-level icon overrides alongside device-level overrides, shared consistently across CASA and CALENDARIO;
- a catalog of 553 unique icon keys covering lighting, home controls, climate, security, media, appliances, energy, outdoor devices and a dedicated Apple hardware category;
- original Apple-style line silhouettes for Apple TV, HomePod, iPhone, iPad, Mac, displays, Apple Watch, AirPods, AirTag, MagSafe, Apple Pencil, Magic accessories, AirDrop and CarPlay;
- a global icon search experience with all icons visible in one continuous catalog and recent selections retained in the picker.

### Changed

- rebuilt non-phone CALENDARIO from the approved phone interaction language and consolidated its responsive behavior in the V74 phone-first contract;
- kept CASA on the isolated V70 large-screen component system while preserving the established phone layouts;
- unified the shared header, page canvas, bottom page switch, light/dark material and responsive chrome between CALENDARIO and CASA;
- made standalone-demo backgrounds viewport-relative so gradients are identical between pages regardless of document/content height;
- made the CALENDARIO/CASA segmented switch use the same geometry equation, inset, width, motion and active-thumb positioning at every supported breakpoint;
- removed the icon-category filter UI in favor of one searchable catalog, while keeping category grouping as visual organization;
- aligned project, integration and npm metadata on the same semantic version.

### Fixed

- removed residual page-to-page background and gradient drift between CALENDARIO and CASA;
- removed the remaining one-pixel segmented-control thumb mismatch on responsive layouts;
- prevented hover/active transforms from changing the fixed page-switch geometry;
- fixed duplicate icon keys and an invalid semantic icon alias found during catalog validation;
- added release-time version consistency checks so manifest, npm package metadata, lockfile and primary documentation cannot silently diverge again.

### Release status

**v2.0.0 is the new main visual/UI baseline for Family Calendar.**

CALENDARIO and CASA now share one coherent responsive chrome from phone through tablet, desktop, wide and ultra-wide layouts. Future visual changes should preserve the V70/V74/V79 contracts unless a redesign is explicitly requested.

This major-version designation represents a consolidated UI contract and release process. It does not claim completion of the planned real `calendar.*`, `todo.*`, Google Calendar or Microsoft 365 data adapters.

## [1.2.0] - 2026-09-25

CASA UI stabilization milestone.

### Changed

- rebuilt the non-phone CASA page on the isolated V70 component system, removing the visual dependency on the legacy V60/V67/V69 workspace cascade;
- adopted the approved phone CASA interaction language as the reference design for tablet, iPad, laptop, desktop, wide and ultra-wide layouts while preserving the phone presentation unchanged;
- introduced responsive room composition with compact tablet layouts, featured-room treatment for Open space, multi-column desktop grids and full-height large-screen utilization;
- made Open space a deliberate featured room: full-row natural-height composition on two-column layouts and a two-column horizontal device strip on three/four-column layouts;
- added real Open space device-strip navigation with touch/trackpad scrolling, mouse-wheel horizontal scrolling, visible previous/next controls, scroll snapping and end-of-strip reach;
- changed large-screen Sensors & status from a horizontal carousel to a wrapping multiline grid that uses available vertical space;
- redesigned the CASA status dashboard, climate summary and tool actions for denser portrait presentation without empty grid cells or oversized utility tiles;
- unified CALENDARIO and CASA on the same final SharedHeader geometry for every non-phone breakpoint.

### Fixed

- removed overlapping and conflicting room-card geometries produced by legacy responsive layers;
- eliminated fixed-height behavior for Open space on two-column layouts so its devices can expand naturally over multiple rows;
- ensured odd final room cards can use the complete two-column row where appropriate;
- normalized tool-button icon rendering and removed the nested icon borders/backgrounds that reduced legibility;
- prevented large-screen room grids and the right-side status column from leaving unused viewport space;
- ensured the final Open space device can scroll completely into view;
- restored deterministic wrapping and sizing for room sensors, device strips and featured-room content.

### UI status

**The CASA page visual presentation and UI are considered temporarily finalized and frozen as of this release.** Further CASA visual changes should be limited to regressions or functional defects unless the visual scope is explicitly reopened.

The current phone-first visual language, V70 room components, shared header, responsive room-grid behavior, Open space treatment, status dashboard, tool actions, scrolling rules and large-screen composition therefore define the reference CASA UI baseline for subsequent development.

## [1.1.0] - 2026-09-24

Calendar UI stabilization milestone.

### Changed

- completed the responsive visual definition of the CALENDARIO page across desktop, wide displays, iPad Pro, iPad mini, portrait, landscape and phone layouts;
- normalized the CALENDARIO horizontal composition so card-to-card and viewport-edge spacing follow deliberate, repeatable layout contracts;
- refined iPad mini and iPad 13-inch landscape action controls, including Calendar navigation, LISTE add/remove and CASA whole-home power controls;
- restored compact presence avatars in the iPad mini landscape header;
- introduced a final shared visual-polish layer for the application canvas, surface elevation and light/dark shadows;
- introduced a universal bottom-rail contract so content, page dock and viewport edge close on one consistent visual baseline;
- compacted Calendar event chips and synchronized multi-day bridge geometry so event height remains stable across responsive layouts.

### Fixed

- removed residual layout wrappers and breakpoint-specific offsets that made the CALENDARIO-to-CASA gap appear larger than the LISTE-to-CALENDARIO gap;
- removed competing bottom reserves that previously produced uneven empty space below cards and around the page dock;
- fixed inherited control sizing rules that could deform the LISTE `+` button or restore oversized Calendar actions on iPad layouts;
- prevented older responsive rules from re-expanding Calendar events after subsequent UI refinements.

### UI status

**The CALENDARIO page visual presentation and UI are considered temporarily finalized and frozen as of this release.** Further CALENDARIO visual changes should be limited to regressions or functional defects unless the visual scope is explicitly reopened.

The current responsive composition, spacing system, header treatment, card hierarchy, event presentation, page dock and bottom rhythm therefore define the reference CALENDARIO UI baseline for subsequent development.

## [1.0.5] - 2026-09-11

HOME room-card active accent fix.

### Fixed

- room cards on the CASA page now become tinted only when a device inside that room is actually active;
- the tint is applied to the upper band of the room card itself instead of to the nested device card;
- the active room colour is derived at runtime from the active device: light colour-temperature accent for lights, blue for covers/media, green for switches/locks, purple for fans/vacuums, and orange for climate;
- when multiple devices are active, the selected active control is preferred, then an active light, then the first active control;
- room cards return to the neutral Liquid Glass surface when no device in the room is active;
- removed the previous fixed `nth-child` room palette, which coloured rooms independently of device state and did not implement the requested behaviour.

### Notes

This patch adds a dedicated runtime room-accent synchronizer and ships the resulting compiled Home Assistant frontend bundle.

## [1.0.4] - 2026-09-11

HOME room-card refinement and frontend delivery fix.

### Added

- compact per-room climate status in the lower status area when climate is enabled, including the configured target temperature or target range;
- stable per-room accent colours for HOME room cards, limited to the upper portion of each room card;
- shared room accent styling for active controls so an enabled device uses the same colour family as its containing room.

### Changed

- removed climate entities from the room Controls grid and kept room temperature as the dedicated room-level climate affordance;
- removed duplicate room-temperature sensor rows from Sensors & status;
- expanded Sensors & status to use the available lower-card width more effectively;
- normalized brightness, white-temperature and cover-position control geometry so switching controls does not resize the slider area;
- Home Assistant frontend builds are now committed to `custom_components/family_calendar/frontend/family-calendar-panel.js` on `master` instead of being discarded after CI.

### Fixed

- fixed the distribution path that previously allowed source changes to pass CI without updating the JavaScript bundle actually served by Home Assistant;
- release validation now rebuilds the frontend and refuses to publish when the committed Home Assistant bundle is stale.

### Notes

This release contains the compiled Home Assistant frontend bundle. HACS installations updating to 1.0.4 therefore receive the HOME UI changes instead of remaining on the older 1.0.3 runtime bundle.

## [1.0.3] - 2026-09-09

Third iPhone polish patch for the stable Calendar page.

### Fixed

- replaced the remaining per-day CSS stitching for multi-day calendar events with measured weekly overlay bars that span the exact pixel distance from the first to the last day, eliminating seams caused by cell padding and grid boundaries;
- kept one visible event label while preserving the correct visual break only when an event crosses from Sunday to Monday into a new calendar row;
- recalculated continuous event bars after responsive and visual-viewport size changes so they remain aligned on iPhone rotation and dynamic viewport changes;
- redesigned the Calendar-page iPhone header into three deliberate rows: greeting and family avatars, clock and weather, then alarm with notification and theme actions;
- removed the crowded horizontal phone action rail while retaining the existing desktop and tablet header layout.

### Notes

This patch remains scoped to the Calendar-page iPhone presentation and multi-day event rendering. Desktop and tablet geometry remain unchanged.

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
