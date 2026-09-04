import type { AnalysisFinding, FusionResult } from "../types";
import type { DiagnosticArtifact } from "../diagnostic-models";
import type {
  AudioDiagnosticResponse,
  EvidenceDto,
  FusionResponse,
  ImageDiagnosticResponse,
  VideoDiagnosticResponse,
} from "./dto";
import {
  mapAudioDiagnosticToFinding,
  mapFusionResponseToFusionResult,
  mapImageDiagnosticToFinding,
  mapVideoDiagnosticToFindings,
} from "./adapters";
import {
  mockAudioFinding,
  mockDashboardFinding,
  mockImageFinding,
  mockVideoFindings,
} from "../mocks/findings";
import { mockFusion } from "../mocks/fusion";
import { apiRequest, delay, ENDPOINTS, shouldUseMocks } from "./endpoints";

export interface ImageAnalysisInput {
  file: File;
  mode?: "engine" | "tire" | "dashboard";
  userDescription?: string;
  sessionId?: string;
  vehicleId?: string;
}
export interface AudioAnalysisInput {
  file: File | Blob;
  filename?: string;
  userDescription?: string;
  sessionId?: string;
  vehicleId?: string;
}
export interface VideoAnalysisInput {
  file: File;
  userDescription?: string;
  sessionId?: string;
  vehicleId?: string;
}

export async function analyzeImageArtifact(input: ImageAnalysisInput): Promise<DiagnosticArtifact> {
  if (shouldUseMocks("image")) {
    await delay(2200);
    const source = input.mode === "dashboard" ? mockDashboardFinding : mockImageFinding;
    const dto = imageMockDto(source);
    const finding = mapImageDiagnosticToFinding(dto, {
      id: source.id,
      kind: input.mode === "dashboard" ? "dashboard" : "image",
    });
    return artifact(finding, dto.evidence ?? [], dto);
  }
  const form = new FormData();
  form.append("file", input.file, input.file.name);
  if (input.mode) form.append("mode", input.mode);
  if (input.userDescription) form.append("user_description", input.userDescription);
  if (input.sessionId) form.append("session_id", input.sessionId);
  if (input.vehicleId) form.append("vehicle_id", input.vehicleId);
  const dto = await apiRequest<ImageDiagnosticResponse>(ENDPOINTS.image, {
    method: "POST",
    body: form,
  });
  const finding = mapImageDiagnosticToFinding(dto, {
    id: `fnd_image_${crypto.randomUUID()}`,
    kind: input.mode === "dashboard" ? "dashboard" : "image",
  });
  return artifact(finding, dto.evidence ?? [], dto);
}

export async function analyzeImage(input: ImageAnalysisInput): Promise<AnalysisFinding> {
  return (await analyzeImageArtifact(input)).finding;
}

export async function analyzeAudioArtifact(input: AudioAnalysisInput): Promise<DiagnosticArtifact> {
  if (!shouldUseMocks("audio")) {
    const form = new FormData();
    const filename =
      input.filename ?? (input.file instanceof File ? input.file.name : "engine-recording.wav");
    form.append("file", input.file, filename);
    if (input.userDescription) form.append("user_description", input.userDescription);
    if (input.sessionId) form.append("session_id", input.sessionId);
    if (input.vehicleId) form.append("vehicle_id", input.vehicleId);
    const dto = await apiRequest<AudioDiagnosticResponse>(ENDPOINTS.audio, {
      method: "POST",
      body: form,
      timeoutMs: 30_000,
    });
    const finding = mapAudioDiagnosticToFinding(dto, { id: `fnd_audio_${crypto.randomUUID()}` });
    return artifact(finding, dto.evidence ?? [], dto);
  }
  await delay(2400);
  const filename =
    input.filename ?? (input.file instanceof File ? input.file.name : "recording.webm");
  const dto = audioMockDto(filename);
  const finding = mapAudioDiagnosticToFinding(dto, { id: mockAudioFinding.id });
  return artifact(finding, dto.evidence ?? [], dto);
}

export async function analyzeAudio(input: AudioAnalysisInput): Promise<AnalysisFinding> {
  return (await analyzeAudioArtifact(input)).finding;
}

export async function analyzeVideoArtifacts(
  input: VideoAnalysisInput,
): Promise<DiagnosticArtifact[]> {
  if (!shouldUseMocks("video")) {
    const form = new FormData();
    form.append("file", input.file, input.file.name);
    if (input.userDescription) form.append("user_description", input.userDescription);
    if (input.sessionId) form.append("session_id", input.sessionId);
    if (input.vehicleId) form.append("vehicle_id", input.vehicleId);
    const dto = await apiRequest<VideoDiagnosticResponse>(ENDPOINTS.video, {
      method: "POST",
      body: form,
      timeoutMs: 60_000,
    });
    return mapVideoDiagnosticToFindings(dto, { idPrefix: "fnd" }).map((finding, index) => {
      const event = dto.events[index];
      const relevant = event?.evidence?.length
        ? event.evidence
        : (dto.evidence ?? []).filter((item) => item.event === event?.event);
      return artifact(finding, relevant, dto);
    });
  }
  await delay(2600);
  const dto = videoMockDto(input.file.name);
  return mapVideoDiagnosticToFindings(dto, { idPrefix: "fnd" }).map((finding, index) =>
    artifact(
      { ...finding, id: mockVideoFindings[index]?.id ?? finding.id },
      dto.events[index]?.evidence ?? [],
      dto,
    ),
  );
}

export async function analyzeVideo(input: VideoAnalysisInput): Promise<AnalysisFinding[]> {
  return (await analyzeVideoArtifacts(input)).map((item) => item.finding);
}

