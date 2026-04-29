# Event Change Cascade Copilot

Ein System zur kontrollierten Generierung von Event-Kommunikation mit Validierung, Retry-Logik und manueller Freigabe.

## Überblick

Der **Event Change Cascade Copilot** ist ein Prototyp für Event-Operations-Teams.  
Er verarbeitet kurzfristige Änderungen im Live-Betrieb und erzeugt daraus rollenbasierte Kommunikation für Teilnehmer, Speaker, Frontdesk und Ops.

Das System nutzt ein LLM, vertraut dessen Ausgabe jedoch nicht blind.

Jede Antwort wird normalisiert, validiert und erst danach im Frontend angezeigt.  
Ungültige Ausgaben laufen einmal durch einen gezielten Retry.

Wenn auch dieser Versuch fehlschlägt, landet die Antwort in der manuellen Prüfung.

## Problem

Kurzfristige Änderungen erzeugen schnell uneinheitliche Kommunikation.  
Teilnehmer brauchen klare Orientierung, Speaker benötigen direkte Abstimmung.

Frontdesk und Ops müssen sofort wissen, was vor Ort zu tun ist.

Der Copilot macht aus einer strukturierten Änderung einen prüfbaren Kommunikationsentwurf für alle relevanten Rollen.

## Architektur

- Frontend → sammelt Event-Daten  
- n8n → orchestriert den Ablauf  
- LLM → generiert Kommunikation  
- Normalisierung → strukturiert Output  
- Validierung → prüft Qualität und Regeln  
- Entscheidung → deterministische Bewertung  
- Retry → gezielte Korrektur  
- Ausgabe → validiert oder manuelle Prüfung  

Details:

- Frontend sendet eine strukturierte Event-Änderung an den n8n Webhook.  
- n8n orchestriert den Ablauf.  
- LLM erzeugt rollenbasierte Kommunikation.  
- Normalisierung bringt die Antwort in ein einheitliches JSON-Format.  
- Validierung prüft Schema, Reason-Nutzung, verbotene Phrasen und generische Formulierungen.  
- Entscheidung bewertet, ob die Antwort verwendet werden kann.  
- Retry korrigiert ungültige Ausgaben einmal mit strengeren Regeln.  
- Ausgabe geht entweder als validierte Antwort an das Frontend oder in die manuelle Prüfung.  

Das `impact_level` klassifiziert die operative Relevanz der Änderung in niedrig, mittel oder hoch.

## Ablauf

1. Event-Input trifft im Frontend ein  
2. Frontend sendet an n8n  
3. LLM generiert Kommunikation  
4. Output wird normalisiert  
5. Validierung prüft Regeln  
6. Bei Fehler → Retry  
7. Retry wird erneut validiert  
8. Bei Fehler → manuelle Prüfung  
9. Bei Erfolg → Ausgabe  

## Validierungsstrategie

LLM-Ausgaben gelten nicht automatisch als korrekt.

Die Validierung erzwingt:

- korrektes JSON-Schema  
- konkrete Nutzung des Reason  
- klare, operative Sprache  
- keine verbotenen Phrasen  
- keine generischen Formulierungen  
- keine generischen Platzhaltertexte  
- keine erfundenen Daten (z. B. Zeiten, Orte, Personen)  

Generische Formulierungen werden abgelehnt.  
Fehlende Reason-Nutzung wird abgelehnt.  
Platzhaltertexte werden abgelehnt.

Der Retry-Layer arbeitet strenger als die erste Generierung und versucht genau eine gezielte Korrektur.

Die finale Entscheidung basiert auf deterministischen Validierungsregeln.

## Beispiel: Systemverhalten

**Szenario:** Speaker verspätet sich

**Erste Generierung:**
- zu generisch formuliert  
- Reason nicht konkret genutzt  
- nächste Schritte unklar  

**Validierung:**
- erkennt fehlende Reason-Nutzung  
- erkennt generische Formulierungen  
- lehnt Ausgabe ab  

**Retry:**
- erhält konkrete Fehler  
- erzwingt präzisere Formulierung  

**Ergebnis:**
- Reason wird konkret verwendet  
- klare Zeitangabe enthalten  
- nächste Schritte sind operativ nutzbar 

## Design-Entscheidung

Der Prototyp trennt Generierung, Validierung und Freigabe bewusst voneinander.  
Das macht sichtbar, dass das LLM nur ein Teil des Systems ist.

Die Qualität entsteht durch kontrollierte Verarbeitung, klare Regeln und eine manuelle Fallback-Stufe.

## Warum keine direkte Ausspielung?

Integrationen sind bewusst deaktiviert, weil zuerst die Kommunikationsqualität gesichert werden soll.  
Nachrichten werden nicht automatisch verschickt.

Das Event-Team prüft und gibt jede vorbereitete Kommunikation frei.

Die gezeigten Kanäle wie Slack, E-Mail, Event-App und Digital Signage sind Mock-Integrationen.  
Sie zeigen mögliche Ausspielungskanäle, senden aber keine Nachrichten.

## Demo-Workflow

Der folgende Workflow zeigt die Verarbeitung einer Event-Änderung im n8n-System:

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
`http://localhost:3000`

## Webhook konfigurieren

Die n8n Webhook URL wird in `.env.local` gesetzt:
`NEXT_PUBLIC_N8N_WEBHOOK_URL=https://example.n8n.cloud/webhook/event-change`

Eine Vorlage liegt in .env.local.example.

## Demo-Ablauf

1. Oben einen Demo-Fall auswählen, zum Beispiel Speaker verspätet
2. Die übernommenen Event-Details im Formular prüfen und bei Bedarf anpassen
3. Den Event Payload als strukturierte Eingabe in den Workflow zeigen
4. Texte vorbereiten klicken und die rollenbasierten Ergebnisse erklären
5. Dispatch Preview, Freigabe, Integrationen, Ablauf im Hintergrund und zuletzt vorbereitete Fälle zeigen

## Aktuelle Grenzen

- Prototyp für Demo- und Interview
- Keine Persistenz, kein LocalStorage, keine Datenbank
- n8n Workflow ist erforderlich und nicht Teil dieses Frontends
- Integrationen sind gemockt und senden keine Nachrichten
- Freigaben sind nur lokaler UI-State
