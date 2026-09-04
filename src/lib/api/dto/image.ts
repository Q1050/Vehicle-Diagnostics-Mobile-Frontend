import type { DiagnosticStatus, EvidenceDto } from "./common";

export interface ImageDetectionDto {
  label: string;
  confidence: number;
  /** Pixel-space corners in [x1, y1, x2, y2] order. */
  bbox: [number, number, number, number];
  /** Top-left x/y plus width/height, normalized to the 0-1 range. */
  bbox_normalized: { x: number; y: number; w: number; h: number };
  severity?: number;
  explanation?: string;
  evidence?: EvidenceDto[];
}

export interface ImageDiagnosticResponse {
  status: DiagnosticStatus;
  detections: ImageDetectionDto[];
  summary?: string;
  limitations?: string[];
  annotated_image_url?: string;
  annotated_image_base64?: string;
  explanation?: string;
  severity?: number;
  recommendations?: string[];
  evidence?: EvidenceDto[];
}
