# Development

## Italiano

Versione corrente: **1.0.0**.

### Requisiti

- Node.js 24
- npm
- Home Assistant per i test della custom integration reale

### Demo frontend senza Home Assistant

Dalla root:

```bash
npm ci
npm run dev
```

Vite carica `src/demo.tsx`, che crea un adapter `Hass` simulato con stanze, entità, WebSocket e service call fittizie. La demo utilizza lo stesso `App.tsx` del pannello Home Assistant.

La demo forza `it-IT` per mantenere deterministico il layout italiano durante lo sviluppo. I preferiti demo vengono persistiti in `localStorage`.

### Build

```bash
npm run build
```

La build esegue:

```text
TypeScript type-check
→ Vite library build da src/panel.tsx
→ copia del bundle in custom_components/family_calendar/frontend/
```

Output atteso:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

### Architettura runtime

```text
App.tsx
  shell + pagina Calendario
  │
  ├── SharedHeader.tsx
  ├── SwipeTaskRow.tsx
  ├── ScrollRegion.tsx
  ├── ClimateControl.tsx
  ├── HomeView.tsx
  │
  ├── demo.tsx
  │     adapter simulato
  │
  └── panel.tsx
        custom element Home Assistant
             │
             ▼
            ha.ts
      adapter API Home Assistant
```

`App.tsx` non deve contenere autenticazione Google/Microsoft o credenziali provider. Le sorgenti esterne devono essere esposte tramite Home Assistant o adapter backend della custom integration.

### Design system e CSS

La UI è stata evoluta per iterazioni visuali. I layer `calendar-v*.css` vengono concatenati da `ui-interactions.ts` come contratto finale della pagina Calendario; i layer più recenti hanno precedenza deliberata sulle regole storiche.

Per la 1.0 la pagina Calendario è considerata baseline visuale stabile. Le modifiche successive devono evitare regressioni su:

- dimensioni fisse della dashboard;
- segmented controls;
- LISTE e swipe;
- CASA INTELLIGENTE;
- tema chiaro/scuro;
- header condiviso;
- popup controlli dispositivo.

Salvo richiesta esplicita, le prossime iterazioni UI devono riguardare `HomeView.tsx` / pagina CASA.

### Gesture

Le gesture principali sono:

- drag bidirezionale dei segmented controls;
- drag/scroll orizzontale della rail stanze;
- swipe verso sinistra sulle righe LISTE;
- swipe corto: rivela l'azione cestino;
- swipe lungo: elimina direttamente;
- scroll verticale interno di LISTE e griglia dispositivi;
- pulsante jump-to-bottom mostrato solo quando esiste contenuto nascosto.

Quando si modifica una gesture, verificare sempre mouse, touch e scrolling verticale per evitare conflitti di pointer capture.

### Versioning

La versione canonica della custom integration è in:

```text
custom_components/family_calendar/manifest.json
```

`package.json` usa lo stesso numero di versione per rendere leggibile lo stato del frontend, anche se il package npm è `private`.

Le release seguono Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

La release 1.0.0 rappresenta la prima baseline UI stabile, non la conclusione di tutti gli adapter dati previsti dalla roadmap.

### CI

Ogni push su `master` esegue:

- frontend type-check e build;
- verifica del bundle compilato Home Assistant;
- HACS validation;
- Hassfest.

Prima di una release tutti questi job devono essere verdi.

### Release

La release `v1.0.0` viene creata automaticamente dal workflow dedicato quando il manifest passa a `1.0.0`. Il workflow crea il tag sul commit di release e pubblica le note da `CHANGELOG.md`, evitando duplicati se la release esiste già.

### HACS

Il repository è strutturato come custom integration HACS. La validazione automatica è parte della CI; resta comunque necessario ampliare i test end-to-end su una vera installazione Home Assistant prima di considerare conclusa la parte backend/integration della roadmap.

---

## English

Current version: **1.0.0**.

### Requirements

- Node.js 24
- npm
- Home Assistant for real custom-integration testing

### Standalone frontend demo

From the repository root:

```bash
npm ci
npm run dev
```

Vite loads `src/demo.tsx`, which creates a simulated `Hass` adapter with rooms, entities, WebSocket calls and service calls. The demo renders the same `App.tsx` used by the Home Assistant panel.

The demo intentionally forces `it-IT` so the Italian layout is deterministic during development. Demo favorites are persisted in `localStorage`.

### Build

```bash
npm run build
```

The build performs:

```text
TypeScript type-check
→ Vite library build from src/panel.tsx
→ copy bundle to custom_components/family_calendar/frontend/
```

Expected output:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

### Runtime architecture

```text
App.tsx
  shell + Calendar page
  │
  ├── SharedHeader.tsx
  ├── SwipeTaskRow.tsx
  ├── ScrollRegion.tsx
  ├── ClimateControl.tsx
  ├── HomeView.tsx
  │
  ├── demo.tsx
  │     simulated adapter
  │
  └── panel.tsx
        Home Assistant custom element
             │
             ▼
            ha.ts
      Home Assistant API adapter
```

`App.tsx` must not contain Google/Microsoft authentication or provider credentials. External sources should be exposed through Home Assistant or backend adapters in the custom integration.

### Design system and CSS

The UI has evolved through visual iterations. `calendar-v*.css` layers are concatenated by `ui-interactions.ts` as the final Calendar-page contract; newer layers deliberately override historical rules.

For v1.0 the Calendar page is considered a stable visual baseline. Future changes should avoid regressions in:

- fixed dashboard geometry;
- segmented controls;
- LISTS and swipe interactions;
- SMART HOME card;
- light/dark appearance;
- shared header;
- device-control dialogs.

Unless explicitly requested otherwise, upcoming UI work should target `HomeView.tsx` / the HOME page.

### Gestures

Main gestures:

- bidirectional segmented-control drag;
- horizontal room-rail drag/scroll;
- left swipe on LISTS rows;
- short swipe reveals trash action;
- long swipe deletes directly;
- internal vertical scrolling for LISTS and device grids;
- jump-to-bottom button shown only when content is hidden below.

When changing gestures, always verify mouse, touch and vertical scrolling to avoid pointer-capture conflicts.

### Versioning

The canonical custom-integration version is stored in:

```text
custom_components/family_calendar/manifest.json
```

`package.json` mirrors the same version for frontend visibility even though the npm package is private.

Releases follow Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

v1.0.0 is the first stable UI baseline; it does not mean every data adapter in the roadmap is complete.

### CI

Every push to `master` runs:

- frontend type-check and build;
- Home Assistant compiled-bundle verification;
- HACS validation;
- Hassfest.

All jobs must be green before a release.

### Release

The `v1.0.0` release is created automatically by the dedicated workflow when the manifest moves to `1.0.0`. The workflow tags the release commit and publishes notes from `CHANGELOG.md`, while safely skipping creation if the release already exists.

### HACS

The repository is structured as a HACS custom integration. Automated validation is part of CI, but deeper end-to-end testing on a real Home Assistant installation remains a backend/integration roadmap item.
