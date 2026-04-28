"use client";

import { FormEvent, useMemo, useState } from "react";

const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? "";
const affectedGroups = ["attendees", "speaker", "frontdesk", "ops"];

type FormState = {
  change_type: string;
  event_name: string;
  session_title: string;
  old_time: string;
  new_time: string;
  location: string;
  reason: string;
};

type CascadeResponse = {
  teilnehmer_nachricht?: unknown;
  speaker_nachricht?: unknown;
  frontdesk_notiz?: unknown;
  ops_briefing?: unknown;
  auswirkung?: unknown;
  naechste_schritte?: unknown;
  impact_level?: unknown;
  _errors?: unknown;
  _valid?: unknown;
};

type HistoryItem = FormState & {
  auswirkung_summary?: string;
  impact_level?: unknown;
  processed_at: string;
};

const changeTypeOptions = [
  { value: "time_change", label: "Zeitänderung" },
  { value: "location_change", label: "Ortsänderung" },
  { value: "speaker_delay", label: "Speaker verspätet" },
  { value: "session_cancelled", label: "Session fällt aus" },
  { value: "capacity_issue", label: "Kapazitätsproblem" }
];

const changeTypeHelperText: Record<string, string> = {
  time_change: "Fokus: geänderte Startzeit",
  location_change: "Fokus: neuer oder betroffener Ort",
  speaker_delay: "Fokus: Verzögerung durch Speaker",
  session_cancelled: "Fokus: Ausfall und Orientierung",
  capacity_issue: "Fokus: Kapazität, Zugang und Steuerung vor Ort"
};

const demoDefaultsByChangeType: Record<
  string,
  Pick<FormState, "session_title" | "location" | "reason"> &
    Partial<Pick<FormState, "old_time" | "new_time">>
> = {
  time_change: {
    session_title: "Zuverlässige Automatisierung im Eventbetrieb",
    location: "Hauptbühne",
    old_time: "2026-05-12T10:00",
    new_time: "2026-05-12T11:00",
    reason: "Verspätete Anreise des Speakers"
  },
  speaker_delay: {
    session_title: "Zuverlässige Automatisierung im Eventbetrieb",
    location: "Hauptbühne",
    old_time: "2026-05-12T10:00",
    new_time: "2026-05-12T10:30",
    reason: "Speaker ist verspätet auf dem Weg zur Venue"
  },
  location_change: {
    session_title: "Zuverlässige Automatisierung im Eventbetrieb",
    location: "Raum B",
    reason: "Technisches Problem auf der Hauptbühne"
  },
  session_cancelled: {
    session_title: "Zuverlässige Automatisierung im Eventbetrieb",
    location: "Hauptbühne",
    reason:
      "Session muss kurzfristig ausfallen, da der Speaker nicht eintreffen kann"
  },
  capacity_issue: {
    session_title: "Zuverlässige Automatisierung im Eventbetrieb",
    location: "Hauptbühne",
    reason: "Raum überfüllt, maximale Teilnehmerzahl erreicht"
  }
};

const initialForm: FormState = {
  change_type: "time_change",
  event_name: "KI Produktgipfel",
  session_title: "Zuverlässige Automatisierung im Eventbetrieb",
  old_time: "2026-05-12T10:00",
  new_time: "2026-05-12T11:00",
  location: "Hauptbühne",
  reason: "Verspätete Anreise des Speakers"
};

