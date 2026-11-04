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
import { useAreaLists } from "../../hooks/useAreaLists";
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
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const inLists = listsContaining({ code: area.code, areaSetCode });
  // Only lists on this area's boundaries can hold it
  const options = lists.filter((list) => list.areaSetCode === areaSetCode);

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
                        setInList({ listId: list.id, area, isIn: !isIn })
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
