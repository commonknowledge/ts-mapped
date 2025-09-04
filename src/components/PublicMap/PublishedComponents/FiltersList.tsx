"use client";

import { Check } from "lucide-react";
import { useContext } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { PublicFiltersContext } from "@/components/PublicMap/context/PublicFiltersContext";
import { Badge } from "@/shadcn/ui/badge";
import { getActiveFilters } from "./filtersHelpers";
import { toBoolean } from "./utils";

export default function FiltersList() {
  const { publicFilters, setPublicFilters, setFiltersDialogOpen } =
    useContext(PublicFiltersContext);
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
                  <Badge variant="outline" className="bg-white text-sm">
                    <Check />
                    {val}
                  </Badge>
                </li>
              ))}
            </>
          ) : filter.type === PublicMapColumnType.Boolean &&
            toBoolean(filter.value) ? (
            <li key={filter.name}>
              <Badge variant="outline" className="bg-white text-sm">
                <Check />
                {filter.name}
              </Badge>
            </li>
          ) : filter.type === PublicMapColumnType.String ? (
            <li key={filter.value}>
              <Badge variant="outline" className="bg-white text-sm">{filter.value}</Badge>
            </li>
          ) : (
            <></>
          )
        )}
      </ul>
      <div className="flex gap-4 text-muted-foreground text-sm font-medium">
        <button
          type="button"
          className="hover:text-primary cursor-pointer"
          onClick={() => setFiltersDialogOpen(true)}
        >
          Edit filters
        </button>
        <button
          type="button"
          className="hover:text-primary cursor-pointer"
          onClick={() => resetFilters()}
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
