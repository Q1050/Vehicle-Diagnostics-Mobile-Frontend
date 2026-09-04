/**
 * AutoAssist domain types.
 *
 * These shapes intentionally mirror the future FastAPI contracts
 * (see src/lib/api/endpoints.ts) so the mock service layer can be swapped
 * for real HTTP/WebSocket calls without touching the UI.
 */

export type ConfidenceLevel = "low" | "moderate" | "high";
export type ConcernLevel = "informational" | "monitor" | "inspect" | "urgent";
export type SupportLevel = "strong" | "moderate" | "limited";
export type EvidenceKind = "chat" | "image" | "audio" | "video" | "dashboard" | "live";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | undefined;
  engine?: string | undefined;
  fuel?: string | undefined;
  transmission?: string | undefined;
  mileage: number;
  nickname?: string | undefined;
  imageUrl?: string | undefined;
}

export interface AnalysisFinding {
  id: string;
  kind: EvidenceKind;
  /** Consumer-facing headline, e.g. "Possible oil leak". */
  title: string;
  /** Short area/context label, e.g. "Valve cover gasket area". */
  area?: string | undefined;
  confidence: ConfidenceLevel;
  /** Kept secondary — never the primary display. */
  technicalConfidence?: number | undefined;
  concern: ConcernLevel;
  detected: boolean;
  whatWeNoticed: string;
  whyItMatters: string;
  nextSteps: string[];
  /** Present when the local analysis ran but the AI write-up is unavailable. */
  explanationUnavailable?: boolean | undefined;
  mediaUrl?: string | undefined;
  durationLabel?: string | undefined;
  region?: { x: number; y: number; w: number; h: number } | undefined;
}

export type MessageRole = "user" | "assistant";

export type ChatActionType =
  | "take_photo"
  | "scan_dashboard"
  | "record_audio"
  | "live_listen"
  | "upload_video"
  | "view_summary"
  | "professional_inspection";

export interface ChatAction {
  type: ChatActionType;
  label: string;
}

export interface ChatFollowUpOption {
  id: string;
  label: string;
  questionId?: string | undefined;
  questionType?: string | undefined;
}

export interface Attachment {
  id: string;
  kind: "image" | "audio" | "video";
  label: string;
  url?: string | undefined;
  durationLabel?: string | undefined;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text?: string | undefined;
  attachment?: Attachment | undefined;
  /** Inline diagnostic result card rendered inside the conversation. */
  findingId?: string | undefined;
  suggestions?: string[] | undefined;
  followUpOptions?: ChatFollowUpOption[] | undefined;
  actions?: ChatAction[] | undefined;
  citations?:
    | {
        ref: number;
        documentId: string;
        manualTitle: string;
        page: number;
        section: string | null;
        sourceUrl: string | null;
      }[]
    | undefined;
  createdAt: string;
  status?: "sending" | "delivered" | undefined;
  retryResponse?:
    | {
        userMessageId: string;
        text: string;
        questionId?: string;
        optionId?: string;
      }
    | undefined;
}

export interface FusionHypothesis {
  id: string;
  title: string;
  support: SupportLevel;
  concern: ConcernLevel;
  rationale: string;
  supporting: { kind: EvidenceKind; label: string; detail: string }[];
  conflicting?: { kind: EvidenceKind; label: string; detail: string }[] | undefined;
}

export interface FusionResult {
  id: string;
  summary: string;
  hypotheses: FusionHypothesis[];
  conflict?: { title: string; detail: string } | undefined;
  createdAt: string;
}

export interface DiagnosticSession {
  id: string;
  conversationId?: string | undefined;
  vehicleId: string;
  date: string;
  complaint: string;
  headline: string;
  preview?: string | undefined;
  latestMessageAt?: string | undefined;
  messageCount?: number | undefined;
  evidenceKinds: EvidenceKind[];
  messages: ChatMessage[];
  findings: AnalysisFinding[];
  fusion?: FusionResult | undefined;
  conversationState?: Record<string, unknown> | undefined;
  recommendations: string[];
}

/** Live engine listen state machine (mirrors the future /ws/audio lifecycle). */
export type LiveListenState =
  "idle" | "connecting" | "listening" | "event-detected" | "stopped" | "error";

export interface LiveEvent {
  id: string;
  title: string;
  detail: string;
  confidence: ConfidenceLevel;
  stabilized: boolean;
}

/** Presentation compatibility shape. Backend WebSocket DTOs live in api/dto/liveAudio.ts. */
export interface DiagnosticUpdateMessage {
  type: "diagnostic_update";
  events: LiveEvent[];
  stabilized_events: LiveEvent[];
  summary: string;
}
