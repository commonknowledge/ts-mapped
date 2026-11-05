import type { ReactNode } from "react";

/** One part of Settings, in its own card: a title, a line on what it's for,
 *  and its form or table */
export default function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="text-base font-medium tracking-[-0.01em] text-ink">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
