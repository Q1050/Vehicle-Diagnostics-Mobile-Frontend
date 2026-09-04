export type ManualTypeDto =
  "owners_manual" | "service_manual" | "repair_manual" | "maintenance_guide" | "technical_bulletin";

export interface ManualPassageDto {
  document_id: string;
  manual_title: string;
  manual_type: ManualTypeDto;
  make: string;
  model: string;
  year: number;
  section: string | null;
  page: number;
  text: string;
  score: number;
  source: string;
  filename: string;
  source_url: string | null;
}

export interface ManualSearchResponseDto {
  status: "completed" | "no_coverage";
  coverage: "exact" | "none";
  query: string;
  vehicle: { year: number; make: string; model: string };
  results: ManualPassageDto[];
  limitations: string[];
}

export interface ManualDocumentDto {
  id: string;
  make: string;
  model: string;
  year: number;
  manual_type: ManualTypeDto;
  title: string;
  filename: string;
  source_url: string | null;
  publisher: string | null;
  revision: string | null;
  language: string;
  checksum: string;
  status: string;
  page_count: number | null;
  embedding_model: string;
  embedding_dimension: number;
  chunking_version: string;
  index_version: string;
  indexed_at: string | null;
  created_at: string;
  updated_at: string;
}