const demoPresets: Array<{
  label: string;
  summary: string;
  impactHint: string;
  values: FormState;
}> = [
  {
    label: "Speaker verspätet",
    summary:
      "Ein Speaker kommt später an und die Session muss kurzfristig nach hinten geschoben werden.",
    impactHint: "Mittlerer Impact: Zeitplan und Erwartungsmanagement betroffen.",
    values: {
      change_type: "speaker_delay",
      event_name: "KI Produktgipfel",
      session_title: "Agentic Workflows im Messebetrieb",
      old_time: "2026-05-12T10:00",
      new_time: "2026-05-12T10:30",
      location: "Hauptbühne",
      reason: "Der Speaker steckt im Transfer vom Flughafen fest."
    }
  },
  {
    label: "Raumwechsel",
    summary:
      "Eine Session muss in einen anderen Raum verlegt werden, damit der Ablauf stabil bleibt.",
    impactHint: "Mittlerer Impact: Orientierung vor Ort und App-Hinweise wichtig.",
    values: {
      change_type: "location_change",
      event_name: "KI Produktgipfel",
      session_title: "Hands-on: Automatisierung mit n8n",
      old_time: "2026-05-12T14:00",
      new_time: "2026-05-12T14:00",
      location: "Raum C statt Raum B",
      reason: "Im ursprünglichen Raum ist die Präsentationstechnik ausgefallen."
    }
  },
  {
    label: "Session fällt aus",
    summary:
      "Eine geplante Session kann nicht stattfinden und braucht klare Alternativkommunikation.",
    impactHint: "Hoher Impact: Teilnehmer, Speaker und Ops brauchen sofortige Klarheit.",
    values: {
      change_type: "session_cancelled",
      event_name: "KI Produktgipfel",
      session_title: "Panel: Responsible AI in der Praxis",
      old_time: "",
      new_time: "",
      location: "Forum 2",
      reason: "Mehrere Panelgäste mussten kurzfristig absagen."
    }
  },
  {
    label: "Kapazitätsproblem",
    summary:
      "Ein Raum ist voll, während weitere Gäste eintreffen und gesteuert werden müssen.",
    impactHint: "Hoher Impact: Frontdesk und Ops müssen Besucherströme steuern.",
    values: {
      change_type: "capacity_issue",
      event_name: "KI Produktgipfel",
      session_title: "Live-Demo: Voice Agents im Support",
      old_time: "",
      new_time: "",
      location: "Workshopraum A",
      reason: "Der Raum ist überfüllt und es warten weitere Gäste am Eingang."
    }
  }
];

const responseCards: Array<{ key: keyof CascadeResponse; label: string }> = [
  { key: "teilnehmer_nachricht", label: "Nachricht an Teilnehmer" },
  { key: "speaker_nachricht", label: "Nachricht an Speaker" },
  { key: "frontdesk_notiz", label: "Hinweis für Frontdesk" },
  { key: "ops_briefing", label: "Ops-Briefing" },
  { key: "auswirkung", label: "Auswirkung" },
  { key: "naechste_schritte", label: "Nächste Schritte" }
];

const processingLogSteps = [
  "Änderung empfangen",
  "Änderungstyp erkannt",
  "Rollenkommunikation generiert",
  "Antwort an Oberfläche zurückgegeben"
];

const integrationRows = [
  { name: "Slack", status: "geplant", purpose: "Team-Updates" },
  { name: "E-Mail", status: "geplant", purpose: "freigegebene Teilnehmerinfos" },
  { name: "Event-App", status: "geplant", purpose: "In-App Hinweise" },
  { name: "Digital Signage", status: "optional", purpose: "Vor-Ort Anzeigen" }
];

function renderValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "Noch nichts vorbereitet.";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function renderOneLineSummary(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "Keine Auswirkung zurückgegeben.";
  }

  const summary = typeof value === "string" ? value : JSON.stringify(value);

  return summary.replace(/\s+/g, " ").trim();
}

function getValidationErrors(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => renderValue(item)).filter(Boolean);
}

