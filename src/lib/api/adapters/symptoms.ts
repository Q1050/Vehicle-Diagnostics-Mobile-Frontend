import type { DiagnosticArtifact } from "../../diagnostic-models";
import type { SymptomExtractionResponseDto } from "../dto/symptoms";
import { humanize, mapConcern, mapConfidence } from "./common";

export function mapSymptomsToArtifact(
  response: SymptomExtractionResponseDto,
  messageId: string,
): DiagnosticArtifact | null {
  if (!response.evidence.length) return null;
  const strongest = [...response.evidence].sort(
    (a, b) => b.confidence * b.severity - a.confidence * a.severity,
  )[0]!;
  return {
    id: `art_user_report_${messageId}`,
    kind: "chat",
    finding: {
      id: `fnd_user_report_${messageId}`,
      kind: "chat",
      title: humanize(strongest.event),
      area: "Driver report",
      confidence: mapConfidence(strongest.confidence),
      technicalConfidence: strongest.confidence,
      concern: mapConcern(strongest.severity),
      detected: true,
      whatWeNoticed: response.summary,
      whyItMatters:
        "This is a structured driver observation, not a mechanically verified diagnosis.",
      nextSteps: [],
    },
    evidence: response.evidence,
    raw: response,
  };
}
