# Family Calendar Roadmap

## Italiano

Versione corrente: **v2.0.0**.

La 2.0 è la main release che consolida il contratto UI di **CALENDARIO + CASA**. Entrambe le pagine hanno ora una baseline responsive condivisa da telefono a ultra-wide; il prossimo focus principale torna quindi agli adapter dati reali e alle funzionalità Home Assistant non ancora collegate.

### Fase 0 — Fondazioni e demo standalone
Stato: completata

- [x] React + TypeScript + Vite
- [x] demo standalone con dati Home Assistant simulati
- [x] gesture mouse/touch e scrolling interno
- [x] tema chiaro/scuro automatico + override manuale
- [x] classificazione responsive demo da phone a xl/ultra
- [x] GitHub Pages
- [x] CI frontend con type-check e build

### Fase 1 — Integrazione Home Assistant installabile
Stato: implementazione base completata, verifica reale ancora da ampliare

- [x] custom integration `family_calendar`
- [x] config flow single-instance
- [x] pannello custom full-screen
- [x] persistenza preferiti tramite Home Assistant Store
- [x] persistenza override icone tramite Home Assistant Store
- [x] WebSocket API per preferiti e icone
- [x] bundle frontend compilato e versionato nel repository
- [x] versionamento semantico coerente manifest/npm/lockfile
- [ ] test manuale approfondito su installazione HACS custom repository
- [ ] verificare reload/unload del pannello su installazione reale
- [ ] valutare un eventuale ZIP release dedicato oltre al repository HACS

### Fase 2 — Calendari reali
Stato: pianificata

- [ ] leggere le entità `calendar.*`
- [ ] selezione calendari visibili
- [ ] aggregazione multi-sorgente
- [ ] eventi all-day e multi-day reali
- [ ] colori per sorgente
- [ ] timezone/localizzazione
- [ ] loading/error/empty states

### Fase 3 — Google e Microsoft
Stato: pianificata

- [ ] Google Calendar tramite integrazione Home Assistant
- [ ] adapter Microsoft 365 / Outlook
- [ ] nessuna credenziale provider nel frontend
- [ ] configurazione sorgenti tramite backend/config entry

### Fase 4 — Todo e Shopping reali
Stato: UI completata, adapter dati pianificato

- [x] UI Todo/Spesa
- [x] aggiunta, completamento e cancellazione
- [x] swipe-to-delete e scroll interno
- [ ] discovery delle entità `todo.*`
- [ ] lettura/scrittura elementi reali
- [ ] selezione lista Todo e lista Spesa
- [ ] aggiornamento realtime

### Fase 5 — Smart Home
Stato: UI principale completata, funzioni avanzate parziali

- [x] stanze, preferiti e Spegni tutto
- [x] light, White Ambiance, cover e climate
- [x] sensori/passive entities
- [x] popup controlli dispositivo
- [x] pagina CASA responsive V70
- [x] layout Open space e navigazione dispositivi
- [x] personalizzazione persistente icone dispositivi
- [x] personalizzazione persistente icone stanze
- [x] catalogo icone esteso con categoria Apple
- [ ] scene/script avanzati
- [ ] controlli media player completi
- [ ] ordinamento/configurazione stanze e accessori
- [ ] preferiti per utente o globali configurabili

### Fase 6 — UX wall display
Stato: baseline UI 2.0 completata

- [x] phone portrait e phone landscape
- [x] tablet/iPad portrait e landscape
- [x] desktop, wide e ultra-wide
- [x] header condiviso
- [x] page switch condiviso
- [x] sfondo/sfumature identici CALENDARIO/CASA
- [x] dark mode strutturalmente equivalente
- [x] scroll ownership esplicito
- [ ] modalità kiosk dedicata
- [ ] test fisici sistematici su più tablet 10–15"
- [ ] burn-in mitigation opzionale
- [ ] audit accessibilità/tastiera completo
- [ ] profiling Raspberry Pi / browser embedded

### Fase 7 — Release
Stato: **v2.0.0**

- [x] frontend type-check/build
- [x] bundle Home Assistant verificato in CI
- [x] HACS validation
- [x] Hassfest
- [x] versioni manifest/npm/lockfile allineate
- [x] documentazione principale aggiornata
- [x] changelog v2.0.0
- [x] workflow automatico tag + GitHub Release
- [ ] verifica end-to-end su installazione Home Assistant reale

### Prossimo focus

