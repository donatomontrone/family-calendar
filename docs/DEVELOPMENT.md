# Development

## Italiano

### Requisiti

- Node.js 24
- npm
- Home Assistant solo per i test della custom integration

### Demo frontend senza Home Assistant

Dalla root:

```bash
npm ci
npm run dev
```

Vite carica `src/demo.tsx`. Questo file crea un adapter `Hass` simulato con stanze, entità, WebSocket e service call fittizie. L'interfaccia usa quindi lo stesso `App.tsx` che verrà montato dentro Home Assistant.

I preferiti della demo vengono salvati nel `localStorage` del browser.

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

Il file atteso è:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

### Separazione dei ruoli

```text
App.tsx
  UI e stato della pagina
     │
     ├── demo.tsx
     │     adapter simulato per sviluppo standalone
     │
     └── panel.tsx
           custom element caricato da Home Assistant
                  │
                  ▼
               ha.ts
          adapter API Home Assistant
```

`App.tsx` non deve contenere autenticazione Google/Microsoft o logica specifica dei provider. Le sorgenti esterne devono essere esposte attraverso Home Assistant o attraverso adapter backend dell'integrazione.

### CI

Ogni push esegue:

- frontend type-check e build;
- verifica della presenza del bundle compilato;
- HACS validation;
- Hassfest.

### HACS

Il repository è strutturato come custom integration. Prima della prima release va completata la strategia di distribuzione del bundle frontend: bundle compilato versionato nel repository oppure pacchetto ZIP di release.

---

## English

### Requirements

- Node.js 24
- npm
- Home Assistant only for custom-integration testing

### Frontend demo without Home Assistant

From the repository root:

```bash
npm ci
npm run dev
```

Vite loads `src/demo.tsx`. It creates a simulated `Hass` adapter with rooms, entities, WebSocket calls and service calls. The UI therefore uses the same `App.tsx` that will later be mounted inside Home Assistant.

Demo favorites are persisted in browser `localStorage`.

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

### Separation of responsibilities

```text
App.tsx
  page UI and state
     │
     ├── demo.tsx
     │     simulated standalone-development adapter
     │
     └── panel.tsx
           custom element loaded by Home Assistant
                  │
                  ▼
               ha.ts
          Home Assistant API adapter
```

`App.tsx` should not contain Google/Microsoft authentication or provider-specific logic. External sources should be exposed through Home Assistant or backend adapters in the integration.

### CI

Every push runs:

- frontend type-check and build;
- compiled-bundle verification;
- HACS validation;
- Hassfest.

### HACS

The repository is structured as a custom integration. Before the first release, the frontend distribution strategy must be finalized: either keep the compiled bundle versioned in the repository or publish a release ZIP.
