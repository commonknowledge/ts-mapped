import { LoaderPinwheel } from "lucide-react";
import { publicMapColourSchemes } from "@/app/map/[id]/styles";
import { usePublicDataRecordsQueries } from "../hooks/usePublicDataRecordsQueries";
import { usePublicMapStore } from "../stores/usePublicMapStore";
import DataSourceTabs from "./DataSourceTabs";

export function PublicMapListings() {
  const publicMap = usePublicMapStore((s) => s.publicMap);
  const editable = usePublicMapStore((s) => s.editable);
  const colourScheme = usePublicMapStore((s) => s.colourScheme);
  const dataRecordsQueries = usePublicDataRecordsQueries();

  // Convert string colourScheme to actual color scheme object
  const activeColourScheme =
    publicMapColourSchemes[colourScheme] || publicMapColourSchemes.red;

  const loadingSources = Object.values(dataRecordsQueries).some(
    (q) => q.isPending,
  );
  return (
    <div className="py-4 flex flex-col min-h-0">
      {/* Listings */}

      <DataSourceTabs
        colourScheme={activeColourScheme}
        editable={editable}
        dataRecordsQueries={dataRecordsQueries}
      />

      {loadingSources && (
        <div className="p-4 pt-0">
          <LoaderPinwheel className="animate-spin" />
        </div>
      )}
      {/* No listings */}
      {editable && publicMap?.dataSourceConfigs.length === 0 && (
        <div className="flex flex-col gap-2 p-2 border border-neutral-200 rounded-md border-dashed">
          <p className="text-sm text-neutral-500">
            No data sources added yet. Add a data source to get started.
          </p>
        </div>
      )}
    </div>
  );
}
