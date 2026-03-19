import { LoaderPinwheel } from "lucide-react";
import { useMemo } from "react";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import { publicMapColorSchemes } from "@/app/(private)/map/[id]/styles";
import { getMarkerDataSourceIds } from "@/utils/map";
import { usePublicDataRecordsQueries } from "../hooks/usePublicDataRecordsQueries";
import { useColorScheme, useEditable } from "../hooks/usePublicMap";
import DataSourceTabs from "./DataSourceTabs";

export function PublicMapListings() {
  const { mapConfig } = useMapConfig();
  const editable = useEditable();
  const colorScheme = useColorScheme();
  const dataRecordsQueries = usePublicDataRecordsQueries();

  const markerDataSourceIds = useMemo(
    () => getMarkerDataSourceIds(mapConfig),
    [mapConfig],
  );

  // Convert string colorScheme to actual color scheme object
  const activeColorScheme =
    publicMapColorSchemes[colorScheme] || publicMapColorSchemes.red;

  const loadingSources = Object.values(dataRecordsQueries).some(
    (q) => q.isPending,
  );
  return (
    <div className="flex flex-col min-h-0">
      {/* Listings */}

      <DataSourceTabs
        colorScheme={activeColorScheme}
        editable={editable}
        dataRecordsQueries={dataRecordsQueries}
      />

      {loadingSources && (
        <div className="p-4 pt-0">
          <LoaderPinwheel className="animate-spin" />
        </div>
      )}
      {/* No listings */}
      {editable && markerDataSourceIds.length === 0 && (
        <div className="flex flex-col gap-2 p-2 border border-neutral-200 rounded-md border-dashed">
          <p className="text-sm text-neutral-500">
            No data sources added yet. Add a data source to get started.
          </p>
        </div>
      )}
    </div>
  );
}
