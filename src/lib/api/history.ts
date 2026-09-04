import type { DiagnosticSession } from "../types";
import type { DiagnosticSessionSummaryDto } from "./dto/history";
import { apiRequest, ENDPOINTS } from "./endpoints";
import { createConversation, persistMessage } from "./conversations";

function mapSession(dto: DiagnosticSessionSummaryDto): DiagnosticSession {
  return {
    id: dto.id,
    conversationId: dto.conversation_id,
    vehicleId: dto.vehicle_id,
    date: dto.completed_at ?? dto.latest_message_at ?? dto.started_at,
    complaint: dto.complaint ?? "Diagnosis from shared evidence",
    headline: dto.headline ?? dto.summary ?? "Vehicle diagnosis",
    preview: dto.preview,
    latestMessageAt: dto.latest_message_at,
    messageCount: dto.message_count,
    evidenceKinds: dto.evidence_kinds as DiagnosticSession["evidenceKinds"],
    messages: [],
    findings: dto.findings as unknown as DiagnosticSession["findings"],
    fusion: dto.fusion_result as unknown as DiagnosticSession["fusion"],
    conversationState: dto.conversation_state,
    recommendations: dto.recommendations,
  };
}

/** GET /api/v1/diagnostics/sessions */
export async function listSessions(): Promise<DiagnosticSession[]> {
  return (
    await apiRequest<DiagnosticSessionSummaryDto[]>(`${ENDPOINTS.history}?status=completed`)
  ).map(mapSession);
}

export async function listAllSessions(): Promise<DiagnosticSessionSummaryDto[]> {
  return apiRequest<DiagnosticSessionSummaryDto[]>(ENDPOINTS.history);
}

/** GET /api/v1/diagnostics/sessions/:id */
export async function getSession(id: string): Promise<DiagnosticSession> {
  return mapSession(await apiRequest<DiagnosticSessionSummaryDto>(`${ENDPOINTS.history}/${id}`));
}

export async function createSession(
  vehicleId: string,
  complaint?: string,
): Promise<DiagnosticSessionSummaryDto> {
  return apiRequest<DiagnosticSessionSummaryDto>(ENDPOINTS.history, {
    method: "POST",
    body: JSON.stringify({ vehicle_id: vehicleId, complaint }),
  });
}

export async function saveSession(session: DiagnosticSession): Promise<DiagnosticSession> {
  let sessionId = session.id;
  let conversationId = session.conversationId;
  if (session.id.startsWith("active_")) {
    const created = await createSession(session.vehicleId, session.complaint);
    const conversation = await createConversation(session.vehicleId, created.id);
    sessionId = created.id;
    conversationId = conversation.id;
    for (const message of session.messages) await persistMessage(conversation.id, message);
  }
  const dto = await apiRequest<DiagnosticSessionSummaryDto>(`${ENDPOINTS.history}/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      complaint: session.complaint,
      headline: session.headline,
      status: "completed",
      evidence_kinds: session.evidenceKinds,
      findings: session.findings,
      fusion_result: session.fusion,
      recommendations: session.recommendations,
    }),
  });
  return { ...mapSession(dto), conversationId, messages: session.messages };
}
