"use client";

import { PlusIcon } from "lucide-react";
import { useAddAreaData } from "../hooks/useAddAreaData";

// The "+" at the end of the inspector's source tabs. It adds to the Areas
// list, the same as that list's own "+", so a new tab is a new Areas entry.
export default function LightInspectorAddSource({
  withLabel,
}: {
  withLabel: boolean;
}) {
  const addAreaData = useAddAreaData();

  return (
    <button
      type="button"
      onClick={() => addAreaData()}
      aria-label="Add data"
      title="Add data to the Areas list"
      className="-mb-px flex shrink-0 cursor-pointer items-center gap-1 rounded-t border-b-2 border-transparent px-1.5 py-1.5 text-xs text-neutral-500 outline-none hover:text-neutral-900 focus-visible:bg-neutral-100"
    >
      <PlusIcon className="size-3.5" />
      {withLabel && "Add data"}
    </button>
  );
}
