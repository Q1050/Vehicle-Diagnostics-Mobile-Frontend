import type { ChatMessage } from "../types";
import { nextId, openingMessages, scriptedReply } from "../mocks/conversation";
import type { ConversationDto, ConversationMessageDto } from "./dto/conversations";
import { apiRequest, delay, ENDPOINTS } from "./endpoints";
import { shouldUseMocks } from "./endpoints";
import type { ConversationRespondResponseDto } from "./dto/chat";
import { mapGroundedResponse } from "./adapters/chat";

export const initialConversationMessages = openingMessages;
export const createLocalId = nextId;

export interface ConversationHandle {
  id: string;
  vehicleId: string;
  sessionId: string;
  createdAt: string;
}

export class ConversationSendError extends Error {
  constructor(
    message: string,
    public readonly userPersisted: boolean,
  ) {
    super(message);
    this.name = "ConversationSendError";
  }
}

export async function createConversation(
  vehicleId: string,
  sessionId: string,
): Promise<ConversationHandle> {
  const dto = await apiRequest<ConversationDto>(ENDPOINTS.conversations, {
    method: "POST",
    body: JSON.stringify({ vehicle_id: vehicleId, diagnostic_session_id: sessionId }),
  });
  return {
    id: dto.id,
    vehicleId: dto.vehicle_id,
    sessionId: dto.diagnostic_session_id ?? sessionId,
    createdAt: dto.created_at,
  };
}

function mapMessage(dto: ConversationMessageDto): ChatMessage {
  const citations = dto.metadata?.orchestration?.message?.citations;
  const followUp = dto.metadata?.orchestration?.follow_up;
  const text =
    followUp?.question && !(dto.text ?? "").includes(followUp.question)
      ? `${dto.text ?? ""}\n\n${followUp.question}`
      : dto.text;
  return {
    id: dto.id,
    role: dto.role,
    text,
    createdAt: dto.created_at,
    suggestions: dto.metadata?.suggestions ?? [],
    followUpOptions: followUp?.options?.map((item) => ({
      ...item,
      ...(followUp.id ? { questionId: followUp.id } : {}),
      ...(followUp.type ? { questionType: followUp.type } : {}),
    })),
    actions: dto.metadata?.orchestration?.recommended_actions,
    findingId: dto.metadata?.findingId,
    citations: citations?.map((item) => ({
      ref: item.ref,
      documentId: item.document_id,
      manualTitle: item.manual_title,
      page: item.page,
      section: item.section,
      sourceUrl: item.source_url,
    })),
  };
}

export async function persistMessage(
  conversationId: string,
  message: ChatMessage,
): Promise<ChatMessage> {
  const dto = await apiRequest<ConversationMessageDto>(
    `${ENDPOINTS.conversations}/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        role: message.role,
        text: message.text,
        client_id: message.id,
        metadata: {
          suggestions: message.suggestions,
          findingId: message.findingId,
          orchestration: {
            message: {
              citations: message.citations?.map((citation) => ({
                ref: citation.ref,
                document_id: citation.documentId,
                manual_title: citation.manualTitle,
                page: citation.page,
                section: citation.section,
                source_url: citation.sourceUrl,
              })),
            },
            follow_up: message.followUpOptions?.length
              ? {
                  id: message.followUpOptions[0]?.questionId,
                  question: message.text,
                  options: message.followUpOptions.map(({ id, label }) => ({ id, label })),
                }
              : undefined,
            recommended_actions: message.actions,
          },
        },
      }),
    },
  );
  return mapMessage(dto);
}

export async function sendMessage(
  text: string,
  turn: number,
  conversationId: string,
  sessionId: string,
  userMessage?: ChatMessage,
  answer?: { questionId: string; optionId: string },
): Promise<ChatMessage> {
  const localUser = userMessage ?? {
    id: nextId("msg"),
    role: "user" as const,
    text,
    createdAt: new Date().toISOString(),
    status: "delivered" as const,
  };
  try {
    await persistMessage(conversationId, localUser);
  } catch (error) {
    throw new ConversationSendError(
      error instanceof Error ? error.message : "Your message could not be saved.",
      false,
    );
  }
  if (shouldUseMocks("chat")) {
    await delay(900);
    return persistMessage(conversationId, scriptedReply(text, turn));
  }
  try {
    const response = await apiRequest<ConversationRespondResponseDto>(
      `${ENDPOINTS.conversations}/${conversationId}/respond`,
      {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          message_id: localUser.id,
          text,
          question_id: answer?.questionId,
          option_id: answer?.optionId,
        }),
        timeoutMs: 35_000,
      },
    );
    return mapGroundedResponse(response);
  } catch (error) {
    throw new ConversationSendError(
      error instanceof Error ? error.message : "AutoAssist could not respond.",
      true,
    );
  }
}

export async function loadConversation(id: string): Promise<ChatMessage[]> {
  return (
    await apiRequest<ConversationMessageDto[]>(`${ENDPOINTS.conversations}/${id}/messages`)
  ).map(mapMessage);
}

export async function resumeConversation(id: string): Promise<ChatMessage[]> {
  return loadConversation(id);
}
