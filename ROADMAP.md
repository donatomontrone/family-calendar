# Family Calendar Roadmap

## Italiano

Versione corrente: **v1.0.0**.

La 1.0 chiude la baseline visuale della pagina **CALENDARIO**. Salvo indicazioni diverse, le prossime iterazioni UI saranno concentrate sulla pagina **CASA**.

### Fase 0 — Fondazioni e demo standalone
Stato: completata

- [x] React + TypeScript + Vite
- [x] demo standalone con dati Home Assistant simulati
- [x] interazioni demo per luci, switch, cover e clima
- [x] preferiti persistenti in `localStorage` in modalità demo
- [x] layout responsive desktop/tablet
- [x] gesture mouse/touch per segmented controls, stanze e liste
- [x] tema chiaro/scuro automatico + override manuale
- [x] CI frontend con type-check e build
- [x] Hassfest e HACS verdi sulla baseline 1.0

### Fase 1 — Integrazione Home Assistant installabile
Stato: implementazione base completata, verifica reale ancora da ampliare

- [x] custom integration `family_calendar`
- [x] config flow single-instance
- [x] pannello custom full-screen
- [x] WebSocket API per i preferiti
- [x] persistenza tramite Home Assistant Store
- [x] bundle frontend generato e copiato nella custom integration
- [x] versionamento semantico della custom integration
- [ ] test manuale approfondito su installazione HACS custom repository
- [ ] verificare reload/unload del pannello su installazione reale
- [ ] definire eventuale pacchetto release ZIP dedicato oltre al repository HACS

### Fase 2 — Calendari reali
Stato: pianificata

- [ ] leggere le entità `calendar.*`
- [ ] selezione calendari visibili
- [ ] aggregazione eventi da più calendari
- [ ] eventi all-day e multi-day reali
- [ ] colori per sorgente calendario
- [ ] timezone e localizzazione
- [ ] loading/error/empty states

### Fase 3 — Google e Microsoft
Stato: pianificata

- [ ] Google Calendar tramite integrazione Home Assistant
- [ ] adapter Microsoft 365 / Outlook
- [ ] nessuna credenziale provider nel frontend
- [ ] configurazione sorgenti tramite config entry/backend

### Fase 4 — Todo e Shopping reali
Stato: pianificata

La UI della card LISTE è stabile nella 1.0; manca il collegamento alle entità Home Assistant.

- [ ] discovery delle entità `todo.*`
- [ ] lettura elementi
- [ ] completamento attività
- [ ] aggiunta attività
- [ ] eliminazione/sincronizzazione
- [ ] selezione lista Todo e lista Spesa
- [ ] aggiornamento realtime

### Fase 5 — Smart Home
Stato: parzialmente completata

- [x] stanze e preferiti nel pannello Calendario
- [x] azione Spegni tutto per casa/stanza
- [x] light: on/off e brightness
- [x] light White Ambiance: temperatura del bianco
- [x] cover: stato e posizione
- [x] climate: temperatura, HVAC, ventola e preset
- [x] sensori/passive entities mostrati come informazioni
- [x] popup controlli dispositivo
- [ ] miglioramento completo della pagina CASA
- [ ] scene/script avanzati
- [ ] controlli media player completi
- [ ] ordinamento/configurazione stanze e accessori
- [ ] preferiti per utente o globali configurabili

### Fase 6 — UX wall display
Stato: parzialmente completata

- [x] viewport Calendario fissa senza scroll pagina
- [x] scroll interni con scrollbar nascosta
- [x] swipe-to-delete nelle liste
- [x] jump-to-bottom per liste e dispositivi
- [x] light/dark theme automatico tramite `sun.sun`
- [x] override manuale del tema
- [x] tipografia di sistema Apple-style
- [x] responsive tablet/desktop
- [ ] modalità kiosk dedicata
- [ ] scaling e test sistematici su più tablet 10–15"
- [ ] burn-in mitigation opzionale
- [ ] audit accessibilità/tastiera completo
- [ ] profiling performance Raspberry Pi / browser embedded

### Fase 7 — Release
Stato: v1.0.0

- [x] Hassfest verde
- [x] HACS validation verde
- [x] frontend type-check/build verde
- [x] bundle Home Assistant verificato in CI
- [x] documentazione aggiornata
- [x] changelog
- [x] release `v1.0.0`
- [ ] verifica end-to-end su installazione Home Assistant reale

