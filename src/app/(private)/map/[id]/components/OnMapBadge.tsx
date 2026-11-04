import { cn } from "@/shadcn/utils";

// Marks what's colouring the map now, with a live green dot
export default function OnMapBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-900 px-1.5 py-0.5 font-sans text-[10px] leading-none font-medium normal-case text-white",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
      </span>
      On map
    </span>
  );
}
