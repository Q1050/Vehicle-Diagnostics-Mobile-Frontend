import type { AnalysisFinding } from "../types";

/** Result of POST /api/v1/diagnostics/image */
export const mockImageFinding: AnalysisFinding = {
  id: "fnd_image_oil",
  kind: "image",
  title: "Possible oil leak",
  area: "Valve cover gasket area",
  confidence: "high",
  technicalConfidence: 0.8143,
  concern: "inspect",
  detected: true,
  whatWeNoticed:
    "Dark, damp residue collected along the upper engine seam. The way it has spread looks more like slow seepage than an active spray.",
  whyItMatters:
    "Left unchecked, seeping oil can soften rubber belts and hoses, drop your oil level over time, and create a burning smell if it reaches hot parts.",
  nextSteps: [
    "Check your oil level with the dipstick once the engine is cool.",
    "Wipe the area clean so you can see how quickly it returns.",
    "Have a mechanic confirm the source before any parts are replaced.",
  ],
  region: { x: 26, y: 38, w: 40, h: 30 },
};

/** Result of a dashboard warning-light scan (image pipeline, dashboard mode). */
export const mockDashboardFinding: AnalysisFinding = {
  id: "fnd_dash_mil",
  kind: "dashboard",
  title: "Check engine indicator is on",
  area: "Instrument cluster",
  confidence: "high",
  technicalConfidence: 0.93,
  concern: "inspect",
  detected: true,
  whatWeNoticed:
    "An amber engine-shaped indicator is lit in the cluster, alongside the normal running lights.",
  whyItMatters:
    "This light means the car's own computer stored a fault. It does not say which part, but it is worth reading the stored code.",
  nextSteps: [
    "Note whether the light is steady or flashing.",
    "Avoid long trips until the stored code has been read.",
    "A mechanic or parts store can read the code in a few minutes.",
  ],
};

/** Result of POST /api/v1/diagnostics/audio */
export const mockAudioFinding: AnalysisFinding = {
  id: "fnd_audio_knock",
  kind: "audio",
  title: "Possible knocking-like pattern",
  area: "Engine bay, front",
  confidence: "moderate",
  technicalConfidence: 0.62,
  concern: "inspect",
  detected: true,
  durationLabel: "00:15",
  whatWeNoticed: "A repeating, evenly spaced tapping sound that rises and falls with engine speed.",
  whyItMatters:
    "Rhythmic knocking can come from several places, some harmless and some not. It is the kind of sound worth checking sooner rather than later.",
  nextSteps: [
    "Avoid hard acceleration and heavy loads for now.",
    "Record again once the engine is fully warm for comparison.",
    "Share this recording with a mechanic so they can confirm it.",
  ],
};

/** Result of POST /api/v1/diagnostics/video */
export const mockVideoFindings: AnalysisFinding[] = [
  {
    id: "fnd_video_vibration",
    kind: "video",
    title: "Possible engine vibration",
    area: "Engine mount area",
    confidence: "moderate",
    technicalConfidence: 0.58,
    concern: "monitor",
    detected: true,
    durationLabel: "00:09",
    whatWeNoticed: "Repeated movement remained after broad camera motion was accounted for.",
    whyItMatters:
      "Extra shaking at idle may be consistent with worn mounts or an uneven idle. On its own it is not urgent.",
    nextSteps: [
      "Record once more with the phone resting on a stable surface.",
      "Note whether the shaking changes in park versus drive.",
    ],
  },
  {
    id: "fnd_video_smoke",
    kind: "video",
    title: "Possible smoke",
    area: "Exhaust and engine bay",
    confidence: "low",
    concern: "informational",
    detected: false,
    whatWeNoticed: "Not detected in this clip.",
    whyItMatters:
      "No visible haze was found, but short clips and bright light can hide light smoke.",
    nextSteps: ["If you see haze later, record it from a few steps back."],
  },
];

export const allMockFindings: AnalysisFinding[] = [
  mockImageFinding,
  mockDashboardFinding,
  mockAudioFinding,
  ...mockVideoFindings,
];

export function findFinding(id?: string) {
  return allMockFindings.find((f) => f.id === id);
}