export async function fuseEvidence(
  findings: AnalysisFinding[],
  artifacts: DiagnosticArtifact[] = [],
  context: { sessionId?: string; vehicleId?: string; userDescription?: string } = {},
): Promise<FusionResult> {
  if (!shouldUseMocks("fusion")) {
    const dto = await apiRequest<FusionResponse>(ENDPOINTS.fuse, {
      method: "POST",
      body: JSON.stringify({
        session_id: context.sessionId,
        vehicle_id: context.vehicleId,
        user_description: context.userDescription,
        evidence: artifacts.flatMap((item) => item.evidence),
      }),
      timeoutMs: 15_000,
    });
    return mapFusionResponseToFusionResult(dto);
  }
  await delay(1800);
  return mapFusionResponseToFusionResult(fusionMockDto(findings, artifacts), { id: mockFusion.id });
}

function artifact(
  finding: AnalysisFinding,
  evidence: EvidenceDto[],
  raw: unknown,
): DiagnosticArtifact {
  return { id: `art_${finding.id}`, kind: finding.kind, finding, evidence, raw };
}

function evidenceFor(finding: AnalysisFinding, severity: number): EvidenceDto {
  return {
    source: finding.kind,
    event: finding.title,
    severity,
    confidence: finding.technicalConfidence ?? 0.5,
    explanation: finding.whatWeNoticed,
    origin_id: finding.id,
  };
}

function imageMockDto(finding: AnalysisFinding): ImageDiagnosticResponse {
  const severity = finding.concern === "urgent" ? 0.9 : finding.concern === "inspect" ? 0.65 : 0.3;
  return {
    status: "completed",
    detections: finding.detected
      ? [
          {
            label: finding.title.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
            confidence: finding.technicalConfidence ?? 0.5,
            bbox: [0, 0, 100, 100],
            bbox_normalized: finding.region
              ? {
                  x: finding.region.x / 100,
                  y: finding.region.y / 100,
                  w: finding.region.w / 100,
                  h: finding.region.h / 100,
                }
              : { x: 0, y: 0, w: 1, h: 1 },
            severity,
            explanation: finding.whatWeNoticed,
          },
        ]
      : [],
    summary: finding.whatWeNoticed,
    explanation: finding.whyItMatters,
    severity,
    recommendations: finding.nextSteps,
    evidence: [evidenceFor(finding, severity)],
  };
}

function audioMockDto(filename: string): AudioDiagnosticResponse {
  return {
    status: "completed",
    audio: { filename, duration_seconds: 15, sample_rate: 44100, samples_analyzed: 661500 },
    overall: { anomaly_detected: true, anomaly_score: 0.62, confidence: 0.62 },
    events: [
      {
        event: "possible_knocking",
        detected: true,
        confidence: 0.62,
        severity: 0.62,
        evidence: { rhythmicity: 0.71 },
      },
    ],
    summary: mockAudioFinding.whatWeNoticed,
    limitations: [mockAudioFinding.whyItMatters],
    explanation: mockAudioFinding.whyItMatters,
    recommendations: mockAudioFinding.nextSteps,
    evidence: [evidenceFor(mockAudioFinding, 0.62)],
  };
}

function videoMockDto(filename: string): VideoDiagnosticResponse {
  return {
    status: "completed",
    video: { filename, duration_seconds: 9, width: 1920, height: 1080, fps: 30 },
    events: mockVideoFindings.map((finding) => ({
      event: finding.title.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      detected: finding.detected,
      confidence: finding.technicalConfidence ?? 0.5,
      severity: finding.detected ? 0.4 : 0.1,
      explanation: finding.whatWeNoticed,
      why_it_matters: finding.whyItMatters,
      recommendations: finding.nextSteps,
      evidence: [evidenceFor(finding, finding.detected ? 0.4 : 0.1)],
    })),
    summary: "The clip was checked for engine vibration and visible smoke.",
    limitations: ["Camera movement and lighting can hide subtle patterns."],
    evidence: mockVideoFindings.map((finding) =>
      evidenceFor(finding, finding.detected ? 0.4 : 0.1),
    ),
  };
}

function fusionMockDto(
  findings: AnalysisFinding[],
  artifacts: DiagnosticArtifact[],
): FusionResponse {
  const available = new Set(findings.map((finding) => finding.kind));
  return {
    status: "completed",
    evidence_count: findings.length,
    grouped_evidence: artifacts.flatMap((item) => item.evidence),
    hypotheses: mockFusion.hypotheses.map((hypothesis) => ({
      hypothesis: hypothesis.title,
      score:
        hypothesis.support === "strong" ? 0.8 : hypothesis.support === "moderate" ? 0.55 : 0.25,
      confidence:
        hypothesis.support === "strong" ? 0.8 : hypothesis.support === "moderate" ? 0.55 : 0.25,
      severity:
        hypothesis.concern === "urgent" ? 0.9 : hypothesis.concern === "inspect" ? 0.65 : 0.35,
      explanation: hypothesis.rationale,
      supporting_evidence: hypothesis.supporting
        .filter((item) => item.kind === "chat" || available.has(item.kind))
        .map((item) => ({
          source: item.kind,
          event: item.label,
          severity: 0.5,
          confidence: 0.65,
          explanation: item.detail,
        })),
      ...(hypothesis.conflicting
        ? {
            conflicting_evidence: hypothesis.conflicting.map((item) => ({
              source: item.kind,
              event: item.label,
              severity: 0.3,
              confidence: 0.5,
              explanation: item.detail,
            })),
          }
        : {}),
    })),
    conflicts: mockFusion.conflict
      ? [
          {
            type: "conflict",
            description: mockFusion.conflict.detail,
            evidence_ids: [],
            events: [],
          },
        ]
      : [],
    summary: mockFusion.summary,
    limitations: ["A mechanic should confirm the combined result."],
  };
}
