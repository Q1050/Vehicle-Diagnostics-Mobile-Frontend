export interface DiagnosticSessionSummaryDto {
  id: string;
  vehicle_id: string;
  conversation_id?: string;
  started_at: string;
  completed_at?: string;
  complaint?: string;
  headline?: string;
  status: "active" | "completed" | "archived";
  summary?: string;
  evidence_kinds: string[];
  findings: Record<string, unknown>[];
  fusion_result?: Record<string, unknown>;
  conversation_state?: Record<string, unknown>;
  recommendations: string[];
  preview?: string;
  latest_message_at?: string;
  message_count?: number;
}
