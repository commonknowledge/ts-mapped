import { LockIcon } from "lucide-react";

/**
 * Shown instead of a moderated public map to visitors without an access
 * grant. The server has already withheld the map's data, so this only
 * needs the public map's name and description.
 */
export default function PublicMapAccessGate({
  name,
  description,
}: {
  name: string;
  description: string;
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
        <p className="text-sm">Access to this map is by request.</p>
      </div>
    </div>
  );
}
