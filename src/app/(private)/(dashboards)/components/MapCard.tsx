import { MapIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Link } from "@/components/Link";
import { cn } from "@/shadcn/utils";
import type { ReactNode } from "react";

export interface MapCardInterface {
  id: string;
  createdAt: Date;
  href: string;
  name: string;
  imageUrl?: string | null | undefined;
}

export interface MapCardProps {
  map: MapCardInterface;
  renderControls?: (onMenuToggle: (open: boolean) => void) => ReactNode;
}

/** A map in a grid: its preview, then its name and when it was made */
export default function MapCard({ map, renderControls }: MapCardProps) {
  const { createdAt, href, name, imageUrl } = map;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Link
      href={href}
      className="group block h-full overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_8px_30px_rgba(21,33,59,0.08)] focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:outline-none"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-neutral-100 bg-neutral-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 90vw, 400px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <MapIcon className="size-8" />
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          <p className="mt-0.5 font-mono text-[11px] tracking-wide text-neutral-500 uppercase">
            {new Date(createdAt).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        {renderControls && (
          <div
            className={cn(
              "shrink-0 transition-opacity duration-150",
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {renderControls(setMenuOpen)}
          </div>
        )}
      </div>
    </Link>
  );
}
