# Event Change Cascade Copilot

## Überblick

Der **Event Change Cascade Copilot** ist ein Prototyp für Event-Operations-Teams. Er verarbeitet kurzfristige Änderungen im Live-Betrieb und erzeugt daraus rollenbasierte Kommunikation für Teilnehmer, Speaker, Frontdesk und Ops.

Das System nutzt ein LLM, vertraut dessen Ausgabe aber nicht blind. Jede Antwort wird normalisiert, validiert und erst danach im Frontend angezeigt. Ungültige Ausgaben laufen einmal durch einen gezielten Retry. Wenn auch dieser Versuch fehlschlägt, landet die Antwort in der manuellen Prüfung.

## Problem

Kurzfristige Änderungen erzeugen schnell uneinheitliche Kommunikation. Teilnehmer brauchen klare Orientierung, Speaker benötigen direkte Abstimmung, Frontdesk und Ops müssen sofort wissen, was vor Ort zu tun ist.

Der Copilot macht aus einer strukturierten Änderung einen prüfbaren Kommunikationsentwurf für alle relevanten Rollen.

## Architektur

```text
Frontend → n8n → LLM → Normalisierung → Validierung → Entscheidung → Retry → Ausgabe
```

- **Frontend** sendet eine strukturierte Event-Änderung an den n8n Webhook.
- **n8n** orchestriert den Ablauf.
- **LLM** erzeugt rollenbasierte Kommunikation.
- **Normalisierung** bringt die Antwort in ein einheitliches JSON-Format.
- **Validierung** prüft Schema, Reason-Nutzung, verbotene Phrasen und generische Formulierungen.
- **Entscheidung** bewertet, ob die Antwort verwendet werden kann.
- **Retry** korrigiert ungültige Ausgaben einmal mit strengeren Regeln.
- **Ausgabe** geht entweder als validierte Antwort an das Frontend oder in die manuelle Prüfung.

## Ablauf

1. Event-Input trifft im Frontend ein.
2. Das Frontend sendet die Änderung an n8n.
3. Das LLM generiert rollenbasierte Kommunikation.
4. Die Antwort wird normalisiert.
5. Die Validierung prüft Qualität, Regeln und JSON-Struktur.
6. Bei ungültiger Antwort startet ein gezielter Retry.
7. Die Retry-Antwort wird erneut validiert.
8. Bei weiterhin ungültiger Antwort ist manuelle Prüfung erforderlich.
9. Bei valider Antwort erhält das Frontend die strukturierte Kommunikation.

## Validierungsstrategie

LLM-Ausgaben gelten nicht automatisch als korrekt. Die Validierung erzwingt:

- korrektes JSON-Schema
- konkrete Nutzung des angegebenen Grundes
- klare, operative Sprache
- keine verbotenen Phrasen
- keine generischen Platzhalter
- keine erfundenen Zeiten, Orte oder Personen

Generische Formulierungen werden abgelehnt. Fehlende Reason-Nutzung wird abgelehnt. Platzhaltertexte werden abgelehnt. Der Retry-Layer arbeitet strenger als die erste Generierung und versucht genau eine gezielte Korrektur.

## Design-Entscheidung

Der Prototyp trennt Generierung, Validierung und Freigabe bewusst voneinander. Das macht sichtbar, dass das LLM nur ein Teil des Systems ist. Die Qualität entsteht durch kontrollierte Verarbeitung, klare Regeln und eine manuelle Fallback-Stufe.

## Warum keine direkte Ausspielung?

Integrationen sind bewusst deaktiviert, weil zuerst die Kommunikationsqualität gesichert werden soll. Nachrichten werden nicht automatisch verschickt. Das Event-Team prüft und gibt jede vorbereitete Kommunikation frei.

Die gezeigten Kanäle wie Slack, E-Mail, Event-App und Digital Signage sind Mock-Integrationen. Sie zeigen mögliche Ausspielungskanäle, senden aber keine Nachrichten.

## Demo-Workflow

![Workflow](./demo%20workflow.jpg)

## Funktionsumfang

- Narrative Demo-Fälle für realistische Event-Szenarien
- Editierbare Event-Details vor dem Absenden
- Live-Vorschau des Event Payloads
- Rollenbasierte Kommunikation für Teilnehmer, Speaker, Frontdesk und Ops
- Dispatch Preview für mögliche Ausspielungskanäle
- Lokale Freigabe-Schicht pro Dispatch-Ziel
- Mock-Integrationen für Slack, E-Mail, Event-App und Digital Signage
- Ablauf im Hintergrund mit Validierung, Retry und manueller Prüfung
- Feed der zuletzt vorbereiteten Fälle
- Loading-, Error- und Review-States für Interview-Debugging

## Lokal starten

```bash
npm install
npm run dev
npm run build
```

Die App läuft lokal unter:

```text
http://localhost:3000
```

## Webhook konfigurieren

Die n8n Webhook URL wird in `.env.local` gesetzt:

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://example.n8n.cloud/webhook/event-change
```

Eine Vorlage liegt in `.env.local.example`.

## Demo-Ablauf

1. Oben einen Demo-Fall auswählen, zum Beispiel **Speaker verspätet**.
2. Die übernommenen Event-Details im Formular prüfen und bei Bedarf anpassen.
3. Den **Event Payload** als strukturierte Eingabe in den Workflow zeigen.
4. **Texte vorbereiten** klicken und die rollenbasierten Ergebnisse erklären.
5. Dispatch Preview, Freigabe, Integrationen, Ablauf im Hintergrund und zuletzt vorbereitete Fälle zeigen.

## Aktuelle Grenzen

- Prototyp für Demo- und Interview-Zwecke
- Keine Persistenz, kein LocalStorage, keine Datenbank
- n8n Workflow ist erforderlich und nicht Teil dieses Frontends
- Integrationen sind gemockt und senden keine Nachrichten
- Freigaben sind nur lokaler UI-State
