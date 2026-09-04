import type { Vehicle } from "../types";
import type { VehicleDto } from "./dto/vehicles";
import { apiRequest, ENDPOINTS } from "./endpoints";

const mapVehicle = (dto: VehicleDto): Vehicle => ({
  id: dto.id,
  year: dto.year,
  make: dto.make,
  model: dto.model,
  mileage: dto.mileage,
  trim: dto.trim,
  engine: dto.engine,
  fuel: dto.fuel,
  transmission: dto.transmission,
  nickname: dto.nickname,
  imageUrl: dto.image_url,
});
const toDto = (vehicle: Partial<Vehicle>) => ({
  ...(vehicle.year !== undefined ? { year: vehicle.year } : {}),
  ...(vehicle.make !== undefined ? { make: vehicle.make } : {}),
  ...(vehicle.model !== undefined ? { model: vehicle.model } : {}),
  ...(vehicle.trim !== undefined ? { trim: vehicle.trim } : {}),
  ...(vehicle.engine !== undefined ? { engine: vehicle.engine } : {}),
  ...(vehicle.fuel !== undefined ? { fuel: vehicle.fuel } : {}),
  ...(vehicle.transmission !== undefined ? { transmission: vehicle.transmission } : {}),
  ...(vehicle.mileage !== undefined ? { mileage: vehicle.mileage } : {}),
  ...(vehicle.nickname !== undefined ? { nickname: vehicle.nickname } : {}),
  ...(vehicle.imageUrl !== undefined ? { image_url: vehicle.imageUrl } : {}),
});

/** GET /api/v1/vehicles */
export async function listVehicles(): Promise<Vehicle[]> {
  return (await apiRequest<VehicleDto[]>(ENDPOINTS.vehicles)).map(mapVehicle);
}

/** POST /api/v1/vehicles */
export async function createVehicle(input: Omit<Vehicle, "id">): Promise<Vehicle> {
  return mapVehicle(
    await apiRequest<VehicleDto>(ENDPOINTS.vehicles, {
      method: "POST",
      body: JSON.stringify(toDto(input)),
    }),
  );
}

/** PATCH /api/v1/vehicles/:id */
export async function updateVehicle(id: string, patch: Partial<Vehicle>): Promise<Vehicle> {
  return mapVehicle(
    await apiRequest<VehicleDto>(`${ENDPOINTS.vehicles}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toDto(patch)),
    }),
  );
}

/** DELETE /api/v1/vehicles/:id */
export async function deleteVehicle(id: string): Promise<void> {
  await apiRequest<void>(`${ENDPOINTS.vehicles}/${id}`, { method: "DELETE" });
}
