import { LockIcon } from "lucide-react";

/**
 * The card shown instead of a map to visitors without access: the map's
 * name and description, and the request form (or why it can't be used).
 * Used by moderated public maps and shared private maps alike.
 */
export default function MapAccessCard({
  name,
  description,
  children,
}: {
  name: string;
  description?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-50 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <LockIcon size={16} className="text-muted-foreground shrink-0" />
            <h1 className="text-base font-semibold truncate">{name}</h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
