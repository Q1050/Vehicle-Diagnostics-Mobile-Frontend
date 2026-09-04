import type { FusionResult } from "../types";

/** Result of POST /api/v1/diagnostics/fuse (Evidence Fusion service). */
export const mockFusion: FusionResult = {
  id: "fus_idle_shake",
  createdAt: new Date().toISOString(),
  summary:
    "A knocking-like sound, repeated engine vibration on video and your description of shaking at a stop all point in the same direction: the engine may not be running evenly at idle. A mechanic should confirm this before any parts are replaced.",
  hypotheses: [
    {
      id: "hyp_irregular",
      title: "Engine running irregularly",
      support: "strong",
      concern: "inspect",
      rationale:
        "Three separate kinds of evidence agree, and the dashboard indicator suggests the car's own computer noticed something too.",
      supporting: [
        {
          kind: "audio",
          label: "Engine sound",
          detail: "Possible misfire-like sound pattern",
        },
        {
          kind: "video",
          label: "Video",
          detail: "Repeated engine vibration at idle",
        },
        {
          kind: "chat",
          label: "What you told us",
          detail: '"My car shakes when I stop at traffic lights."',
        },
        {
          kind: "dashboard",
          label: "Dashboard",
          detail: "Check engine indicator is on",
        },
      ],
    },
    {
      id: "hyp_mounts",
      title: "Worn engine mounts",
      support: "moderate",
      concern: "monitor",
      rationale:
        "Would explain the shaking you feel, but fits the sound pattern and warning light less well.",
      supporting: [
        { kind: "video", label: "Video", detail: "Repeated vibration at idle" },
        { kind: "chat", label: "What you told us", detail: "Shaking felt at a stop" },
      ],
      conflicting: [
        {
          kind: "dashboard",
          label: "Dashboard",
          detail: "A warning light is not typical for mounts alone",
        },
      ],
    },
    {
      id: "hyp_exhaust",
      title: "Exhaust leak",
      support: "limited",
      concern: "monitor",
      rationale:
        "Could account for some of the sound, but unlikely to cause noticeable shaking on its own.",
      supporting: [{ kind: "audio", label: "Engine sound", detail: "Uneven low-frequency noise" }],
      conflicting: [
        {
          kind: "video",
          label: "Video",
          detail: "Vibration looks mechanical, not exhaust related",
        },
      ],
    },
  ],
};

/** Reusable example of the conflicting-evidence state. */
export const mockConflictFusion: FusionResult = {
  id: "fus_mixed",
  createdAt: new Date().toISOString(),
  summary: "The evidence we have does not agree yet, so we would rather say so than guess.",
  hypotheses: [],
  conflict: {
    title: "We found mixed evidence",
    detail:
      "One result suggests visible smoke, while another source does not strongly support it. A little more evidence would help.",
  },
};
