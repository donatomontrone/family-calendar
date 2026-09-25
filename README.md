# Family Calendar

Family Calendar is a dedicated Home Assistant panel for family wall displays, iPad/tablet installations and always-on screens. It combines CALENDARIO, Agenda, Todo/Shopping lists and quick smart-home controls in a full-screen interface separate from normal Lovelace dashboards.

Current release: **v2.0.0** — main UI consolidation release.

> v2.0.0 defines the current visual baseline for both CALENDARIO and CASA. The two pages now share the same responsive chrome, background system, header and page switch from phone through ultra-wide layouts. The release also introduces persistent room/device icon customization with a 553-icon catalog, including a dedicated Apple-style hardware family.

## Italiano

### Cosa include la 2.0

- calendario mensile full-screen con eventi multi-day;
- layout responsive dedicati da telefono a tablet/iPad, desktop, wide e ultra-wide;
- agenda dei prossimi giorni;
- card LISTE con Todo e Spesa, aggiunta, completamento e swipe-to-delete;
- card CASA INTELLIGENTE con stanze, preferiti e controlli rapidi;
- pagina CASA completa con stanze, stato casa, clima, sensori, utility e controlli dispositivo;
- luci con on/off, luminosità e temperatura del bianco;
- cover/tapparelle con posizione;
- clima con target, modalità HVAC, ventola e preset;
- entità passive rese come informazioni e non come falsi interruttori;
- azioni Spegni tutto per casa e stanza;
- tema chiaro/scuro automatico tramite `sun.sun`, con override manuale;
- header condiviso e identico tra CALENDARIO e CASA;
- switch CALENDARIO/CASA con geometria identica su tutti i breakpoint;
- sfondo e sfumature condivisi tra le due pagine;
- personalizzazione persistente delle icone di **dispositivi e stanze**;
- **553 icone uniche**, incluse numerose varianti smart-home e una categoria Apple dedicata;
- ricerca globale delle icone senza filtro di categoria obbligatorio;
- localizzazione Italiano/Inglese;
- demo standalone con dati Home Assistant simulati;
- CI con type-check/build, bundle Home Assistant, Hassfest, HACS e release automatica.

### Personalizzazione icone

L'editor icone consente di cambiare sia l'icona delle stanze sia quella delle entità. In Home Assistant gli override sono persistiti tramite Home Assistant Store e WebSocket; nella demo standalone vengono gestiti dal relativo adapter demo.

Il catalogo include illuminazione, BTicino/switch/relay, cover, clima, sicurezza, audio/video, elettrodomestici, energia, esterno e dispositivi Apple-style.

### Demo standalone

Demo pubblica:

https://donatomontrone.github.io/family-calendar/

Sviluppo locale:

```bash
npm ci
npm run dev
```

La demo usa lo stesso `App.tsx` del pannello Home Assistant con un adapter `Hass` simulato e forza `it-IT` per rendere riproducibile il layout italiano.

### Home Assistant

La custom integration vive in:

```text
custom_components/family_calendar/
```

Build completa:

```bash
npm run build
```

Il bundle distribuito da HACS è:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

La versione canonica dell'integrazione è in `custom_components/family_calendar/manifest.json`; `package.json` e `package-lock.json` devono riportare la stessa versione.

### Stato dei dati reali

v2.0.0 consolida la UI e il relativo contratto responsive. Restano milestone separate:

- eventi reali da `calendar.*`;
- Todo/Shopping reali da `todo.*`;
- selezione sorgenti Google Calendar tramite Home Assistant;
- adapter Microsoft 365 / Outlook;
- ulteriori funzionalità avanzate per media, scene/script e configurazione.

### Architettura

```text
src/
  App.tsx                         shell e pagina CALENDARIO
  HomeView.tsx                    pagina CASA + editor icone
  SharedHeader.tsx                header condiviso
  entity-icon-customization.tsx   catalogo e rendering override icone
  demo-responsive-system.ts       classificazione responsive demo
  demo-page-parity-v79.css        parità finale CALENDARIO/CASA nella demo
  calendar-phone-first-v74.css    autorità CALENDARIO non-phone
  home-unified-v70.css            autorità CASA non-phone
  ha.ts                           adapter Home Assistant
  demo.tsx                        adapter standalone
  panel.tsx                       custom element Home Assistant

custom_components/family_calendar/
  __init__.py                     setup integrazione/pannello
  storage.py                      preferiti + override icone
  websocket.py                    API WebSocket custom
  manifest.json                   versione canonica
  frontend/                       bundle compilato
```

### Documentazione

- [`ROADMAP.md`](ROADMAP.md) — stato e prossimi milestone
- [`CHANGELOG.md`](CHANGELOG.md) — cronologia release
- [`DESIGN.md`](DESIGN.md) — contratto visuale V70/V74/V79
- [`UX-CONTRACT.md`](UX-CONTRACT.md) — invarianti funzionali e responsive
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — sviluppo, build, CI e release
- [`docs/I18N.md`](docs/I18N.md) — localizzazione

---

## English

### What v2.0 includes

- full-screen monthly calendar with multi-day events;
- responsive layouts from phone through tablet/iPad, desktop, wide and ultra-wide displays;
- upcoming agenda;
- Todo/Shopping LISTS with add, complete and swipe-to-delete interactions;
- SMART HOME card with rooms, favorites and quick controls;
- full HOME page with rooms, house status, climate, sensors, utilities and device controls;
- lights with power, brightness and white-temperature controls;
- covers with position control;
- climate target, HVAC, fan and preset controls;
- passive entities rendered as information rather than misleading switches;
- whole-home and room-scoped Turn off all actions;
- automatic light/dark appearance through `sun.sun`, plus manual override;
- one shared header and page chrome across CALENDAR and HOME;
- identical CALENDAR/HOME page-switch geometry at every breakpoint;
- shared page backgrounds and gradients;
- persistent icon customization for **devices and rooms**;
- **553 unique icon keys**, including broad smart-home coverage and a dedicated Apple hardware category;
- global icon search without a mandatory category filter;
- Italian/English localization;
- standalone demo with simulated Home Assistant data;
- CI for type-check/build, Home Assistant bundle, Hassfest, HACS and automatic releases.

### Icon customization

The icon editor can override both room icons and entity icons. Home Assistant persists overrides through Store and custom WebSocket commands; the standalone demo uses its demo adapter.

### Standalone demo

Public demo:

https://donatomontrone.github.io/family-calendar/

Local development:

```bash
npm ci
npm run dev
```

### Home Assistant

The canonical integration version lives in `custom_components/family_calendar/manifest.json`. `package.json` and the root lockfile package version must match it.

Build:

```bash
npm run build
```

Distributed bundle:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

### Real-data status

v2.0.0 is the consolidated UI/responsive baseline. These remain separate milestones:

- real `calendar.*` events;
- real `todo.*` Todo/Shopping data;
- Google Calendar source selection through Home Assistant;
- Microsoft 365 / Outlook adapter;
- advanced media, scene/script and configuration capabilities.

### Documentation

- [`ROADMAP.md`](ROADMAP.md) — milestones and status
- [`CHANGELOG.md`](CHANGELOG.md) — release history
- [`DESIGN.md`](DESIGN.md) — V70/V74/V79 visual contract
- [`UX-CONTRACT.md`](UX-CONTRACT.md) — behavioral and responsive invariants
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — development, build, CI and release
- [`docs/I18N.md`](docs/I18N.md) — localization
