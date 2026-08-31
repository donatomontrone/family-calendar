## Family Calendar

**Family Calendar** è un pannello dedicato di Home Assistant per creare un calendario digitale separato dalle dashboard standard di Home Assistant.

L'interfaccia riunisce calendario, prossimi appuntamenti, Promemoria, lista della spesa, dispositivi domotici preferiti e selezione delle stanze in un'unica schermata pensata soprattutto per tablet e display touch.

### Stato del progetto

Il progetto è attualmente in fase **Alpha / sviluppo iniziale**.

Lo starter include:
- pannello full-screen per Home Assistant;
- frontend React + TypeScript;
- calendario e agenda;
- Todo / Shopping List;
- selezione delle stanze;
- entità preferite;
- persistenza dei preferiti tramite WebSocket Home Assistant;
- modalità demo eseguibile dal browser;
- struttura compatibile con HACS;
- workflow GitHub per HACS validation e Hassfest.

Gli eventi del calendario sono ancora dimostrativi. Google Calendar e Microsoft 365 verranno integrati nelle fasi successive.

## Installazione tramite HACS

Durante lo sviluppo è possibile aggiungere la repository a HACS come **Custom Repository** di tipo **Integration**.

Dopo l'installazione:
1. riavvia Home Assistant se richiesto;
2. vai in **Impostazioni → Dispositivi e servizi**;
3. aggiungi **Family Calendar**;
4. apri **Calendario** dalla barra laterale.

## Sviluppo frontend

Requisiti:
- Node.js 22+
- npm

Dalla root della repository:

```bash
npm install
npm run dev
```

La modalità demo simula Home Assistant e permette di provare stanze, entità, preferiti e interazioni senza avere HA in esecuzione.

Per creare il bundle usato da Home Assistant:

```bash
npm run build
```

Il bundle viene copiato in:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

## Struttura

```text
custom_components/family_calendar/   Home Assistant integration
src/                                 React / TypeScript frontend
.github/workflows/                   GitHub Actions
hacs.json                            HACS metadata
```

## Roadmap

1. calendario reale tramite Home Assistant;
2. Google Calendar;
3. Microsoft 365 / Outlook;
4. Todo di Home Assistant;
5. lista della spesa;
6. sincronizzazione e gestione eventi;
7. configurazione delle sorgenti calendario;
8. impostazioni UI;
9. ottimizzazione touch;
10. release stabile HACS.

_Sviluppato in VibeCoding con ChatGPT_

---

## Family Calendar

**Family Calendar** is a dedicated Home Assistant panel for a digital calendar, separate from the standard Home Assistant dashboards.

The interface brings together calendars, upcoming appointments, to do list, shopping lists, favorite smart-home devices, and room selection in one screen designed especially for tablets and touch displays.

### Project status

The project is currently in the **Alpha / early development** stage.

The starter includes:
- full-screen Home Assistant panel;
- React + TypeScript frontend;
- calendar and agenda;
- Todo / Shopping List;
- room selection;
- favorite entities;
- persistent favorites through the Home Assistant WebSocket API;
- browser-based demo mode;
- HACS-compatible repository structure;
- GitHub workflows for HACS validation and Hassfest.

Calendar events are still demo data. Google Calendar and Microsoft 365 will be integrated in later stages.

## HACS installation

During development, add the repository to HACS as a **Custom Repository** of type **Integration**.

After installation:
1. restart Home Assistant if requested;
2. go to **Settings → Devices & services**;
3. add **Family Calendar**;
4. open **Calendario** from the sidebar.

## Frontend development

Requirements:
- Node.js 22+
- npm

From the repository root:

```bash
npm install
npm run dev
```

Demo mode mocks Home Assistant and lets you test rooms, entities, favorites, and interactions without running HA.

To build the bundle used by Home Assistant:

```bash
npm run build
```

The bundle is copied to:

```text
custom_components/family_calendar/frontend/family-calendar-panel.js
```

## Structure

```text
custom_components/family_calendar/   Home Assistant integration
src/                                 React / TypeScript frontend
.github/workflows/                   GitHub Actions
hacs.json                            HACS metadata
```

## Roadmap

1. real calendar data through Home Assistant;
2. Google Calendar;
3. Microsoft 365 / Outlook;
4. Home Assistant Todo;
5. shopping list;
6. event synchronization and management;
7. calendar source configuration;
8. UI settings;
9. touch optimization;
10. stable HACS release.

_Developed using VibeCoding with Claude/ChatGPT_


