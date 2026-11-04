"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useInspectedAreaList } from "../../hooks/useAreaLists";
import { useInspectorState } from "../../hooks/useInspectorState";

/** Over an area opened from a list: back to that list */
export default function AreaListBackLink() {
  const { list } = useInspectedAreaList();
  const { resetInspector } = useInspectorState();
  if (!list) return null;
  return (
    <button
      type="button"
      onClick={resetInspector}
      className="flex w-full cursor-pointer items-center gap-1.5 border-b border-neutral-100 px-3 py-1.5 text-left text-xs text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
    >
      <ArrowLeftIcon className="size-3" />
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-sm"
        style={{ backgroundColor: list.color }}
      />
      <span className="truncate">Back to {list.name}</span>
    </button>
  );
}
