export interface VehicleDto {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  fuel?: string;
  transmission?: string;
  mileage: number;
  nickname?: string;
  image_url?: string;
}
