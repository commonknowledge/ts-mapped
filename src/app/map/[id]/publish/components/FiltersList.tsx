"use client";

import { CircleX } from "lucide-react";
import { Fragment } from "react";
import { Badge } from "@/shadcn/ui/badge";
import { getActiveFilters } from "../filtersHelpers";
import {
  usePublicFilters,
  useSetPublicFilters,
} from "../hooks/usePublicFilters";
import { useActiveDataSourceId } from "../hooks/usePublicMap";
import type { PublicFiltersFormValue } from "@/types";

function FiltersListBadge({
  name,
  onClick,
}: {
  name: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Badge
      variant="outline"
      className="flex items-center font-normal gap-[0.4em] bg-white text-xs whitespace-normal"
    >
      <button
        className="text-muted-foreground hover:text-primary cursor-pointer"
        onClick={onClick}
      >
        <CircleX size={16} />
      </button>
      {name}
    </Badge>
  );
}

export default function FiltersList() {
  const publicFilters = usePublicFilters();
  const setPublicFilters = useSetPublicFilters();
  const activeDataSourceId = useActiveDataSourceId();
  const activeFilters = getActiveFilters(
    activeDataSourceId ? publicFilters[activeDataSourceId] : undefined,
  );

  const removeFilter = (filter: PublicFiltersFormValue, optionName = "") => {
    if (!activeDataSourceId) {
      return;
    }
    const activePublicFilters = publicFilters[activeDataSourceId] || [];
    if (optionName) {
      setPublicFilters({
        ...publicFilters,
        [activeDataSourceId]: [
          ...activePublicFilters.map((f) =>
            f.name === filter.name
              ? {
                  ...f,
                  selectedOptions: f.selectedOptions?.length
                    ? [...f.selectedOptions.filter((o) => o !== optionName)]
                    : [],
                }
              : { ...f },
          ),
        ],
      });
    } else {
      setPublicFilters({
        [activeDataSourceId]: [
          ...activePublicFilters.map((f) =>
            f.name === filter.name ? { ...f, value: "" } : { ...f },
          ),
        ],
      });
    }
  };

  if (!activeFilters?.length) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-4 w-full shrink-0 overflow-x-auto p-4 bg-muted">
      <ul className="flex flex-wrap gap-2">
        {activeFilters.map((filter) =>
          filter.selectedOptions ? (
            <Fragment key={filter.name}>
              {filter.selectedOptions.map((val) => (
                <li key={val}>
                  <FiltersListBadge
                    name={val}
                    onClick={() => removeFilter(filter, val)}
                  />
                </li>
              ))}
            </Fragment>
          ) : (
            <li key={filter.name}>
              <FiltersListBadge
                name={filter.name}
                onClick={() => removeFilter(filter)}
              />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
