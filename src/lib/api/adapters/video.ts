import type { AnalysisFinding } from "../../types";
import type { VideoDiagnosticResponse } from "../dto/video";
import { humanize, mapConcern, mapConfidence } from "./common";

export function mapVideoDiagnosticToFindings(
  response: VideoDiagnosticResponse,
  options: { idPrefix?: string; mediaUrl?: string } = {},
): AnalysisFinding[] {
  return response.events.map((event, index) => ({
    id: `${options.idPrefix ?? "fnd_video"}_${event.event}_${index}`,
    kind: "video",
    title: humanize(event.event),
    area: event.event.includes("smoke") ? "Exhaust and engine bay" : "Engine movement",
    confidence: mapConfidence(event.confidence),
    technicalConfidence: event.confidence,
    concern: mapConcern(event.severity),
    detected: event.detected,
    whatWeNoticed:
      event.explanation ?? (event.detected ? response.summary : "Not detected in this clip."),
    whyItMatters:
      event.why_it_matters ?? "Video evidence can suggest a pattern but cannot confirm its cause.",
    nextSteps: event.recommendations ?? [
      "Have a mechanic confirm the visible pattern before replacing parts.",
    ],
    mediaUrl: index === 0 ? options.mediaUrl : undefined,
    durationLabel: formatDuration(response.video.duration_seconds),
  }));
}

function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
