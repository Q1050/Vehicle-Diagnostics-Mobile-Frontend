import type { DiagnosticSession } from "../types";
import {
  mockAudioFinding,
  mockDashboardFinding,
  mockImageFinding,
  mockVideoFindings,
} from "./findings";
import { mockFusion } from "./fusion";

export const mockSessions: DiagnosticSession[] = [
  {
    id: "ses_0828",
    vehicleId: "veh_corolla",
    date: "2026-08-28",
    complaint: "My car shakes when I stop at traffic lights.",
    headline: "Engine shaking at idle",
    evidenceKinds: ["chat", "audio", "video", "dashboard"],
    recommendations: [
      "Book an inspection for an uneven idle within the next week or two.",
      "Ask the mechanic to read the stored fault code first.",
      "Avoid long highway trips until it has been looked at.",
    ],
    findings: [mockAudioFinding, mockVideoFindings[0]!, mockDashboardFinding],
    fusion: mockFusion,
    messages: [
      {
        id: "h1",
        role: "user",
        text: "My car shakes when I stop at traffic lights. It feels like it comes from the front.",
        createdAt: "2026-08-28T10:42:00Z",
      },
      {
        id: "h2",
        role: "assistant",
        text: "Shaking at a stop often relates to how the engine idles. When did you first notice it?",
        createdAt: "2026-08-28T10:42:20Z",
      },
      { id: "h3", role: "user", text: "This week.", createdAt: "2026-08-28T10:43:00Z" },
      {
        id: "h4",
        role: "assistant",
        text: "Thanks. Your engine recording and video both point to an uneven idle. A mechanic should confirm this.",
        findingId: mockAudioFinding.id,
        createdAt: "2026-08-28T10:49:00Z",
      },
    ],
  },
  {
    id: "ses_0824",
    vehicleId: "veh_corolla",
    date: "2026-08-24",
    complaint: "A light came on in the dashboard this morning.",
    headline: "Dashboard warning",
    evidenceKinds: ["chat", "dashboard", "image"],
    recommendations: [
      "Have the oil level checked before driving further.",
      "If the indicator returns, treat it as an inspection priority.",
    ],
    findings: [mockDashboardFinding],
    messages: [
      {
        id: "h5",
        role: "user",
        text: "A light came on in the dashboard this morning.",
        createdAt: "2026-08-24T08:10:00Z",
      },
      {
        id: "h6",
        role: "assistant",
        text: "Let's scan it so we know which indicator it is.",
        findingId: mockDashboardFinding.id,
        createdAt: "2026-08-24T08:11:00Z",
      },
    ],
  },
  {
    id: "ses_0818",
    vehicleId: "veh_crv",
    date: "2026-08-18",
    complaint: "The front tyres look uneven on the inside edge.",
    headline: "Front tire wear",
    evidenceKinds: ["chat", "image"],
    recommendations: [
      "Ask for an alignment check at your next service.",
      "Keep an eye on tyre pressure weekly for now.",
    ],
    findings: [mockImageFinding],
    messages: [
      {
        id: "h7",
        role: "user",
        text: "The front tyres look uneven on the inside edge.",
        createdAt: "2026-08-18T16:02:00Z",
      },
      {
        id: "h8",
        role: "assistant",
        text: "Uneven inner wear may be consistent with alignment. Worth checking at your next service.",
        createdAt: "2026-08-18T16:03:00Z",
      },
    ],
  },
];
