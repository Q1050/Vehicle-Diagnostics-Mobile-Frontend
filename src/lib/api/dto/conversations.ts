export interface ConversationDto {
  id: string;
  vehicle_id: string;
  diagnostic_session_id?: string;
  created_at: string;
}

export interface ConversationMessageDto {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  text?: string;
  created_at: string;
  metadata?: {
    suggestions?: string[];
    findingId?: string;
    orchestration?: {
      message?: {
        citations?: {
          ref: number;
          document_id: string;
          manual_title: string;
          page: number;
          section: string | null;
          source_url: string | null;
        }[];
      };
      follow_up?: {
        id?: string | null;
        type?: string | null;
        question?: string | null;
        suggestions?: string[];
        options?: { id: string; label: string }[];
      };
      recommended_actions?: import("../../types").ChatAction[];
    };
  };
}
