import { LoaderPinwheel } from "lucide-react";
import { useContext } from "react";
import { publicMapColourSchemes } from "@/components/Map/styles";
import { PublicMapContext } from "../PublicMapContext";
import DataSourceTabs from "./DataSourceTabs";

export function PublicMapListings() {
  const { publicMap, editable, dataRecordsQueries, colourScheme } =
    useContext(PublicMapContext);

  // Convert string colourScheme to actual color scheme object
  const activeColourScheme =
    publicMapColourSchemes[colourScheme] || publicMapColourSchemes.red;

  const loadingSources = Object.values(dataRecordsQueries).some(
    (q) => q.loading
  );
  return (
    <div className="overflow-y-auto py-4">
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
