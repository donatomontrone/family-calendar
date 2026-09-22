# UX Contract

## Scope

This contract protects Family Calendar behavior while the tablet/desktop presentation evolves. Visual ownership lives in `DESIGN.md`.

## Navigation

- Calendar and Home remain the two primary views.
- The fixed page switch stays reachable without covering page content.
- Changing responsive composition must not remove an action or state.

## Calendar

- Previous month, next month, and Today remain available.
- Multi-day events remain visible across their date range.
- Agenda remains visible on large screens.
- Todo and Shopping remain switchable.
- Tasks support add, complete/uncomplete, and delete.
- Smart Home remains available from Calendar.
- Room and Favorites selection remain available.
- Smart Home devices preserve activation, favorites, configurable-device controls, and turn-off-scope behavior.
- Light, cover, and climate controls continue to use the existing shared DeviceControls overlay where applicable.

## Home

- Every room remains selectable.
- All controllable room entities remain reachable.
- Lights preserve a separate power action.
- Selecting a light exposes brightness and white-temperature modes.
- Selecting a cover exposes position.
- Climate remains reachable from the room temperature action and global Climate utility.
- Passive sensors/status remain visible.
- Favorite toggling remains available in the large-screen room console.
- Room-off remains available.
- All utilities remain available: routines, batteries, sensors, climate, cameras, media, vacuum, car, covers.
- Alarm, whole-home status, climate summary, and waste remain visible.

## Responsive ownership

- Phone portrait and phone landscape are the established baseline and must not be changed by V60.
- V60 tablet/desktop markup is dedicated and must not structurally reuse legacy desktop/card classes.
- Page-level scrolling is not a normal tablet/desktop layout behavior.
- Internal scrolling is allowed only for collections that can exceed the allocated region.
- Each scrollable collection has one scroll owner.

## Geometry stability

- Hover, active, selected, disabled, loading, or pending state must not change a tile's allocated dimensions.
- Persistent header and page switch reserve their own layout space.
- Primary layout does not rely on negative margins, absolute positioning, or overlapping surfaces.

## Overlays

- Existing modal and overlay behavior remains unchanged unless explicitly requested.
- Large-screen overlays stay inside the visual viewport.
- Explicit close actions and background-dismiss behavior remain available where already supported.
- Focus visibility and accessible names are preserved.
