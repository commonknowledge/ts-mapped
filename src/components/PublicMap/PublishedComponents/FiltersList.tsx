"use client";

import { CircleX } from "lucide-react";
import { Fragment, useContext } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { PublicFiltersContext } from "@/components/PublicMap/context/PublicFiltersContext";
import { Badge } from "@/shadcn/ui/badge";
import { PublicFiltersFormValue } from "@/types";
import { PublicMapContext } from "../PublicMapContext";
import { getActiveFilters } from "./filtersHelpers";
import { toBoolean } from "./utils";

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
      className="flex items-center gap-[0.4em] bg-white text-sm"
    >
      {name}
      <button
        className="text-muted-foreground hover:text-primary cursor-pointer"
        onClick={onClick}
      >
        <CircleX size={16} />
      </button>
    </Badge>
  );
}

export default function FiltersList() {
  const { publicFilters, setPublicFilters } = useContext(PublicFiltersContext);
  const { activeTabId } = useContext(PublicMapContext);
  const activeFilters = getActiveFilters(
    activeTabId ? publicFilters[activeTabId] : undefined,
  );

  const removeFilter = (filter: PublicFiltersFormValue, optionName = "") => {
    if (!activeTabId) {
      return;
    }
    const activePublicFilters = publicFilters[activeTabId] || [];
    if (optionName) {
      setPublicFilters({
        ...publicFilters,
        [activeTabId]: [
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
        [activeTabId]: [
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
    <div className="flex flex-col gap-4 p-4 bg-muted">
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
          ) : filter.type === PublicMapColumnType.Boolean &&
            toBoolean(filter.value) ? (
            <li key={filter.name}>
              <FiltersListBadge
                name={filter.name}
                onClick={() => removeFilter(filter)}
              />
            </li>
          ) : filter.type === PublicMapColumnType.String ? (
            <li key={filter.value}>
              <FiltersListBadge
                name={filter.name}
                onClick={() => removeFilter(filter)}
              />
            </li>
          ) : (
            <></>
          ),
        )}
      </ul>
    </div>
  );
}
