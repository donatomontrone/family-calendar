# Family Calendar

Family Calendar is a dedicated Home Assistant panel designed for family wall displays, tablets and always-on screens. It combines calendar, agenda, Todo/shopping lists and quick smart-home controls in a single full-screen interface that is separate from standard Lovelace dashboards.

Current release: **v1.0.3** — stable Calendar UI baseline with dedicated iPhone layout and continuous multi-day rendering.

> v1.0.3 keeps the established desktop/tablet design unchanged and refines the phone-specific Calendar composition, including a reorganized iPhone header and measured continuous multi-day event bars. Real `calendar.*` and `todo.*` data adapters are still part of the next integration milestones; the standalone demo continues to use simulated data for those sections.

## Italiano

### Cosa include la 1.0

- calendario mensile full-screen con eventi multi-day;
- layout dedicato per iPhone con calendario a 7 colonne senza scroll orizzontale;
- rispetto delle safe area iOS per notch, Dynamic Island e Home indicator;
- agenda dei prossimi giorni;
- card LISTE con Todo e Spesa, aggiunta elementi, completamento e swipe-to-delete;
- scrolling interno con scrollbar nascosta e scorciatoia per raggiungere il fondo;
- card CASA INTELLIGENTE con stanze, preferiti e controlli rapidi;
- dispositivi passivi mostrati come informazioni, senza falso stato acceso/spento;
- luci White Ambiance con luminosità e temperatura del bianco;
- tapparelle con posizione;
- clima con temperatura, modalità HVAC, ventola e preset;
- popup dedicati per i controlli dispositivo;
- azione “Spegni tutto” per casa o stanza;
- tema chiaro/scuro automatico tramite `sun.sun`, con override manuale;
- header condiviso con meteo, allarme, notifiche e switch tema;
- stile e tipografia ispirati ai pattern Apple, con font di sistema e controlli coerenti;
- interazioni touch/mouse per segmented controls, stanze e liste;
- localizzazione Italiano/Inglese;
- demo standalone utilizzabile senza Home Assistant;
- CI con build frontend, verifica bundle Home Assistant, Hassfest e HACS.

### Demo standalone

Demo pubblica:

https://donatomontrone.github.io/family-calendar/

Requisiti per lo sviluppo locale:

- Node.js 24
- npm

Dalla root del repository:

```bash
npm ci
npm run dev
```

Apri l'indirizzo mostrato da Vite, normalmente `http://localhost:5173`.

La demo usa dati Home Assistant simulati e forza `it-IT` per rendere riproducibile il layout italiano durante lo sviluppo.

### Home Assistant

La custom integration vive in:

```text
custom_components/family_calendar/
```

La build frontend genera e copia automaticamente il bundle in:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

Build completa:

```bash
npm run build
```

L'integrazione espone un pannello custom full-screen, persistenza preferiti tramite Home Assistant Store e WebSocket API dedicata.

### Stato dei dati reali

La release 1.0 definisce la baseline stabile dell'interfaccia. I seguenti collegamenti backend restano volutamente separati dalla chiusura visuale della pagina Calendario:

- eventi reali da `calendar.*`;
- Todo/Shopping reali da `todo.*`;
- selezione sorgenti Google Calendar tramite Home Assistant;
- adapter Microsoft 365 / Outlook;
- ulteriori rifiniture e funzionalità della pagina CASA.

Le prossime modifiche UI saranno concentrate sulla pagina **CASA**, salvo indicazioni diverse.

### Architettura

```text
src/
  App.tsx                  shell principale e pagina Calendario
  HomeView.tsx             pagina Casa
  SharedHeader.tsx         header condiviso
  SwipeTaskRow.tsx         gesture swipe delle liste
  ScrollRegion.tsx         regioni scrollabili + jump-to-bottom
  ClimateControl.tsx       controlli clima
  demo.tsx                 adapter standalone / mock Home Assistant
  panel.tsx                custom element Home Assistant
  ha.ts                     adapter API Home Assistant
  i18n.ts                  localizzazione
  light-temperature.ts     gestione White Ambiance
  *.css                    design system e layer visuali

custom_components/family_calendar/
  __init__.py              setup integrazione e pannello
  config_flow.py           configurazione Home Assistant
  storage.py               persistenza preferiti
  websocket.py             API WebSocket custom
  frontend/                bundle compilato
```

