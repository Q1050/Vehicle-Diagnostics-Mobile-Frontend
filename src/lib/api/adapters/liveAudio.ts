import type { AnalysisFinding, LiveEvent } from "../../types";
import type { AudioEventDto } from "../dto/audio";
import type { LiveDiagnosticUpdateDto } from "../dto/liveAudio";
import { humanize, mapConcern, mapConfidence } from "./common";

type StabilizedEvent = LiveDiagnosticUpdateDto["stabilized_events"][number];

export function mapLiveEventToPresentation(event: AudioEventDto, stabilized = false): LiveEvent {
  return {
    id: event.event,
    title: humanize(event.event),
    detail: event.detected
      ? "This pattern appeared in the latest audio window."
      : "This pattern was not detected.",
    confidence: mapConfidence(event.confidence),
    stabilized,
  };
}

function mapStabilizedEvent(event: StabilizedEvent): LiveEvent {
  return {
    id: event.event,
    title: humanize(event.event),
    detail: event.active
      ? "This pattern remained present across audio windows."
      : "This pattern is not currently stable.",
    confidence: mapConfidence(event.confidence),
    stabilized: event.active,
  };
}

export function mapLiveUpdateToPresentation(update: LiveDiagnosticUpdateDto) {
  const active = update.stabilized_events.filter((event) => event.active);
  const stabilizedIds = new Set(active.map((event) => event.event));
  return {
    events: update.events.map((event) =>
      mapLiveEventToPresentation(event, stabilizedIds.has(event.event)),
    ),
    stabilizedEvents: active.map(mapStabilizedEvent),
    summary: update.summary,
  };
}

export function mapLiveUpdatesToFinding(
  updates: LiveDiagnosticUpdateDto[],
  durationLabel: string,
): AnalysisFinding {
  const latest = updates.at(-1);
  const candidates = updates
    .flatMap((update) => update.stabilized_events)
    .filter((event) => event.active);
  const strongest = candidates.sort(
    (a, b) => b.confidence * b.severity - a.confidence * a.severity,
  )[0];
  return {
    id: `fnd_live_${Date.now().toString(36)}`,
    kind: "live",
    title: strongest ? humanize(strongest.event) : "No stable audio pattern detected",
    area: "Live engine audio",
    confidence: mapConfidence(strongest?.confidence ?? latest?.overall?.confidence ?? 0),
    technicalConfidence: strongest?.confidence ?? latest?.overall?.confidence ?? 0,
    concern: mapConcern(strongest?.severity ?? latest?.overall?.anomaly_score ?? 0),
    detected: Boolean(strongest),
    whatWeNoticed: latest?.summary ?? "No diagnostic updates were received.",
    whyItMatters: strongest
      ? "The pattern remained present across multiple audio windows, but its physical source still needs confirmation."
      : "Short or noisy recordings can hide intermittent sounds.",
    nextSteps: ["Share this live-listen result with a mechanic for confirmation."],
    durationLabel,
  };
}
