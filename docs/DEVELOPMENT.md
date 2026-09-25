# Development

## Italiano

Versione corrente: **2.0.0**.

### Requisiti

- Node.js 24
- npm
- Home Assistant per i test della custom integration reale

### Demo frontend

```bash
npm ci
npm run dev
```

La demo carica `src/demo.tsx`, usa lo stesso `App.tsx` del pannello Home Assistant e applica il contratto responsive finale tramite `demo-responsive-system.ts`. La locale demo è intenzionalmente `it-IT`.

### Build

```bash
npm run build
```

Pipeline:

```text
TypeScript type-check
→ Vite library build da src/panel.tsx
→ copia bundle in custom_components/family_calendar/frontend/
```

Output:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

### Autorità UI v2.0

La UI conserva layer storici per compatibilità, ma le autorità correnti sono:

- CASA non-phone: `home-unified-v70.css`;
- header condiviso: `shared-layout-v71.css`;
- CALENDARIO non-phone: `calendar-phone-first-v74.css`;
- personalizzazione icone: `entity-icon-customization.tsx`, `icon-customization-v76.css`, `icon-customization-v78.css`;
- chrome condiviso: `shared-page-chrome-v77.css`;
- parità finale della demo CALENDARIO/CASA: `demo-page-parity-v79.css`;
- classificazione breakpoint demo: `demo-responsive-system.ts`.

I layer finali devono prevalere sulle regole storiche senza cambiare la struttura dei componenti congelati.

### Icone personalizzate

Gli override usano chiavi semantiche del catalogo, non asset remoti.

Home Assistant:
- `IconOverrideStore` persiste gli override;
- WebSocket `family_calendar/icons/get` e `family_calendar/icons/set` leggono/salvano le mappe;
- le stanze usano target `area:<area_id>`;
- le entità usano direttamente `entity_id`.

La demo standalone usa il proprio adapter di persistenza.

Ogni nuova icona deve avere chiave univoca, categoria, label IT/EN e keyword di ricerca. Le silhouette Apple-style del progetto devono restare originali e non copiare vettori di terze parti.

### Versioning

La versione canonica è:

```text
custom_components/family_calendar/manifest.json
```

Devono avere lo stesso numero:

```text
custom_components/family_calendar/manifest.json
package.json
package-lock.json -> version
package-lock.json -> packages[""].version
```

Le release seguono Semantic Versioning `MAJOR.MINOR.PATCH`.

v2.0.0 è la main UI release che consolida CALENDARIO, CASA, icon customization e shared page chrome. Non implica il completamento degli adapter `calendar.*` / `todo.*`.

### CI

Ogni push su `master` esegue almeno:

- frontend type-check/build;
- verifica del bundle compilato;
- HACS validation;
- Hassfest;
- deploy GitHub Pages quando previsto.

### Release

Il workflow `.github/workflows/release.yml` è l'unica procedura di release.

Per rilasciare `X.Y.Z`:

1. aggiornare manifest, package e lockfile alla stessa versione;
2. aggiungere `## [X.Y.Z] - YYYY-MM-DD` in cima al changelog;
3. aggiornare README/ROADMAP/DEVELOPMENT;
4. verificare che il bundle Home Assistant sia aggiornato;
5. eseguire il push su `master`.

Il workflow verifica la coerenza delle versioni, estrae le note dal changelog e crea automaticamente tag `vX.Y.Z` e GitHub Release. Se la release esiste già, non la duplica.

### Regola per il bundle

Se una modifica frontend cambia il bundle, il workflow Frontend lo ricompila e lo committa su `master`. Una release non deve essere pubblicata con bundle stale.

---

## English

Current version: **2.0.0**.

### Requirements

- Node.js 24
- npm
- Home Assistant for real custom-integration testing

### Standalone demo

```bash
npm ci
npm run dev
```

The demo loads `src/demo.tsx`, renders the same `App.tsx` as Home Assistant, and applies the final responsive contract through `demo-responsive-system.ts`.

### Build

```bash
npm run build
```

Expected output:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

### v2.0 UI authorities

- non-phone HOME: `home-unified-v70.css`;
- shared header: `shared-layout-v71.css`;
- non-phone CALENDAR: `calendar-phone-first-v74.css`;
- icon customization: `entity-icon-customization.tsx`, `icon-customization-v76.css`, `icon-customization-v78.css`;
- shared page chrome: `shared-page-chrome-v77.css`;
- final standalone CALENDAR/HOME parity: `demo-page-parity-v79.css`;
- demo breakpoint classification: `demo-responsive-system.ts`.

### Custom icons

Home Assistant persists icon overrides through `IconOverrideStore` and the `family_calendar/icons/get` / `family_calendar/icons/set` WebSocket commands. Room targets use `area:<area_id>`; entities use their `entity_id`.

Every catalog entry must have a unique key, category, IT/EN labels and search keywords. Project Apple-style silhouettes must remain original rather than copied third-party vectors.

### Versioning

The canonical version is stored in `custom_components/family_calendar/manifest.json`. The same version must be mirrored in `package.json` and both root package versions in `package-lock.json`.

Releases use Semantic Versioning.

### Release

`.github/workflows/release.yml` is the canonical release path. Update all version surfaces, add the matching changelog section, update primary documentation, ensure the committed frontend bundle is current, then push to `master`.

The workflow validates version consistency, extracts release notes from `CHANGELOG.md`, creates tag `vX.Y.Z`, and publishes the GitHub Release.
