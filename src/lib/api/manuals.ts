import type { ManualDocumentDto, ManualSearchResponseDto, ManualTypeDto } from "./dto/manuals";
import { apiRequest, ENDPOINTS } from "./endpoints";

export interface ManualSearchInput {
  query: string;
  vehicleId: string;
  manualType?: ManualTypeDto;
  topK?: number;
}

export function searchManual(input: ManualSearchInput) {
  return apiRequest<ManualSearchResponseDto>(ENDPOINTS.manualSearch, {
    method: "POST",
    body: JSON.stringify({
      query: input.query,
      vehicle_id: input.vehicleId,
      manual_type: input.manualType,
      top_k: input.topK ?? 5,
    }),
  });
}

export function listManuals() {
  return apiRequest<ManualDocumentDto[]>(ENDPOINTS.manuals);
}
