# Family Calendar

## Italiano

**Family Calendar** è un pannello dedicato per Home Assistant pensato come calendario digitale familiare da parete o tablet. Il frontend è separato dalle dashboard Lovelace standard e riunisce calendario, agenda, Todo, lista della spesa e accesso rapido ai dispositivi smart della casa.

Il progetto è in fase **Alpha**. La parte visuale può già essere provata senza avere Home Assistant attivo tramite una demo standalone con dati simulati.

### Prova subito la demo senza Home Assistant

Requisiti:

- Node.js 24
- npm

Dalla root del repository:

```bash
npm ci
npm run dev
```

Apri quindi l'indirizzo mostrato da Vite, normalmente `http://localhost:5173`.

La demo include:

- calendario mensile navigabile;
- agenda dei prossimi giorni;
- Todo e lista della spesa interattivi;
- stanze simulate;
- luci, switch, cover e climatizzazione simulati;
- preferiti persistenti nel browser tramite `localStorage`;
- layout responsive per desktop e tablet;
- localizzazione italiana/inglese.

### Architettura

```text
src/
  App.tsx              UI principale
  demo.tsx             adapter standalone / mock Home Assistant
  panel.tsx            custom element caricato da Home Assistant
  ha.ts                 adapter tra UI e API Home Assistant
  i18n.ts              localizzazione frontend
  types.ts             tipi condivisi
  styles.css           design system e layout

custom_components/family_calendar/
  __init__.py          setup integrazione e pannello
  config_flow.py       configurazione Home Assistant
  storage.py           persistenza preferiti
  websocket.py         API WebSocket custom
  frontend/            bundle compilato destinato a Home Assistant
```

L'obiettivo architetturale è mantenere la UI indipendente dal backend: `App.tsx` riceve un oggetto `hass`, mentre la demo fornisce un adapter simulato e Home Assistant fornisce l'oggetto reale. In questo modo la stessa interfaccia può essere sviluppata e testata anche senza un'istanza Home Assistant.

### Build frontend

```bash
npm run build
```

La build esegue il type-check TypeScript, genera il bundle Vite e lo copia in:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

### Home Assistant / HACS

La custom integration è già presente nel repository, ma finché non viene definita e verificata la strategia definitiva di distribuzione del bundle frontend l'installazione HACS va considerata sperimentale.

La roadmap completa è disponibile in [`ROADMAP.md`](ROADMAP.md).

Le prossime priorità sono:

1. completare e verificare la demo standalone;
2. rendere affidabile il packaging del bundle frontend per HACS;
3. collegare le entità `calendar.*` reali di Home Assistant;
4. collegare le entità `todo.*`;
5. aggiungere controlli smart-home specifici per dominio;
6. supportare Google Calendar e Microsoft 365 attraverso Home Assistant;
7. preparare la prima release stabile.

---

## English

**Family Calendar** is a dedicated Home Assistant panel designed as a family wall calendar for tablets and always-on displays. The frontend is separate from standard Lovelace dashboards and combines a calendar, agenda, Todo, shopping list, and quick access to smart-home devices.

The project is currently **Alpha**. The visual application can already be tested without a running Home Assistant instance through a standalone demo backed by simulated data.

### Run the demo without Home Assistant

Requirements:

- Node.js 24
- npm

From the repository root:

```bash
npm ci
npm run dev
```

Then open the address shown by Vite, normally `http://localhost:5173`.

The demo includes:

- navigable monthly calendar;
- upcoming agenda;
- interactive Todo and shopping lists;
- simulated rooms;
- simulated lights, switches, covers and climate devices;
- browser-persistent favorites through `localStorage`;
- responsive desktop/tablet layout;
- Italian and English localization.

### Architecture

```text
src/
  App.tsx              main UI
  demo.tsx             standalone / mock Home Assistant adapter
  panel.tsx            custom element loaded by Home Assistant
  ha.ts                 UI to Home Assistant API adapter
  i18n.ts              frontend localization
  types.ts             shared types
  styles.css           design system and layout

custom_components/family_calendar/
  __init__.py          integration and panel setup
  config_flow.py       Home Assistant configuration
  storage.py           favorites persistence
  websocket.py         custom WebSocket API
  frontend/            compiled bundle for Home Assistant
```

The architectural goal is to keep the UI independent from the backend: `App.tsx` receives a `hass` object, while the demo supplies a simulated adapter and Home Assistant supplies the real object. This keeps the same interface usable during development even without a Home Assistant instance.

### Frontend build

```bash
npm run build
```

The build runs TypeScript type-checking, creates the Vite bundle, and copies it to:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

### Home Assistant / HACS

The custom integration already lives in the repository, but HACS installation should still be considered experimental until the frontend bundle distribution strategy has been finalized and verified.

See [`ROADMAP.md`](ROADMAP.md) for the complete roadmap.

Current priorities are:

1. finish and verify the standalone demo;
2. make frontend bundle packaging reliable for HACS;
3. connect real Home Assistant `calendar.*` entities;
4. connect `todo.*` entities;
5. add domain-aware smart-home controls;
6. support Google Calendar and Microsoft 365 through Home Assistant;
7. prepare the first stable release.
