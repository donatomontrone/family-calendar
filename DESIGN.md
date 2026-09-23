---
version: v60
colors:
  canvas-light: "#F1F2F4"
  surface-light: "#FFFFFF"
  label-light: "#1D1D1F"
  secondary-light: "#6E6E73"
  canvas-dark: "#17171B"
  surface-dark: "#2B2B2F"
  label-dark: "#F5F5F7"
  secondary-dark: "#B2B2B8"
  accent-blue: "#0A84FF"
  success: "#34C759"
  warning: "#FF9F0A"
  danger: "#FF453A"
rounded:
  surface: "24px"
  tile: "14px"
  control: "11px"
  pill: "999px"
---

## Overview

Family Calendar is a shared Home Assistant family dashboard. The approved phone UI is the visual reference: calm Apple/Home-inspired system typography, cool neutral surfaces, compact rounded controls, room-specific accents, and clear selected/active states.

The Calendar page keeps the approved 24ec8046 layout at every non-phone size. Only the Home page uses a dedicated tablet/desktop composition, preserving the phone's interaction language while revealing more information at once.

Design variance: 6/10. Motion: 2/10. Information density: 8/10.

## North Star

The large-screen product should feel like an Apple Home / family control board designed specifically for iPad, wall displays, and desktop rather than a responsive web dashboard.

The signature is continuity: large surfaces, restrained separators, accessory tiles that look and behave like the phone, and a clear hierarchy that can be scanned from a distance.

Anti-references:
- generic enterprise/admin sidebars;
- equal-card bento mosaics;
- oversized SaaS spacing;
- decorative glass on every surface;
- microcopy below 9px;
- layout built from negative margins or overlapping positioned panels;
- page-level scrolling as a normal layout mechanism.

## Layout

Phone portrait and phone landscape remain owned by the existing baseline and must not be changed by large-screen work.

Calendar:
- the exact React source, component anatomy and visual language from commit `24ec8046` remain canonical;
- phone and desktop presentation remain on that baseline unless explicitly requested otherwise;
- tablet geometry in the public demo is intentionally owned by `demo-calendar-tablet-layout-v63.css`: it may change only macro placement, bounded heights and overflow ownership; it must not redefine typography, colors, radii, shadows, card styling, button styling, component anatomy, controls or interaction behavior;
- compact portrait tablets may use a short document scroll to preserve readability; regular portrait and landscape tablets stay viewport-bound with internal scrolling only for Agenda, Lists and device collections.

Home V60 activates only for tablet/desktop-class viewports. It owns dedicated React markup in `HomeView.tsx` and the final CSS layer `large-screen-v60.css`.

Home:
- one horizontal room strip;
- one room console for accessories, selected quick controls, and room status;
- one Home sidecar for house state, climate, alarm, and waste;
- one full-width tool dock with all Home utilities;
- tablet portrait moves the sidecar below the room console while preserving every tool/action.

Large screens use the available width and height. Normal supported tablet/desktop viewports do not page-scroll. Internal scrolling is permitted only for unbounded collections such as many rooms, tasks, devices, sensors, or agenda items.

## Typography

Use the existing Apple-oriented system font stack. Do not add webfont dependencies.

Large-screen text must remain readable at wall-display distance:
- page/month/room titles: 18–34px depending on hierarchy;
- ordinary accessory labels: 10–13px;
- secondary labels: 9–11px;
- no V60 UI text below 9px.

Numeric values use tabular figures where alignment matters.

## Material & Elevation

Major surfaces use subtle neutral elevation with an inner highlight and low-contrast ambient shadow. Large scrolling surfaces do not use backdrop blur.

Blur is reserved for the fixed page switch island and modal/overlay chrome.

Use elevation only for genuine hierarchy. Within a major surface, prefer hairline separators and spacing rather than nested card containers.

## Shapes

Major surfaces: 24px.
Interactive accessory/tool tiles: 14px.
Compact controls: 11px.
Pill geometry only for semantic pills/segmented controls.

Selected, hover, active, disabled, and loading states must not change component dimensions or grid placement.

## Components

Shared header keeps greeting, clock, weather, family presence where space permits, alarm, notifications, and theme.

Calendar keeps month navigation, multi-day events, Agenda, Todo/Shopping, task creation/toggle/delete, Smart Home room/favorites selection, device actions, power actions, favorites, and device controls.

Home keeps room selection, lights/switches/covers/media/fans/locks/vacuum controls, separate light power action, brightness and white-temperature control, cover position control, room climate access, passive sensor/status data, favorites, room off, alarm, climate, waste, routines, batteries, sensors, cameras, media, vacuum, car, covers, and all existing overlays.

## Interaction

Hover is enhancement only. Touch and keyboard access remain equivalent.

Visible focus is mandatory. Icon-only controls require accessible names.

Motion is restrained and limited to color, shadow, opacity, and transform transitions. No layout-moving hover.

## Do / Don't

Do preserve the approved phone layout unchanged.
Do preserve Calendar component anatomy and visual styling from the 24ec8046 baseline; use V63 only for tablet geometry.
Do use dedicated V60 classes/markup for Home tablet and desktop.
Do make the selected room the visual primary surface.
Do show more information simultaneously on larger screens.
Do keep scroll ownership explicit.
Do keep light/dark mode structurally identical.

Don't reuse legacy `.card` or `.desktop-room-*` classes as V60 structural owners.
Don't hide functionality to make the layout fit.
Don't introduce a third-party design system or icon family.
Don't shrink text below the readability floor to avoid overflow.
Don't use page-level scroll for normal large-screen layouts.
