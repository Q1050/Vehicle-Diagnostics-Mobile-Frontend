import type { DiagnosticStatus, EvidenceDto } from "./common";

export interface AudioEventDto {
  event: string;
  detected: boolean;
  confidence: number;
  severity: number;
  evidence?: Record<string, number>;
}

export interface AudioDiagnosticResponse {
  status: DiagnosticStatus;
  audio: {
    filename: string;
    duration_seconds: number;
    sample_rate: number;
    samples_analyzed?: number;
  };
  overall: {
    anomaly_detected: boolean;
    anomaly_score: number;
    confidence: number;
  };
  events: AudioEventDto[];
  summary: string;
  limitations: string[];
  explanation?: string;
  recommendations?: string[];
  evidence?: EvidenceDto[];
}
