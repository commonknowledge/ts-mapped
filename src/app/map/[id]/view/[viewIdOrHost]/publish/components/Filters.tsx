"use client";

import { ListFilter } from "lucide-react";
// import { useContext } from "react";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { TRANS_FRIENDLY_GPS_FILTERS, TRANS_FRIENDLY_GPS_LABEL } from "../const";
// import { PublicFiltersContext } from "../context/PublicFiltersContext";
import FiltersForm from "./FiltersForm";

export default function Filters() {
  // const { filterFields } = useContext(PublicFiltersContext);
  const label = TRANS_FRIENDLY_GPS_LABEL;
  const filterFields = TRANS_FRIENDLY_GPS_FILTERS;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" asChild={true}>
          <span>
            <ListFilter />
            Filters
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-4" align="start">
        <DropdownMenuLabel className="p-0 mb-4">{label}</DropdownMenuLabel>
        <FiltersForm fields={filterFields} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
