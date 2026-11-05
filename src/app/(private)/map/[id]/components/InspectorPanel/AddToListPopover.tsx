"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  ListPlusIcon,
  ShapesIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { useAreaLists, useQuickAddAreaList } from "../../hooks/useAreaLists";
import { useInspectorState } from "../../hooks/useInspectorState";
import { getBoundaryName } from "../../v3/utils/boundaries";
import type { AreaSetCode } from "@/models/AreaSet";

/**
 * Puts the inspected area on lists of key areas (or takes it off), makes a
 * new list, or saves the area's shape as a custom area instead
 */
export default function AddToListPopover({
  area,
  areaSetCode,
  onSaveAsCustomArea,
  canSaveAsCustomArea,
}: {
  area: { code: string; name: string };
  areaSetCode: AreaSetCode;
  onSaveAsCustomArea: () => void;
  canSaveAsCustomArea: boolean;
}) {
  const { lists, createList, setInList, listsContaining } = useAreaLists();
  const { start: startQuickAdd } = useQuickAddAreaList();
  const { resetInspector } = useInspectorState();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const inLists = listsContaining({ code: area.code, areaSetCode });
  // Lists on this area's boundaries can hold it, and so can empty ones (which
  // take its boundaries); the rest are on other boundaries
  const options = lists.filter(
    (list) => list.areaSetCode === areaSetCode || list.areas.length === 0,
  );
  const elsewhere = lists.filter((list) => !options.includes(list));

  const addToNewList = () => {
    const list = createList({
      name: newName,
      areaSetCode,
      areas: [area],
    });
    setNewName("");
    toast.success(`Added ${area.name} to ${list.name}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {inLists.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
          In
          {inLists.map((list) => (
            <span key={list.id} className="flex items-center gap-1">
              <span
                aria-hidden
                className="size-2 rounded-sm"
                style={{ backgroundColor: list.color }}
              />
              <span className="text-neutral-800">{list.name}</span>
            </span>
          ))}
        </p>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full" data-tour="add-to-list">
            <ListPlusIcon />
            Add to list
            <ChevronDownIcon className="opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-72 p-0">
          {options.length > 0 && (
            <ul className="flex flex-col border-b border-neutral-100 p-1">
              {options.map((list) => {
                const isIn = list.areas.some((a) => a.code === area.code);
                return (
                  <li key={list.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setInList({
                          listId: list.id,
                          area,
                          isIn: !isIn,
                          areaSetCode,
                        })
                      }
                      aria-pressed={isIn}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-neutral-100"
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: list.color }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {list.name}
                      </span>
                      <span className="text-xs tabular-nums text-neutral-400">
                        {list.areas.length}
                      </span>
                      <CheckIcon
                        className={cn(
                          "size-3.5 shrink-0",
                          isIn ? "text-neutral-900" : "invisible",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {/* Lists on other boundaries: this area can't join them, so say
              why, and offer to pick their kind of area on the map */}
          {elsewhere.length > 0 && (
            <div className="flex flex-col gap-0.5 border-b border-neutral-100 p-1">
              <p className="px-2 pt-1 text-[11px] text-neutral-500">
                On other boundaries
              </p>
              {elsewhere.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-sm opacity-50"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-neutral-500">
                      {list.name}
                    </span>
                    <span className="block truncate text-[11px] text-neutral-400">
                      {getBoundaryName(list.areaSetCode)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      resetInspector();
                      startQuickAdd(list.id);
                    }}
                    title={`Click ${getBoundaryName(list.areaSetCode).toLowerCase()} on the map to add them to ${list.name}`}
                    className="shrink-0 cursor-pointer rounded-md px-1.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    Pick on the map
                  </button>
                </div>
              ))}
            </div>
          )}
          <form
            data-tour="new-list"
            className="flex flex-col gap-1.5 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              addToNewList();
            }}
          >
            <label className="text-[11px] text-neutral-500" htmlFor="new-list">
              {options.length ? "Or a new list" : "Start a list of key areas"}
            </label>
            <div className="flex gap-1.5">
              <input
                id="new-list"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Target seats"
                maxLength={200}
                className="h-8 min-w-0 flex-1 rounded-md border border-input px-2 text-sm outline-none focus:border-neutral-400"
              />
              <Button type="submit" size="sm" className="h-8">
                Add
              </Button>
            </div>
          </form>
          <div className="border-t border-neutral-100 p-1">
            <button
              type="button"
              onClick={() => {
                onSaveAsCustomArea();
                setIsOpen(false);
              }}
              disabled={!canSaveAsCustomArea}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShapesIcon className="size-3.5 shrink-0" />
              Save its shape as a custom area instead
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