La UI riceve un oggetto `hass` e non contiene autenticazione provider. Google/Microsoft e le altre sorgenti esterne devono essere esposte tramite Home Assistant o adapter backend dell'integrazione.

### Documentazione

- [`ROADMAP.md`](ROADMAP.md) — roadmap e stato dei milestone
- [`CHANGELOG.md`](CHANGELOG.md) — cronologia release
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — sviluppo, build e CI
- [`docs/I18N.md`](docs/I18N.md) — localizzazione

---

## English

### What v1.0 includes

- full-screen monthly calendar with multi-day events;
- dedicated iPhone layout with a seven-column month view and no horizontal calendar scrolling;
- iOS safe-area support for the notch, Dynamic Island and Home indicator;
- upcoming agenda;
- Todo/Shopping LISTS card with add, complete and swipe-to-delete interactions;
- internal scrolling with hidden scrollbars and jump-to-bottom affordances;
- SMART HOME card with rooms, favorites and quick controls;
- passive/informational entities without misleading on/off states;
- White Ambiance lights with brightness and white-temperature controls;
- covers with position control;
- climate temperature, HVAC mode, fan mode and presets;
- dedicated device-control dialogs;
- whole-home or room-scoped “Turn off all” action;
- automatic light/dark appearance driven by `sun.sun`, plus manual override;
- shared header with weather, alarm, notifications and theme switch;
- Apple-inspired system typography and control language;
- touch/mouse interactions for segmented controls, room rails and lists;
- Italian/English localization;
- standalone demo without Home Assistant;
- CI for frontend build, Home Assistant bundle verification, Hassfest and HACS.

### Standalone demo

Public demo:

https://donatomontrone.github.io/family-calendar/

Local development requirements:

- Node.js 24
- npm

From the repository root:

```bash
npm ci
npm run dev
```

Then open the address printed by Vite, normally `http://localhost:5173`.

The demo uses simulated Home Assistant data and intentionally forces `it-IT` so the Italian layout remains deterministic during development.

### Home Assistant

The custom integration lives in:

```text
custom_components/family_calendar/
```

The frontend build automatically creates and copies the bundle to:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

Full build:

```bash
npm run build
```

The integration provides a full-screen custom panel, Home Assistant Store persistence for favorites, and a dedicated WebSocket API.

### Real-data status

v1.0 is the stable visual baseline. The following backend integrations remain separate milestones:

- real events from `calendar.*`;
- real Todo/Shopping data from `todo.*`;
- Google Calendar source selection through Home Assistant;
- Microsoft 365 / Outlook adapter;
- further refinement and features for the HOME page.

Unless explicitly requested otherwise, the next UI changes will focus on the **HOME** page.

### Architecture

```text
src/
  App.tsx                  main shell and Calendar page
  HomeView.tsx             Home page
  SharedHeader.tsx         shared header
  SwipeTaskRow.tsx         list swipe gesture
  ScrollRegion.tsx         scrollable regions + jump-to-bottom
  ClimateControl.tsx       climate controls
  demo.tsx                 standalone / mock Home Assistant adapter
  panel.tsx                Home Assistant custom element
  ha.ts                     Home Assistant API adapter
  i18n.ts                  localization
  light-temperature.ts     White Ambiance handling
  *.css                    design system and visual layers

custom_components/family_calendar/
  __init__.py              integration and panel setup
  config_flow.py           Home Assistant configuration
  storage.py               favorites persistence
  websocket.py             custom WebSocket API
  frontend/                compiled bundle
```

The UI receives a `hass` object and contains no provider authentication. Google/Microsoft and other external sources should be exposed through Home Assistant or backend adapters in the integration.

### Documentation

- [`ROADMAP.md`](ROADMAP.md) — milestones and status
- [`CHANGELOG.md`](CHANGELOG.md) — release history
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — development, build and CI
- [`docs/I18N.md`](docs/I18N.md) — localization
