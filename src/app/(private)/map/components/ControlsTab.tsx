import { PropsWithChildren } from "react";

export interface ControlsTabProps {
  label: string;
}

export default function ControlsTab({
  children,
}: PropsWithChildren<ControlsTabProps>) {
  return children;
}
