# Event Change Cascade Copilot

## What this is

This project is a deterministic Event Operations Copilot that generates role-based communication for live event changes using an LLM, but with strict validation, retry logic, and manual fallback to ensure output quality.

## Problem

Kurzfristige Event-Aenderungen fuehren schnell zu uneinheitlicher Kommunikation. Teilnehmende brauchen klare Informationen, Speaker muessen anders gebrieft werden, Frontdesk und Ops benoetigen konkrete Handlungsanweisungen.

Der Copilot wandelt eine strukturierte Aenderung in gepruefte Kommunikation fuer alle relevanten Rollen um.

## System Architecture

```text
Frontend -> n8n Webhook -> LLM -> Validation Layer -> Retry Layer -> structured JSON -> Frontend
```

- **Frontend** sendet eine strukturierte Event-Aenderung.
- **n8n** orchestriert den Ablauf.
- **LLM** generiert rollenbasierte Kommunikation.
- **Validation Layer** prueft Schema, Reason-Nutzung, verbotene Phrasen und generische Formulierungen.
- **Retry Layer** regeneriert fehlerhafte Outputs mit strengeren Regeln.
- **Manual Review** greift als Fallback, wenn auch der Retry nicht valide ist.

## Processing Flow

1. Event Input received
2. LLM generates communication
3. Output is normalized
4. Validation checks quality and rules
5. If invalid -> Retry with stricter prompt
6. Retry is validated again
7. If still invalid -> Manual Review required
8. If valid -> Structured response returned

## Validation Strategy

LLM output is **not trusted by default**.

Validation enforces:

- correctness
- clarity
- operational usability
- concrete use of the provided reason
- valid structured JSON

Generic wording is rejected. Missing reason usage is rejected. Placeholder text is rejected. The retry layer applies stricter rules than the initial generation path.

## Demo Workflow

![Workflow](./demo%20workflow.jpg)

## Core Features

- Narrative Demo-Faelle fuer realistische Event-Szenarien
- Editierbare Event-Details vor dem Absenden
- Live-Vorschau des Event Payloads
- Rollenbasierte Kommunikation fuer Teilnehmer, Speaker, Frontdesk und Ops
- Dispatch Preview fuer moegliche Ausspielungskanaele
- Lokale Freigabe-Schicht pro Dispatch-Ziel
- Mock-Integrationen fuer Slack, E-Mail, Event-App und Digital Signage
- Verarbeitungslog mit Validation-, Retry- und Manual-Review-Signalen
- Feed der zuletzt vorbereiteten Faelle
- Loading-, Error- und Review-States fuer Interview-Debugging

## Demo Mode

This demo shows how real-time event changes can be transformed into structured communication with validation and fallback logic.

## Why no automatic sending?

Kommunikation wird bewusst nicht automatisch versendet. Jede generierte Nachricht muss durch das Event-Team geprueft und freigegeben werden. Integrationen sind in dieser Demo nur als Vorschau bzw. Registry dargestellt.

## Run locally

```bash
npm install
npm run dev
```

Die App laeuft danach lokal unter:

```text
http://localhost:3000
```

Fuer einen Produktions-Build:

```bash
npm run build
```

## Webhook configuration

Die n8n Webhook URL wird in `.env.local` gesetzt:

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://example.n8n.cloud/webhook/event-change
```

Eine Vorlage liegt in `.env.local.example`.

## 5-step demo script

1. Oben einen Demo-Fall auswaehlen, z. B. **Speaker verspaetet**.
2. Die uebernommenen Event-Details im Formular pruefen und bei Bedarf anpassen.
3. Den **Event Payload** als strukturierte Eingabe in den Workflow zeigen.
4. **Texte vorbereiten** klicken und die rollenbasierten Ergebnisse erklaeren.
5. Dispatch Preview, Freigabe, Integrationen, Ablauf im Hintergrund und zuletzt vorbereitete Faelle zeigen.

## Current limitations

- Prototyp fuer Demo- und Interview-Zwecke
- Keine Persistenz, kein LocalStorage, keine Datenbank
- n8n Workflow ist erforderlich und nicht Teil dieses Frontends
- Integrationen sind gemockt und senden keine Nachrichten
- Freigaben sind nur lokaler UI-State
