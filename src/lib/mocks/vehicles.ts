import type { Vehicle } from "../types";

export const mockVehicles: Vehicle[] = [
  {
    id: "veh_corolla",
    year: 2018,
    make: "Toyota",
    model: "Corolla",
    trim: "LE",
    engine: "1.8L 4-cylinder",
    fuel: "Gasoline",
    transmission: "Automatic (CVT)",
    mileage: 82450,
    nickname: "Daily Driver",
  },
  {
    id: "veh_crv",
    year: 2022,
    make: "Honda",
    model: "CR-V",
    trim: "EX",
    engine: "1.5L Turbo 4-cylinder",
    fuel: "Gasoline",
    transmission: "Automatic (CVT)",
    mileage: 36100,
  },
];

export function vehicleLabel(v?: Vehicle | null) {
  if (!v) return "No vehicle selected";
  return `${v.year} ${v.make} ${v.model}`;
}

export function mileageLabel(v?: Vehicle | null) {
  if (!v) return "";
  return `${v.mileage.toLocaleString()} mi`;
}
