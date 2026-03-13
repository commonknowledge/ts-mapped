"use client";

import { ListFilter } from "lucide-react";
import { useContext } from "react";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { TRANS_FRIENDLY_HOST } from "../const";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import { PublicMapContext } from "../context/PublicMapContext";
import FiltersForm from "./FiltersForm";

export default function Filters() {
  const { filterFields } = useContext(PublicFiltersContext);
  const { publicMap } = useContext(PublicMapContext);
  const label =
    publicMap?.host === TRANS_FRIENDLY_HOST ? "Services offered" : "Filters";

  if (!filterFields.length) {
    return null;
  }

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
