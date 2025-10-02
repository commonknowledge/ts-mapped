"use client";

import { ListFilter } from "lucide-react";
import { useContext } from "react";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Separator } from "@/shadcn/ui/separator";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import FiltersForm from "./FiltersForm";

export default function Filters() {
  const { filtersDialogOpen, setFiltersDialogOpen, filterFields } =
    useContext(PublicFiltersContext);

  const closeDialog = () => setFiltersDialogOpen(false);

  return (
    <Dialog open={filtersDialogOpen} onOpenChange={setFiltersDialogOpen}>
      <DialogTrigger>
        <Button variant="ghost" asChild={true}>
          <span>
            <ListFilter />
            Filters
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[420px] !w-[90%] gap-2">
        <DialogHeader>
          <DialogTitle>Filter</DialogTitle>
          <DialogDescription className="sr-only">
            Filter map records
          </DialogDescription>
          <Separator className="my-4" />
        </DialogHeader>
        <FiltersForm fields={filterFields} closeDialog={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
