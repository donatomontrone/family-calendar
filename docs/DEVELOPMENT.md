# Development

> 🇮🇹 La documentazione italiana è riportata per prima. La versione inglese segue dopo la separazione.

---

# 🇮🇹 Italiano

## Requisiti

- Node.js 22+
- npm
- Home Assistant per i test dell'integrazione

## Frontend demo

Dalla root:

```bash
npm install
npm run dev
```

Il frontend usa `src/dev.tsx` per simulare l'oggetto `hass` normalmente fornito da Home Assistant.

Questo permette di sviluppare la UI senza eseguire Home Assistant.

## Build

```bash
npm run build
```

Il processo verifica TypeScript, compila React e copia il bundle in:

```text
custom_components/family_calendar/frontend/
```

## Test HACS

Aggiungere temporaneamente la repository in HACS come:

```text
Custom repository
Type: Integration
```

## Test Home Assistant

Dopo l'installazione:

```text
Impostazioni
→ Dispositivi e servizi
→ Aggiungi integrazione
→ Family Calendar
```

## Architettura

```text
React / TypeScript
       │
       ▼
Home Assistant Frontend API
       │
       ├── States
       ├── Services
       ├── WebSocket
       ├── Areas
       └── Calendar / Todo
```

---

# 🇬🇧 English

## Requirements

- Node.js 22+
- npm
- Home Assistant for integration testing

## Frontend demo

From the repository root:

```bash
npm install
npm run dev
```

The frontend uses `src/dev.tsx` to mock the `hass` object normally provided by Home Assistant.

This allows UI development without running Home Assistant.

## Build

```bash
npm run build
```

The process type-checks TypeScript, builds React, and copies the bundle to:

```text
custom_components/family_calendar/frontend/
```

## HACS testing

Temporarily add the repository to HACS as:

```text
Custom repository
Type: Integration
```

## Home Assistant testing

After installation:

```text
Settings
→ Devices & services
→ Add Integration
→ Family Calendar
```

## Architecture

```text
React / TypeScript
       │
       ▼
Home Assistant Frontend API
       │
       ├── States
       ├── Services
       ├── WebSocket
       ├── Areas
       └── Calendar / Todo
```
