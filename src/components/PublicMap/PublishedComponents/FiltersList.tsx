"use client";

import { useContext } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { PublicFiltersContext } from "@/components/PublicMap/context/PublicFiltersContext";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { getActiveFilters } from "./filtersHelpers";
import { toBoolean } from "./utils";

export default function FiltersList() {
  const { publicFilters, setPublicFilters } = useContext(PublicFiltersContext);
  const activeFilters = getActiveFilters(publicFilters);

  const resetFilters = () => {
    setPublicFilters([]);
  };

  if (!activeFilters?.length) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted">
      <ul className="flex flex-wrap gap-2">
        {activeFilters.map((filter) =>
          filter.selectedOptions ? (
            <>
              {filter.selectedOptions.map((val) => (
                <li key={val}>
                  <Badge>{val}</Badge>
                </li>
              ))}
            </>
          ) : filter.type === PublicMapColumnType.Boolean &&
            toBoolean(filter.value) ? (
            <li key={filter.name}>
              <Badge>{filter.name}</Badge>
            </li>
          ) : filter.type === PublicMapColumnType.String ? (
            <li key={filter.value}>
              <Badge>{filter.value}</Badge>
            </li>
          ) : (
            <></>
          ),
        )}
      </ul>
      <Button type="button" variant="outline" onClick={() => resetFilters()}>
        Reset filters
      </Button>
    </div>
  );
}
