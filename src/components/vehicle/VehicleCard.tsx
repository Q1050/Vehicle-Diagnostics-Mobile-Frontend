import type { Vehicle } from "@/lib/types";
import { mileageLabel, vehicleLabel } from "@/lib/mocks/vehicles";
import { Icon } from "../ui-kit/Icon";
import { cn } from "@/lib/utils";

export function VehicleCard({
  vehicle,
  primary,
  onEdit,
  onSelect,
  className,
}: {
  vehicle: Vehicle;
  primary?: boolean | undefined;
  onEdit?: (() => void) | undefined;
  onSelect?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "card-shadow rounded-2xl bg-surface-container-lowest p-4",
        primary && "ring-2 ring-primary/20",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <span
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-xl",
              primary ? "bg-primary text-on-primary" : "bg-surface-container-high text-primary",
            )}
          >
            <Icon name="directions_car" size={26} filled={primary} />
          </span>
          <span className="min-w-0">
            {primary ? (
              <span className="text-caption font-semibold tracking-wide text-primary uppercase">
                Current vehicle
              </span>
            ) : null}
            <span className="block truncate font-manrope text-body-lg font-bold text-on-surface">
              {vehicleLabel(vehicle)}
            </span>
            <span className="mt-0.5 block truncate text-label-md font-normal text-on-surface-variant">
              {mileageLabel(vehicle)}
              {vehicle.nickname ? ` · ${vehicle.nickname}` : ""}
            </span>
          </span>
        </button>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${vehicleLabel(vehicle)}`}
            className="flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <Icon name="edit" size={20} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
