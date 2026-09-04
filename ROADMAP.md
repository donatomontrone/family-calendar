# Family Calendar Roadmap

## Italiano

### Fase 0 — Fondazioni e demo standalone
Stato: in corso

Obiettivo: avere un frontend solido, responsive e completamente provabile senza Home Assistant.

- [x] React + TypeScript + Vite
- [x] demo standalone con dati Home Assistant simulati
- [x] interazioni demo per luci, switch, cover e clima
- [x] preferiti persistenti in `localStorage` in modalità demo
- [x] layout desktop/tablet responsive
- [x] CI frontend con type-check e build
- [ ] completare test touch/mobile
- [ ] eliminare warning residui di CI

### Fase 1 — Integrazione Home Assistant installabile
Obiettivo: rendere il repository installabile e testabile su un'istanza Home Assistant reale.

- [x] custom integration `family_calendar`
- [x] config flow single-instance
- [x] pannello custom full-screen
- [x] WebSocket API per i preferiti
- [x] persistenza tramite Home Assistant Store
- [ ] distribuire il bundle frontend compilato in modo affidabile
- [ ] test manuale installazione HACS custom repository
- [ ] verificare reload/unload del pannello
- [ ] definire strategia release ZIP oppure bundle versionato nel repository

### Fase 2 — Calendari reali
Obiettivo: sostituire gli eventi demo con entità calendario Home Assistant.

- [ ] leggere le entità `calendar.*`
- [ ] selezione calendari visibili
- [ ] aggregazione eventi da più calendari
- [ ] eventi all-day e multi-day
- [ ] colori per sorgente calendario
- [ ] timezone e localizzazione
- [ ] gestione loading/error/empty states

### Fase 3 — Google e Microsoft
Obiettivo: usare Home Assistant come adapter verso i provider esterni.

- [ ] supporto Google Calendar tramite integrazione HA
- [ ] definire adapter Microsoft 365 / Outlook
- [ ] evitare credenziali provider nel frontend
- [ ] configurazione sorgenti nella config entry

### Fase 4 — Todo e Shopping
Obiettivo: usare le entità `todo.*` di Home Assistant.

- [ ] lettura liste disponibili
- [ ] completamento attività
- [ ] aggiunta attività
- [ ] selezione lista Todo e lista Spesa
- [ ] aggiornamento realtime

### Fase 5 — Smart Home
Obiettivo: passare dai controlli generici a controlli domain-aware.

- [ ] light: on/off, brightness, color temperature
- [ ] cover: open/close/stop/position
- [ ] climate: HVAC mode e temperatura
- [ ] media player: stato e controlli base
- [ ] scene/script
- [ ] preferiti per utente o globali
- [ ] selezione e ordinamento stanze

### Fase 6 — UX da wall display
Obiettivo: ottimizzare il pannello per tablet e display always-on.

- [ ] modalità kiosk
- [ ] scaling per 10–15 pollici
- [ ] gesture touch
- [ ] tema chiaro/scuro
- [ ] burn-in mitigation opzionale
- [ ] accessibilità e tastiera
- [ ] performance su Raspberry Pi

### Fase 7 — Release

- [ ] test Hassfest e HACS completamente verdi
- [ ] branding definitivo
- [ ] changelog
- [ ] release `v0.1.0`
- [ ] pacchetto HACS verificato
- [ ] documentazione installazione e troubleshooting

---

## English

### Phase 0 — Foundations and standalone demo
Status: in progress

Goal: provide a robust, responsive frontend that can be fully tested without Home Assistant.

- [x] React + TypeScript + Vite
- [x] standalone demo with simulated Home Assistant data
- [x] demo interactions for lights, switches, covers and climate
- [x] persistent demo favorites through `localStorage`
- [x] responsive desktop/tablet layout
- [x] frontend CI with type-check and build
- [ ] finish touch/mobile testing
- [ ] remove remaining CI warnings

### Phase 1 — Installable Home Assistant integration
Goal: make the repository installable and testable on a real Home Assistant instance.

- [x] `family_calendar` custom integration
- [x] single-instance config flow
- [x] full-screen custom panel
- [x] favorites WebSocket API
- [x] Home Assistant Store persistence
- [ ] reliably distribute the compiled frontend bundle
- [ ] manually test HACS custom-repository installation
- [ ] verify panel reload/unload
- [ ] choose release ZIP or versioned bundle strategy

### Phase 2 — Real calendars
Goal: replace demo events with Home Assistant calendar entities.

- [ ] read `calendar.*` entities
- [ ] selectable visible calendars
- [ ] aggregate events from multiple calendars
- [ ] all-day and multi-day events
- [ ] source colors
- [ ] timezone and localization
- [ ] loading/error/empty states

### Phase 3 — Google and Microsoft
Goal: use Home Assistant as the adapter for external providers.

- [ ] Google Calendar through the HA integration
- [ ] Microsoft 365 / Outlook adapter
- [ ] no provider credentials in the frontend
- [ ] source configuration through the config entry

### Phase 4 — Todo and Shopping
Goal: use Home Assistant `todo.*` entities.

- [ ] discover lists
- [ ] complete items
- [ ] add items
- [ ] choose Todo and Shopping lists
- [ ] realtime updates

### Phase 5 — Smart Home
Goal: replace generic controls with domain-aware controls.

- [ ] lights
- [ ] covers
- [ ] climate
- [ ] media players
- [ ] scenes/scripts
- [ ] per-user or global favorites
- [ ] room selection and ordering

### Phase 6 — Wall-display UX
Goal: optimize for always-on tablets and displays.

- [ ] kiosk mode
- [ ] 10–15 inch scaling
- [ ] touch gestures
- [ ] light/dark theme
- [ ] optional burn-in mitigation
- [ ] accessibility and keyboard support
- [ ] Raspberry Pi performance

### Phase 7 — Release

- [ ] Hassfest and HACS fully green
- [ ] final branding
- [ ] changelog
- [ ] `v0.1.0` release
- [ ] verified HACS package
- [ ] installation and troubleshooting documentation
