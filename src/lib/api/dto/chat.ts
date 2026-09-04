import type { ConversationMessageDto } from "./conversations";

export interface ChatCitationDto {
  ref: number;
  document_id: string;
  manual_title: string;
  page: number;
  section: string | null;
  source_url: string | null;
}

export type ChatActionTypeDto =
  | "take_photo"
  | "scan_dashboard"
  | "record_audio"
  | "live_listen"
  | "upload_video"
  | "view_summary"
  | "professional_inspection";

export interface ConversationRespondResponseDto {
  status: "completed";
  message: {
    persisted: ConversationMessageDto;
    text: string;
    citations: ChatCitationDto[];
  };
  follow_up: {
    id: string | null;
    type: string | null;
    question: string | null;
    suggestions: string[];
    options: { id: string; label: string }[];
  };
  recommended_actions: { type: ChatActionTypeDto; label: string }[];
  context_used: {
    symptoms: boolean;
    diagnostic_evidence: boolean;
    fusion: boolean;
    manual: boolean;
  };
  limitations: string[];
  fallback_used: boolean;
}
