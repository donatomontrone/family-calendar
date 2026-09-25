# UX Contract

Release baseline: **v2.0.0**.

## Scope

This contract protects Family Calendar behavior while implementation details evolve. Visual ownership is defined in `DESIGN.md`.

## Navigation

- CALENDARIO and CASA remain the two primary views.
- The fixed page switch must stay reachable without covering interactive content.
- At a given viewport, its geometry must be identical on both pages.
- Responsive composition must never remove an action or state merely to make the layout fit.

## Shared chrome

- SharedHeader remains structurally shared.
- CALENDARIO and CASA use the same canvas/background contract.
- Light and dark themes keep identical geometry.
- Bottom safe-area and page-switch spacing are shared.
- Hover/press feedback must not move the page switch.

## CALENDARIO

- Previous month, next month and Today remain available.
- Multi-day events remain continuous across their date range.
- Todo and Shopping remain switchable.
- Tasks support add, complete/uncomplete and delete.
- Smart Home remains reachable.
- Room and Favorites selection remain available.
- Configurable device controls preserve their shared overlays/actions.
- Page-level scroll is allowed only where the selected responsive composition explicitly uses a vertical document; otherwise scrolling belongs to bounded collections.

## CASA

- Every room remains reachable.
- All controllable room entities remain reachable.
- Passive sensors/status remain visible as information.
- Lights retain power plus brightness/white-temperature modes.
- Covers retain position control.
- Climate remains reachable from room and global affordances.
- Room-off and whole-home actions remain available.
- Utilities remain available: routines, batteries, sensors, climate, cameras, media, vacuum, car and covers.
- Open space remains usable even when its device collection exceeds the visible width/height.

## Icon customization

- Both room icons and entity icons are editable.
- A room override target is `area:<area_id>`; an entity override target is its `entity_id`.
- Overrides persist in Home Assistant and survive frontend reloads.
- The demo preserves equivalent behavior through its demo storage adapter.
- The picker exposes global search and does not require a category filter.
- Saving/resetting icons must not alter unrelated Home Assistant state.

## Responsive ownership

- HOME non-phone geometry is owned by V70.
- Shared header geometry is owned by V71.
- CALENDAR non-phone geometry is owned by V74.
- Shared page chrome is owned by V77.
- Standalone-demo CALENDAR/HOME parity is finally owned by V79.
- Historical V60/V63/etc. layers are not allowed to reassert final geometry.
- Each scrollable collection has one scroll owner.

## Geometry stability

- Hover, active, selected, disabled, loading and pending states must not change allocated dimensions.
- Persistent header and page switch reserve their own space.
- Primary layout must not rely on overlapping positioned surfaces as a normal composition technique.
- Same viewport + same theme must produce the same page canvas in CALENDARIO and CASA.

## Overlays and accessibility

- Modal/overlay close actions and background-dismiss behavior remain available where implemented.
- Overlays must remain inside the visual viewport.
- Focus visibility is preserved.
- Icon-only controls require accessible labels.
- Pointer gestures must not break vertical scrolling or keyboard access.
