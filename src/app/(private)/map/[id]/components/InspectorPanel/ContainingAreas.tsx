import { useContainingAreas } from "@/app/(private)/map/[id]/hooks/useContainingAreas";
import type { GeocodeResult } from "@/models/DataRecord";

/** The boundaries currently shown on the map that contain a marker */
export default function ContainingAreas({
  recordAreas,
}: {
  recordAreas: GeocodeResult["areas"] | null | undefined;
}) {
  const { areas, isLoading } = useContainingAreas(recordAreas);

  if (!isLoading && areas.length === 0) {
    return null;
  }

  return (
    <dl className="flex flex-col gap-3">
      {isLoading && areas.length === 0 && (
        <div>
          <dt className="mb-[2px] / text-muted-foreground text-xs uppercase font-mono">
            Containing area
          </dt>
          <dd className="text-muted-foreground">Loading...</dd>
        </div>
      )}
      {areas.map((area) => (
        <div key={area.areaSetCode}>
          <dt className="mb-[2px] / text-muted-foreground text-xs uppercase font-mono">
            {area.label}
          </dt>
          <dd className="flex flex-col">
            <span className="font-medium">{area.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {area.code}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
