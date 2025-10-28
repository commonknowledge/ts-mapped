"use client";

import { ListFilter } from "lucide-react";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import FiltersForm from "./FiltersForm";

export const TRANS_FRIENDLY_GPS_FILTERS = [
  {
    label: "Services",
    filters: [
      {
        name: "Bridging Prescription with Recommendation",
        type: PublicMapColumnType.Boolean,
      },
      {
        name: "Bridging Prescription without recommendation",
        type: PublicMapColumnType.Boolean,
      },
      {
        name: "Injections",
        type: PublicMapColumnType.Boolean,
      },
      {
        name: "Blood Tests for self-medication",
        type: PublicMapColumnType.Boolean,
      },
      {
        name: "Non-binary identity accepted",
        type: PublicMapColumnType.Boolean,
      },
      {
        name: "Shared Care Agreement",
        type: PublicMapColumnType.Boolean,
      },
    ],
  },
];

export default function CustomFilters() {
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
        {filterFields.map((category, index) => (
          <div key={index}>
            <DropdownMenuLabel className="p-0 mb-4">
              {category.label}
            </DropdownMenuLabel>
            <FiltersForm fields={category.filters} />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
