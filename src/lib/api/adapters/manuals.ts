import type { ManualPassageDto } from "../dto/manuals";

/** Future evidence compatibility; retrieval relevance is not diagnostic proof. */
export const manualPassageToEvidence = (passage: ManualPassageDto) => ({
  source: "manual" as const,
  event: "manual_guidance",
  severity: 0,
  confidence: passage.score,
  metadata: {
    document_id: passage.document_id,
    page: passage.page,
    section: passage.section,
    manual_type: passage.manual_type,
  },
});
