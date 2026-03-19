import type { ReactNode } from "react";

export default function LayerControlWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      {children}
    </div>
  );
}
