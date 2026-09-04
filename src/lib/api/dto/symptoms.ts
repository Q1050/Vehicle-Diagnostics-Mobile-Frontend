import type { DiagnosticStatus, EvidenceDto } from "./common";

export interface SymptomObservationDto {
  event: string;
  text: string;
  confidence: number;
  severity: number;
  negated: boolean;
  uncertain: boolean;
}

export interface SymptomConditionDto {
  condition: string;
  text: string;
  confidence: number;
}

export interface SymptomExtractionResponseDto {
  status: DiagnosticStatus;
  original_text: string;
  symptoms: SymptomObservationDto[];
  conditions: SymptomConditionDto[];
  temporal: {
    onset?: string | null;
    duration?: string | null;
    frequency?: string | null;
    trend?: string | null;
  };
  evidence: EvidenceDto[];
  summary: string;
  limitations: string[];
}
