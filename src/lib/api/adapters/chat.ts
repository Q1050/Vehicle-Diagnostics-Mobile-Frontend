import type { ChatMessage } from "../../types";
import type { ConversationRespondResponseDto } from "../dto/chat";

export function mapGroundedResponse(dto: ConversationRespondResponseDto): ChatMessage {
  const question = dto.follow_up.question;
  const text =
    question && !dto.message.text.includes(question)
      ? `${dto.message.text}\n\n${question}`
      : dto.message.text;
  return {
    id: dto.message.persisted.id,
    role: "assistant",
    text,
    createdAt: dto.message.persisted.created_at,
    citations: dto.message.citations.map((item) => ({
      ref: item.ref,
      documentId: item.document_id,
      manualTitle: item.manual_title,
      page: item.page,
      section: item.section,
      sourceUrl: item.source_url,
    })),
    followUpOptions: dto.follow_up.options.map((item) => ({
      ...item,
      ...(dto.follow_up.id ? { questionId: dto.follow_up.id } : {}),
    })),
    actions: dto.recommended_actions,
  };
}
