# Event Change Cascade Copilot

Der **Event Change Cascade Copilot** ist ein Interview-Demo-Prototyp fuer die strukturierte Verarbeitung kurzfristiger Event-Aenderungen. Die Anwendung zeigt, wie aus einer operativen Aenderung automatisch rollenbasierte Kommunikation fuer Teilnehmer, Speaker, Frontdesk und Ops entstehen kann.

## Problem

Kurzfristige Event-Aenderungen fuehren schnell zu uneinheitlicher Kommunikation: Teilnehmende brauchen klare Informationen, Speaker muessen anders gebrieft werden, Frontdesk und Ops benoetigen operative Hinweise. Der Copilot buendelt diesen Ablauf in einem nachvollziehbaren Workflow.

## Architektur

```text
Frontend -> n8n Webhook -> LLM -> structured JSON -> Frontend
```

Das Frontend sammelt Event-Daten, sendet sie an einen konfigurierten n8n Webhook und stellt die strukturierte JSON-Antwort wieder in der UI dar.

## Kernfunktionen

- Narrative Demo-Faelle fuer realistische Event-Szenarien
- Editierbare Event-Details vor dem Absenden
- Live-Vorschau des Event Payloads
- Rollenbasierte Kommunikation fuer Teilnehmer, Speaker, Frontdesk und Ops
- Dispatch Preview fuer moegliche Ausspielungskanaele
- Lokale Freigabe-Schicht pro Dispatch-Ziel
- Mock-Integrationen fuer Slack, E-Mail, Event-App und Digital Signage
- Verarbeitungslog zur Nachvollziehbarkeit des Ablaufs
- Feed der letzten verarbeiteten Aenderungen
- Loading- und Error-States fuer robuste Demo-Wirkung

## Warum keine automatische Ausspielung?

Kommunikation wird bewusst nicht automatisch versendet. Jede generierte Nachricht muss durch das Event-Team geprueft und freigegeben werden. Die Integrationen sind daher nur als Vorschau bzw. Registry dargestellt.

## Lokal starten

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

## Webhook konfigurieren

Die n8n Webhook URL wird in `.env.local` gesetzt:

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://example.n8n.cloud/webhook/event-change
```

Eine Vorlage liegt in `.env.local.example`.

## 5-Schritte-Demo-Skript

1. Oben einen Demo-Fall auswaehlen, z. B. **Speaker verspaetet**.
2. Die automatisch uebernommenen Event-Details im Formular kurz zeigen und bei Bedarf anpassen.
3. Den **Event Payload** als strukturierte Eingabe in den Workflow hervorheben.
4. **Kommunikation erzeugen** klicken und die rollenbasierten Ergebnisse erklaeren.
5. Dispatch Preview, Freigabe, Integrationen, Verarbeitungslog und letzte Aenderungen als operativen Kontrollfluss zeigen.

## Aktuelle Grenzen

- Prototyp fuer Demo- und Interview-Zwecke
- Keine Persistenz, kein LocalStorage, keine Datenbank
- n8n Workflow ist erforderlich und nicht Teil dieses Frontends
- Integrationen sind gemockt und senden keine Nachrichten
- Freigaben sind nur lokaler UI-State
