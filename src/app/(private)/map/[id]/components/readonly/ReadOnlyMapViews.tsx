"use client";

import { cn } from "@/shadcn/utils";
import { useMapViews, useViewIdAtom } from "../../hooks/useMapViews";

/**
 * View switcher for the read-only shared map page: lists the map's views
 * and switches between them. No create / rename / reorder / delete.
 */
export default function ReadOnlyMapViews() {
  const { views } = useMapViews();
  const [viewId, setViewId] = useViewIdAtom();

  if (views.length < 2) {
    return null;
  }

  const sortedViews = [...views].sort((a, b) => a.position - b.position);

  const onSelectView = (id: string) => {
    setViewId(id);
    // Keep the URL shareable without a navigation
    const url = new URL(window.location.href);
    url.searchParams.set("viewId", id);
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {sortedViews.map((view) => (
        <button
          key={view.id}
          type="button"
          className={cn(
            "px-3 py-1 rounded text-sm whitespace-nowrap cursor-pointer transition-colors",
            view.id === viewId
              ? "bg-neutral-100 font-medium"
              : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50",
          )}
          onClick={() => onSelectView(view.id)}
        >
          {view.name}
        </button>
      ))}
    </div>
  );
}
