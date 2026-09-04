import type { DiagnosticStatus, EvidenceDto } from "./common";

export interface VideoEventDto {
  event: "possible_engine_vibration" | "possible_smoke" | string;
  detected: boolean;
  confidence: number;
  severity: number;
  explanation?: string;
  why_it_matters?: string;
  recommendations?: string[];
  evidence?: EvidenceDto[];
}

export interface VideoDiagnosticResponse {
  status: DiagnosticStatus;
  video: {
    filename: string;
    duration_seconds: number;
    width?: number;
    height?: number;
    fps?: number;
  };
  events: VideoEventDto[];
  summary: string;
  limitations: string[];
  evidence?: EvidenceDto[];
}
