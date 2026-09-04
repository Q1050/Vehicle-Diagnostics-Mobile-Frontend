export interface EvidenceDto {
  source: string;
  event: string;
  severity: number;
  confidence: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  explanation?: string;
  origin_id?: string;
}

export type DiagnosticStatus = "completed" | "failed";