function getChangeTypeLabel(value: string) {
  return changeTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function getImpactLabel(value: unknown) {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";

  if (normalized === "low" || normalized === "niedrig") {
    return "niedrig";
  }

  if (normalized === "medium" || normalized === "mittel") {
    return "mittel";
  }

  if (normalized === "high" || normalized === "hoch") {
    return "hoch";
  }

  return "unbekannt";
}

function getNextSteps(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => renderValue(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (Array.isArray(parsed)) {
        return parsed.map((item) => renderValue(item));
      }
    } catch {
      // Plain text is handled below.
    }

    return value
      .split(/\r?\n|;/)
      .map((item) => item.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  if (value === undefined || value === null || value === "") {
    return ["Noch nichts vorbereitet."];
  }

  return [renderValue(value)];
}

function shouldIncludeTimeFields(changeType: string) {
  return !["capacity_issue", "session_cancelled"].includes(changeType);
}

function buildPayload(formState: FormState) {
  const shouldSendTimes = shouldIncludeTimeFields(formState.change_type);
  const entries = Object.entries(formState).filter(([key, value]) => {
    if (!shouldSendTimes && (key === "old_time" || key === "new_time")) {
      return false;
    }

    return value.trim() !== "";
  });

  return {
    ...Object.fromEntries(entries),
    affected_groups: affectedGroups
  };
}

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [response, setResponse] = useState<CascadeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dispatchApprovals, setDispatchApprovals] = useState<
    Record<string, boolean>
  >({});
  const [selectedScenarioLabel, setSelectedScenarioLabel] = useState("");

  const payload = useMemo(() => buildPayload(form), [form]);
  const showTimeFields = shouldIncludeTimeFields(form.change_type);
  const selectedScenario =
    demoPresets.find((preset) => preset.label === selectedScenarioLabel) ?? null;
  const outputStatus = isLoading
    ? "Texte werden vorbereitet"
    : error
      ? "Konnte nicht vorbereitet werden"
      : response
        ? "Texte vorbereitet"
        : "Bereit für den nächsten Fall";

  const dispatchTargets = response
    ? [
        {
          title: "Teilnehmer-Kommunikation",
          source: "teilnehmer_nachricht",
          preview: renderValue(response.teilnehmer_nachricht)
        },
        {
          title: "Speaker-Kommunikation",
          source: "speaker_nachricht",
          preview: renderValue(response.speaker_nachricht)
        },
        {
          title: "Vor-Ort-Team / Frontdesk",
          source: "frontdesk_notiz + ops_briefing",
          preview: [
            renderValue(response.frontdesk_notiz),
            renderValue(response.ops_briefing)
          ].join("\n\n")
        }
      ]
    : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setValidationErrors([]);

    try {
      const result = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseText = await result.text();
      let data: CascadeResponse;

      try {
        data = JSON.parse(responseText) as CascadeResponse;
      } catch {
        throw new Error(
          [
            "Backend returned non-JSON response",
            `Status: ${result.status}`,
            `URL: ${result.url}`,
            responseText.slice(0, 300)
          ].join("\n")
        );
      }

      if (!result.ok) {
        throw new Error(
          [
            `Webhook hat Status ${result.status} zurückgegeben`,
            `URL: ${result.url}`
          ].join("\n")
        );
      }

      setValidationErrors(getValidationErrors(data._errors));
      setResponse(data);
      setDispatchApprovals({});
      setHistory((current) =>
        [
          {
            ...form,
            old_time: shouldIncludeTimeFields(form.change_type)
              ? form.old_time
              : "",
            new_time: shouldIncludeTimeFields(form.change_type)
              ? form.new_time
              : "",
            auswirkung_summary: renderOneLineSummary(data.auswirkung),
            impact_level: data.impact_level,
            processed_at: "gerade eben"
          },
          ...current
        ].slice(0, 5)
      );
    } catch {
      setValidationErrors([]);
      setError("Die Änderung konnte nicht verarbeitet werden. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateChangeType(changeType: string) {
    const defaults = demoDefaultsByChangeType[changeType];

    setForm((current) => ({
      ...current,
      change_type: changeType,
      session_title: defaults.session_title,
      location: defaults.location,
      reason: defaults.reason,
      old_time: defaults.old_time ?? "",
      new_time: defaults.new_time ?? ""
    }));
    setResponse(null);
    setError("");
    setValidationErrors([]);
    setDispatchApprovals({});
    setSelectedScenarioLabel("");
  }

  function applyDemoPreset(preset: FormState, label = "") {
    setForm(preset);
    setResponse(null);
    setError("");
    setValidationErrors([]);
    setDispatchApprovals({});
    setSelectedScenarioLabel(label);
  }

  function approveDispatchTarget(targetTitle: string) {
    setDispatchApprovals((current) => ({
      ...current,
      [targetTitle]: true
    }));
  }

  return (
    <main className="page-shell">
      <section className="intro">
        <div className="intro-meta">
          <p className="eyebrow">Interview-Demo</p>
          <span className="demo-badge">Demo-Modus</span>
        </div>
        <h1>Event Change Cascade Copilot</h1>
        <p>
          Wenn sich vor Ort etwas ändert, erstellt der Copilot sofort klare
          Texte für Teilnehmer, Speaker, Frontdesk und Ops.
        </p>
      </section>

      <section className="narrative-demo">
        <div className="narrative-copy">
          <h2>Ein Plan ändert sich. Wer muss was wissen?</h2>
          <p>
            Wähle einen echten Event-Fall. Der Copilot macht daraus
            verständliche Kommunikation für alle betroffenen Rollen.
          </p>
          <div className="scenario-buttons">
            {demoPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyDemoPreset(preset.values, preset.label)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <article className="scenario-summary">
          <span>Aktueller Demo-Fall</span>
          <h3>{selectedScenario?.label ?? "Situation auswählen"}</h3>
          <p>
            {selectedScenario?.summary ??
              "Wähle einen Demo-Fall, um die Formulardaten für eine realistische Änderung vorzubereiten."}
          </p>
          <dl>
            <div>
              <dt>Session</dt>
              <dd>{form.session_title}</dd>
            </div>
            {form.old_time || form.new_time ? (
              <div>
                <dt>Zeit</dt>
                <dd>
                  {form.old_time || "offen"} → {form.new_time || "offen"}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Ort</dt>
              <dd>{form.location || "offen"}</dd>
            </div>
          </dl>
          <small>
            {selectedScenario?.impactHint ??
              "Impact-Hinweis erscheint nach Auswahl eines Demo-Falls."}
          </small>
        </article>
      </section>

      <section className="workspace">
        <div className="input-column">
          <form className="panel form-panel" onSubmit={handleSubmit}>
            <div className="panel-header">
              <h2>Änderung prüfen</h2>
              <span>POST an n8n Webhook</span>
            </div>

            <p className="form-hint">
              Die Details kommen aus dem gewählten Fall. Du kannst sie vor dem
              Erzeugen anpassen.
            </p>

            <div className="field-grid">
              <label>
                <span>Änderungstyp</span>
                <select
                  value={form.change_type}
                  onChange={(event) =>
                    updateChangeType(event.target.value)
                  }
                >
                  {changeTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small className="field-helper">
                  {changeTypeHelperText[form.change_type]}
                </small>
              </label>

              <label>
                <span>Event-Name</span>
                <input
                  value={form.event_name}
                  onChange={(event) =>
                    updateField("event_name", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Session-Titel</span>
                <input
                  value={form.session_title}
                  onChange={(event) =>
                    updateField("session_title", event.target.value)
                  }
                />
              </label>

              {showTimeFields ? (
                <>
                  <label>
                    <span>Alte Zeit</span>
                    <input
                      type="datetime-local"
                      value={form.old_time}
                      onChange={(event) =>
                        updateField("old_time", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Neue Zeit</span>
                    <input
                      type="datetime-local"
                      value={form.new_time}
                      onChange={(event) =>
                        updateField("new_time", event.target.value)
                      }
                    />
                  </label>
                </>
              ) : null}

              <label>
                <span>Ort / betroffener Bereich</span>
                <input
                  value={form.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                />
              </label>
            </div>

            <label>
              <span>Grund</span>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(event) => updateField("reason", event.target.value)}
              />
            </label>

            <div className="affected-groups">
              {affectedGroups.map((group) => (
                <span key={group}>{group}</span>
              ))}
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Texte werden vorbereitet..." : "Texte vorbereiten"}
            </button>
          </form>

          <section className="panel payload-panel">
            <div className="panel-header">
              <h2>Event Payload</h2>
              <span>Technische Ansicht dessen, was an n8n gesendet wird.</span>
            </div>
            <pre>{JSON.stringify(payload, null, 2)}</pre>
          </section>

          <section className="panel history-panel">
            <div className="panel-header">
              <h2>Zuletzt vorbereitete Fälle</h2>
              <span>Letzte 5</span>
            </div>

            {history.length === 0 ? (
              <p className="empty-state">Noch keine Änderungen verarbeitet.</p>
            ) : (
              <div className="history-list">
                {history.map((item, index) => (
                  <article
                    className="history-item"
                    key={`${item.session_title}-${index}`}
                  >
                    <div className="history-item-header">
                      <strong>{item.event_name}</strong>
                      <span
                        className={`impact-badge impact-${getImpactLabel(
                          item.impact_level
                        )}`}
                      >
                        {getImpactLabel(item.impact_level)}
                      </span>
                    </div>
                    <small>{getChangeTypeLabel(item.change_type)}</small>
                    <p>{item.auswirkung_summary}</p>
                    <small>{item.processed_at}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="results" aria-live="polite">
          <div className="panel-header results-header">
            <div>
              <div className="response-title-row">
                <h2>Vorbereitete Kommunikation</h2>
                <span
                  className={`impact-badge impact-${getImpactLabel(
                    response?.impact_level
                  )}`}
                >
                  {getImpactLabel(response?.impact_level)}
                </span>
              </div>
              <p className="workflow-status">
                Aus einer Änderung werden klare Nachrichten für jede Rolle.
              </p>
            </div>
            <span>{outputStatus}</span>
          </div>

          {error ? <p className="error output-error">{error}</p> : null}

          {validationErrors.length > 0 ? (
            <section className="review-box">
              <h3>Manuelle Prüfung erforderlich</h3>
              <ul>
                {validationErrors.map((validationError, index) => (
                  <li key={`${validationError}-${index}`}>
                    {validationError}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="card-grid">
            {responseCards.map((card) => (
              <article className="response-card" key={card.key}>
                <h3>{card.label}</h3>
                {card.key === "naechste_schritte" ? (
                  <ul className="next-steps-list">
                    {getNextSteps(response?.naechste_schritte).map(
                      (step, index) => (
                        <li key={`${step}-${index}`}>{step}</li>
                      )
                    )}
                  </ul>
                ) : (
                  <pre>
                    {response
                      ? renderValue(response[card.key])
                      : "Noch nichts vorbereitet."}
                  </pre>
                )}
              </article>
            ))}
          </div>

          <section
            className="dispatch-preview"
            aria-label="Freigabe & Ausspielung"
          >
            <div className="dispatch-header">
              <h3>Freigabe & Ausspielung</h3>
              <p>
                Nichts wird automatisch verschickt. Das Event-Team gibt jede
                Nachricht frei.
              </p>
              <p>Kommunikation wird erst nach Freigabe bereitgestellt.</p>
            </div>

            {response ? (
              <div className="dispatch-list">
                {dispatchTargets.map((target) => {
                  const isApproved = dispatchApprovals[target.title];

                  return (
                    <article className="dispatch-item" key={target.title}>
                      <div className="dispatch-item-header">
                        <div>
                          <strong>{target.title}</strong>
                          <small>Quelle: {target.source}</small>
                        </div>
                        <div className="dispatch-actions">
                          <span
                            className={
                              isApproved
                                ? "ready-badge ready-badge-approved"
                                : "ready-badge"
                            }
                          >
                            {isApproved ? "freigegeben" : "bereit"}
                          </span>
                          <button
                            type="button"
                            onClick={() => approveDispatchTarget(target.title)}
                            disabled={isApproved}
                          >
                            {isApproved ? "Freigegeben" : "Freigeben"}
                          </button>
                        </div>
                      </div>
                      <pre>{target.preview}</pre>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">
                Noch keine Ausspielung vorbereitet.
              </p>
            )}
          </section>

          <section className="integration-registry" aria-label="Integrationen">
            <div className="dispatch-header">
              <h3>Integrationen</h3>
              <p>
                Diese Kanäle sind als mögliche Ausspielwege vorbereitet, aber
                in der Demo nicht aktiv.
              </p>
            </div>

            <div className="integration-list">
              {integrationRows.map((integration) => (
                <article className="integration-row" key={integration.name}>
                  <div>
                    <strong>{integration.name}</strong>
                    <small>{integration.purpose}</small>
                  </div>
                  <span
                    className={`integration-badge integration-${integration.status}`}
                  >
                    {integration.status}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className="processing-log" aria-label="Ablauf im Hintergrund">
            <div className="processing-log-header">
              <h3>Ablauf im Hintergrund</h3>
              <span
                className={`impact-badge impact-${getImpactLabel(
                  response?.impact_level
                )}`}
              >
                {getImpactLabel(response?.impact_level)}
              </span>
            </div>

            {response ? (
              <ol className="timeline-list">
                {processingLogSteps.map((step) => (
                  <li className="timeline-item" key={step}>
                    <span className="timeline-dot" aria-hidden="true" />
                    <div>
                      <strong>{step}</strong>
                      <span>gerade eben</span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-state">Noch kein Verarbeitungslauf.</p>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
