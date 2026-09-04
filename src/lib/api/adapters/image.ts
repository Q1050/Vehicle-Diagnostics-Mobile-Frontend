import type { AnalysisFinding, EvidenceKind } from "../../types";
import type { ImageDiagnosticResponse } from "../dto/image";
import { mapConcern, mapConfidence, humanize } from "./common";

export interface ImageMappingOptions {
  id?: string;
  kind?: Extract<EvidenceKind, "image" | "dashboard">;
  mediaUrl?: string;
}

export function mapImageDiagnosticToFinding(
  response: ImageDiagnosticResponse,
  options: ImageMappingOptions = {},
): AnalysisFinding {
  const strongest = [...response.detections].sort((a, b) => b.confidence - a.confidence)[0];
  const confidence = strongest?.confidence ?? 0;
  const severity = strongest?.severity ?? response.severity ?? 0.35;
  const label = strongest?.label ?? "no_visible_defect";
  const limitations = response.limitations?.join(" ");

  return {
    id: options.id ?? `fnd_image_${label}`,
    kind: options.kind ?? "image",
    title: strongest ? humanize(label) : "No clear issue detected",
    area: strongest ? "Detected image region" : undefined,
    confidence: mapConfidence(confidence),
    technicalConfidence: confidence,
    concern: mapConcern(severity),
    detected: Boolean(strongest),
    whatWeNoticed:
      response.summary ?? strongest?.explanation ?? "No clear visual pattern was detected.",
    whyItMatters:
      response.explanation ??
      limitations ??
      "A hands-on inspection may still reveal details a photo cannot show.",
    nextSteps: response.recommendations?.length
      ? response.recommendations
      : ["Have a mechanic confirm the visible area before replacing parts."],
    mediaUrl: options.mediaUrl ?? response.annotated_image_url,
    region: strongest
      ? {
          x: strongest.bbox_normalized.x * 100,
          y: strongest.bbox_normalized.y * 100,
          w: strongest.bbox_normalized.w * 100,
          h: strongest.bbox_normalized.h * 100,
        }
      : undefined,
  };
}
