import type { ChatMessage } from "./types";

type Fact = {
  key?: string;
  value?: unknown;
  unit?: string;
  status?: string;
  negated?: boolean;
  uncertain?: boolean;
};

function activeFacts(state: Record<string, unknown> | undefined, name: string): Fact[] {
  const values = state?.[name];
  return Array.isArray(values)
    ? values
        .filter((item): item is Fact => Boolean(item) && typeof item === "object")
        .filter((item) => item.status === "active")
    : [];
}

function symptomLabel(key: string) {
  const labels: Record<string, string> = {
    vehicle_shaking: "shaking",
    engine_vibration: "engine vibration",
    knocking_sound: "a knocking sound",
    ticking_sound: "a ticking sound",
    visible_smoke: "visible smoke",
    oil_leak: "a possible oil leak",
  };
  return labels[key] ?? key.replaceAll("_", " ");
}

function durationLabel(value: unknown, unit = "minutes") {
  if (value === "few") return "roughly a few minutes";
  return `roughly ${String(value)} ${unit}`;
}

export interface ReportSummary {
  hasReports: boolean;
  reported: string;
  assessment: string;
  nextStep: string;
}

export function summarizeConversation(
  state: Record<string, unknown> | undefined,
  messages: ChatMessage[],
): ReportSummary {
  const symptoms = activeFacts(state, "symptoms").filter((fact) => !fact.negated);
  const conditions = activeFacts(state, "conditions");
  const timing = activeFacts(state, "temporal_facts");
  const negations = activeFacts(state, "negations");
  const uncertainties = activeFacts(state, "uncertainties");
  const firstReport = messages
    .find((message) => message.role === "user" && (message.text?.trim().length ?? 0) >= 8)
    ?.text?.trim();

  if (!symptoms.length && !conditions.length && !timing.length) {
    return firstReport
      ? {
          hasReports: true,
          reported: firstReport,
          assessment:
            "This is currently based on your description; there is not enough measured evidence to identify a likely cause.",
          nextStep: "Collect a photo, engine recording, or video while the issue is occurring.",
        }
      : { hasReports: false, reported: "", assessment: "", nextStep: "" };
  }

  const names = symptoms.map((fact) => symptomLabel(fact.key ?? "reported concern")).slice(0, 2);
  let reported = names.length ? `${names.join(" and ")} occurs` : "The reported issue occurs";
  const conditionText = conditions
    .map((fact) => `${fact.key ?? ""} ${String(fact.value ?? "")}`)
    .join(" ")
    .toLowerCase();
  const qualifiers: string[] = [];
  if (conditionText.includes("idle")) qualifiers.push("while idling");
  if (conditionText.includes("cold")) qualifiers.push("especially when the engine is cold");
  if (qualifiers.length) reported += ` ${qualifiers.join(", ")}`;
  const duration = [...timing].reverse().find((fact) => fact.key === "improves_after");
  const trend = [...timing].reverse().find((fact) => fact.key === "trend");
  if (duration) {
    reported += ` and improves after ${durationLabel(duration.value, duration.unit)}`;
    if (trend?.value === "improves_with_warmup") reported += " as the engine warms";
  } else if (trend?.value === "improves_with_warmup") {
    reported += " and improves as the engine warms";
  }
  if (negations.length)
    reported += `. You also reported no ${symptomLabel(negations[0]?.key ?? "related symptom")}`;
  if (uncertainties.length) reported += "; some details remain uncertain";

  const actionTypes = messages
    .flatMap((message) => message.actions ?? [])
    .map((action) => action.type);
  const nextStep = actionTypes.includes("record_audio")
    ? "Record the engine while the reported issue is occurring."
    : "Collect a photo, engine recording, or video while the issue is occurring.";
  return {
    hasReports: true,
    reported: `${reported}.`,
    assessment: "There is not enough measured evidence yet to identify a likely cause.",
    nextStep,
  };
}
