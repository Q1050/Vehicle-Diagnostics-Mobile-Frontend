import type { SymptomExtractionResponseDto } from "./dto/symptoms";
import { apiRequest, ENDPOINTS } from "./endpoints";

export interface SymptomExtractionInput {
  text: string;
  sessionId: string;
  vehicleId: string;
  conversationId?: string;
  messageId?: string;
}

export function extractSymptoms(input: SymptomExtractionInput) {
  return apiRequest<SymptomExtractionResponseDto>(ENDPOINTS.symptoms, {
    method: "POST",
    body: JSON.stringify({
      text: input.text,
      session_id: input.sessionId,
      vehicle_id: input.vehicleId,
      conversation_id: input.conversationId,
      message_id: input.messageId,
    }),
    timeoutMs: 15_000,
  });
}