### Prossimo focus UI

1. consolidamento e rifinitura della pagina CASA;
2. mantenere invariata la pagina CALENDARIO salvo richieste esplicite;
3. successivamente collegare dati `calendar.*` e `todo.*` reali.

---

## English

Current version: **v1.0.0**.

v1.0 closes the stable visual baseline for the **CALENDAR** page. Unless explicitly requested otherwise, upcoming UI work will focus on the **HOME** page.

### Phase 0 — Foundations and standalone demo
Status: complete

- [x] React + TypeScript + Vite
- [x] standalone demo with simulated Home Assistant data
- [x] demo interactions for lights, switches, covers and climate
- [x] persistent demo favorites through `localStorage`
- [x] responsive desktop/tablet layout
- [x] mouse/touch gestures for segmented controls, rooms and lists
- [x] automatic light/dark appearance + manual override
- [x] frontend CI with type-check and build
- [x] Hassfest and HACS green on the 1.0 baseline

### Phase 1 — Installable Home Assistant integration
Status: base implementation complete, real-install testing still to expand

- [x] `family_calendar` custom integration
- [x] single-instance config flow
- [x] full-screen custom panel
- [x] favorites WebSocket API
- [x] Home Assistant Store persistence
- [x] compiled frontend bundle copied into the integration
- [x] semantic integration versioning
- [ ] deeper manual HACS custom-repository installation testing
- [ ] verify panel reload/unload on a real installation
- [ ] decide whether to add a dedicated release ZIP in addition to HACS repository installs

### Phase 2 — Real calendars
Status: planned

- [ ] read `calendar.*` entities
- [ ] selectable visible calendars
- [ ] aggregate multiple calendar sources
- [ ] real all-day and multi-day events
- [ ] source colors
- [ ] timezone/localization
- [ ] loading/error/empty states

### Phase 3 — Google and Microsoft
Status: planned

- [ ] Google Calendar through Home Assistant
- [ ] Microsoft 365 / Outlook adapter
- [ ] no provider credentials in the frontend
- [ ] source configuration through config entry/backend

### Phase 4 — Real Todo and Shopping
Status: planned

The LISTS UI is stable in v1.0; the Home Assistant entity adapter is still pending.

- [ ] discover `todo.*` entities
- [ ] read items
- [ ] complete items
- [ ] add items
- [ ] delete/synchronize items
- [ ] choose Todo and Shopping lists
- [ ] realtime updates

### Phase 5 — Smart Home
Status: partially complete

- [x] rooms and favorites in the Calendar panel
- [x] whole-home/room Turn off all
- [x] lights: on/off and brightness
- [x] White Ambiance lights: white temperature
- [x] covers: state and position
- [x] climate: temperature, HVAC, fan and presets
- [x] passive entities rendered as information
- [x] device-control dialogs
- [ ] full HOME-page refinement
- [ ] advanced scenes/scripts
- [ ] complete media-player controls
- [ ] room/accessory ordering and configuration
- [ ] configurable per-user/global favorites

### Phase 6 — Wall-display UX
Status: partially complete

- [x] fixed Calendar viewport without page scrolling
- [x] internal scrolling with hidden scrollbars
- [x] swipe-to-delete lists
- [x] jump-to-bottom controls for lists/devices
- [x] automatic light/dark theme via `sun.sun`
- [x] manual appearance override
- [x] Apple-style system typography
- [x] responsive tablet/desktop layout
- [ ] dedicated kiosk mode
- [ ] systematic 10–15" tablet scaling tests
- [ ] optional burn-in mitigation
- [ ] complete accessibility/keyboard audit
- [ ] Raspberry Pi / embedded-browser performance profiling

### Phase 7 — Release
Status: v1.0.0

- [x] Hassfest green
- [x] HACS validation green
- [x] frontend type-check/build green
- [x] Home Assistant bundle verified in CI
- [x] documentation updated
- [x] changelog
- [x] `v1.0.0` release
- [ ] end-to-end verification on a real Home Assistant installation

### Next UI focus

1. consolidate and refine the HOME page;
2. keep the CALENDAR page unchanged unless explicitly requested;
3. then connect real `calendar.*` and `todo.*` data.
