"use client";

/**
 * What an empty Layers section is for, in one quiet line, with a single
 * text action. The section's + does the same; this says why you'd use it.
 */
export default function LightEmptyHint({
  text,
  actionLabel,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <p className="text-xs leading-relaxed text-neutral-400">
      {text}
      {actionLabel && onAction && (
        <>
          {" "}
          <button
            type="button"
            onClick={onAction}
            className="cursor-pointer font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 hover:decoration-neutral-500"
          >
            {actionLabel}
          </button>
        </>
      )}
    </p>
  );
}
