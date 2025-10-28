import type { ReactNode } from "react";

export default function LayerControlWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="p-2 rounded-lg border bg-white">{children}</div>;
}
