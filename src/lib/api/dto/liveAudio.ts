import type { EvidenceDto } from "./common";
import type { AudioEventDto } from "./audio";

export interface LiveSessionStartedDto {
  type: "session_started";
  session_id: string;
}

export interface LiveDiagnosticUpdateDto {
  type: "diagnostic_update";
  session_id: string;
  window: { start_seconds: number; end_seconds: number };
  overall?: { anomaly_detected: boolean; anomaly_score: number; confidence: number };
  events: AudioEventDto[];
  stabilized_events: (Omit<AudioEventDto, "detected"> & {
    active: boolean;
    state: "inactive" | "started" | "ongoing" | "ended" | string;
  })[];
  evidence: EvidenceDto[];
  summary: string;
}

export interface LiveSessionEndedDto {
  type: "session_ended";
  session_id: string;
  summary?: string;
}

export interface LiveErrorDto {
  type: "error";
  session_id?: string;
  message: string;
  code?: string;
}

export type LiveAudioMessageDto =
  LiveSessionStartedDto | LiveDiagnosticUpdateDto | LiveSessionEndedDto | LiveErrorDto;
