import type { AnalysisFinding } from "../../types";
import type { AudioDiagnosticResponse } from "../dto/audio";
import { humanize, mapConcern, mapConfidence } from "./common";

export function mapAudioDiagnosticToFinding(
  response: AudioDiagnosticResponse,
  options: { id?: string; mediaUrl?: string } = {},
): AnalysisFinding {
  const strongest = response.events
    .filter((event) => event.detected)
    .sort((a, b) => b.confidence * b.severity - a.confidence * a.severity)[0];
  const confidence = strongest?.confidence ?? response.overall.confidence;
  const severity = strongest?.severity ?? response.overall.anomaly_score;

  return {
    id: options.id ?? `fnd_audio_${strongest?.event ?? "clear"}`,
    kind: "audio",
    title: strongest ? humanize(strongest.event) : "No strong audio anomaly detected",
    area: "Recorded engine audio",
    confidence: mapConfidence(confidence),
    technicalConfidence: confidence,
    concern: mapConcern(severity),
    detected: Boolean(strongest) || response.overall.anomaly_detected,
    whatWeNoticed: response.summary,
    whyItMatters:
      response.explanation ?? "Sound patterns need a mechanic to confirm their physical source.",
    nextSteps: response.recommendations ?? [
      "Share the recording and this result with a mechanic for confirmation.",
    ],
    mediaUrl: options.mediaUrl,
    durationLabel: formatDuration(response.audio.duration_seconds),
  };
}

function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
