import type { FusionResult } from "../../types";
import type { FusionResponse } from "../dto/fusion";
import { evidenceKind, humanize, mapConcern, mapSupport } from "./common";

export function mapFusionResponseToFusionResult(
  response: FusionResponse,
  options: { id?: string } = {},
): FusionResult {
  return {
    id: options.id ?? `fus_${Date.now().toString(36)}`,
    summary: response.summary,
    hypotheses: response.hypotheses.map((hypothesis, index) => ({
      id: `hyp_${index}_${hypothesis.hypothesis.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      title: hypothesis.hypothesis,
      support: mapSupport(hypothesis.score),
      concern: mapConcern(hypothesis.severity),
      rationale:
        hypothesis.explanation ??
        `Supported by ${hypothesis.supporting_evidence.length} evidence record${hypothesis.supporting_evidence.length === 1 ? "" : "s"}.`,
      supporting: hypothesis.supporting_evidence.map((item) => ({
        kind: evidenceKind(item.source),
        label:
          item.source === "user_report"
            ? `Driver report: ${humanize(item.event)}`
            : humanize(item.event),
        detail: item.explanation ?? `${Math.round(item.confidence * 100)}% source confidence`,
      })),
      conflicting: hypothesis.conflicting_evidence?.map((item) => ({
        kind: evidenceKind(item.source),
        label:
          item.source === "user_report"
            ? `Driver report: ${humanize(item.event)}`
            : humanize(item.event),
        detail: item.explanation ?? "This evidence does not fit the hypothesis.",
      })),
    })),
    conflict: response.conflicts[0]
      ? { title: "Conflicting evidence", detail: response.conflicts[0].description }
      : undefined,
    createdAt: new Date().toISOString(),
  };
}
