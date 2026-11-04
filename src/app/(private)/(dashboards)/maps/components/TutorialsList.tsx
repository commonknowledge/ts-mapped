"use client";

import { ArrowRightIcon, RotateCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCreateTutorialMap } from "@/hooks/useCreateTutorialMap";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { TUTORIALS } from "../constants";

/**
 * The tutorials, each a guided tour on its own map. Available ones start
 * (or carry on with) a tutorial map; the rest show what's coming.
 */
export default function TutorialsList({
  existingTutorialMapId,
}: {
  /** The most recent tutorial map, to carry on with */
  existingTutorialMapId: string | null;
}) {
  const router = useRouter();
  const { createTutorialMap, isCreating } = useCreateTutorialMap();

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {TUTORIALS.map((tutorial) => {
        const Icon = tutorial.icon;
        return (
          <li
            key={tutorial.id}
            className={cn(
              "flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5",
              !tutorial.isAvailable && "bg-neutral-50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  tutorial.isAvailable
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-200 text-neutral-400",
                )}
              >
                <Icon className="size-4" />
              </span>
              {!tutorial.isAvailable && (
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                  Coming soon
                </span>
              )}
            </div>
            <div
              className={cn(
                "flex flex-1 flex-col gap-1",
                !tutorial.isAvailable && "opacity-60",
              )}
            >
              <h3 className="font-medium text-neutral-900">{tutorial.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-600">
                {tutorial.description}
              </p>
            </div>
            {tutorial.isAvailable && (
              <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                <span className="text-xs text-neutral-500">
                  {tutorial.length}
                </span>
                <div className="flex items-center gap-1.5">
                  {existingTutorialMapId ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={createTutorialMap}
                        disabled={isCreating}
                        title="Start again on a new, empty map"
                      >
                        <RotateCcwIcon />
                        Start again
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/map/${existingTutorialMapId}`)
                        }
                      >
                        Continue
                        <ArrowRightIcon />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={createTutorialMap}
                      disabled={isCreating}
                    >
                      {isCreating ? "Setting up…" : "Start"}
                      <ArrowRightIcon />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