1. collegare dati reali `calendar.*` e `todo.*`;
2. completare integrazioni Google/Microsoft tramite Home Assistant/backend;
3. completare media player, scene/script e configurazione avanzata;
4. continuare a trattare V70/V74/V79 come baseline UI, salvo redesign esplicito.

---

## English

Current version: **v2.0.0**.

v2.0.0 is the main release that consolidates the **CALENDAR + HOME** UI contract. Both pages now share one responsive baseline from phone through ultra-wide displays; the next major focus returns to real data adapters and remaining Home Assistant functionality.

### Phase 0 — Foundations and standalone demo
Status: complete

- [x] React + TypeScript + Vite
- [x] standalone simulated Home Assistant demo
- [x] mouse/touch gestures and internal scrolling
- [x] automatic light/dark appearance + manual override
- [x] demo viewport classification from phone to xl/ultra
- [x] GitHub Pages
- [x] frontend type-check/build CI

### Phase 1 — Installable Home Assistant integration
Status: base implementation complete, real-install testing still to expand

- [x] `family_calendar` custom integration
- [x] single-instance config flow
- [x] full-screen custom panel
- [x] favorite persistence through Home Assistant Store
- [x] icon-override persistence through Home Assistant Store
- [x] custom WebSocket API for favorites and icons
- [x] compiled frontend bundle committed to the repository
- [x] aligned semantic versioning across manifest/npm/lockfile
- [ ] deeper manual HACS custom-repository installation testing
- [ ] verify panel reload/unload on a real installation
- [ ] evaluate a dedicated release ZIP in addition to HACS repository installs

### Phase 2 — Real calendars
Status: planned

- [ ] read `calendar.*` entities
- [ ] selectable visible calendars
- [ ] multi-source aggregation
- [ ] real all-day and multi-day events
- [ ] source colors
- [ ] timezone/localization
- [ ] loading/error/empty states

### Phase 3 — Google and Microsoft
Status: planned

- [ ] Google Calendar through Home Assistant
- [ ] Microsoft 365 / Outlook adapter
- [ ] no provider credentials in the frontend
- [ ] backend/config-entry source configuration

### Phase 4 — Real Todo and Shopping
Status: UI complete, data adapter planned

- [x] Todo/Shopping UI
- [x] add, complete and delete interactions
- [x] swipe-to-delete and internal scrolling
- [ ] discover `todo.*` entities
- [ ] real item read/write
- [ ] select Todo and Shopping entities
- [ ] realtime updates

### Phase 5 — Smart Home
Status: primary UI complete, advanced functions partial

- [x] rooms, favorites and Turn off all
- [x] lights, White Ambiance, covers and climate
- [x] passive sensors/entities
- [x] device-control overlays
- [x] V70 responsive HOME page
- [x] Open space composition and device navigation
- [x] persistent device icon customization
- [x] persistent room icon customization
- [x] expanded icon catalog with Apple category
- [ ] advanced scenes/scripts
- [ ] complete media-player controls
- [ ] room/accessory ordering and configuration
- [ ] configurable per-user/global favorites

### Phase 6 — Wall-display UX
Status: v2.0 UI baseline complete

- [x] phone portrait and landscape
- [x] tablet/iPad portrait and landscape
- [x] desktop, wide and ultra-wide
- [x] shared header
- [x] shared page switch
- [x] identical CALENDAR/HOME canvas and gradients
- [x] structurally equivalent dark mode
- [x] explicit scroll ownership
- [ ] dedicated kiosk mode
- [ ] systematic physical testing on multiple 10–15" tablets
- [ ] optional burn-in mitigation
- [ ] complete accessibility/keyboard audit
- [ ] Raspberry Pi / embedded-browser profiling

### Phase 7 — Release
Status: **v2.0.0**

- [x] frontend type-check/build
- [x] Home Assistant bundle verification
- [x] HACS validation
- [x] Hassfest
- [x] manifest/npm/lockfile version alignment
- [x] primary documentation updated
- [x] v2.0.0 changelog
- [x] automatic tag + GitHub Release workflow
- [ ] end-to-end verification on a real Home Assistant installation

### Next focus

1. connect real `calendar.*` and `todo.*` data;
2. complete Google/Microsoft integration through Home Assistant/backend;
3. complete media-player, scene/script and advanced configuration features;
4. preserve V70/V74/V79 as the UI baseline unless a redesign is explicitly requested.
