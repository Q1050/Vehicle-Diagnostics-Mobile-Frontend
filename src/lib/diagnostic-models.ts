import type { EvidenceDto } from "./api/dto/common";
import type { AnalysisFinding, ChatMessage, EvidenceKind, FusionResult } from "./types";

export interface DiagnosticArtifact {
  id: string;
  kind: EvidenceKind;
  finding: AnalysisFinding;
  evidence: EvidenceDto[];
  raw?: unknown;
}

export interface ActiveDiagnosticSession {
  id: string;
  vehicleId: string;
  conversationId: string;
  startedAt: string;
  messages: ChatMessage[];
  findings: AnalysisFinding[];
  artifacts: DiagnosticArtifact[];
  fusion?: FusionResult | undefined;
}
