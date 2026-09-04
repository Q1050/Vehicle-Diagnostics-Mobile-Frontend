import type { DiagnosticStatus, EvidenceDto } from "./common";

export interface FusionHypothesisDto {
  hypothesis: string;
  score: number;
  confidence: number;
  severity: number;
  explanation?: string;
  supporting_evidence: EvidenceDto[];
  conflicting_evidence?: EvidenceDto[];
}

export interface FusionConflictDto {
  type: string;
  description: string;
  evidence_ids: string[];
  events: string[];
}

export interface FusionResponse {
  status: DiagnosticStatus;
  evidence_count: number;
  grouped_evidence: EvidenceDto[];
  hypotheses: FusionHypothesisDto[];
  conflicts: FusionConflictDto[];
  summary: string;
  limitations: string[];
}
