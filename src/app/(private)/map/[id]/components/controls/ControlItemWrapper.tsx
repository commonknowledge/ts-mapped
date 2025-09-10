import React from "react";

interface ControlItemWrapperProps {
  children: React.ReactNode;
  className?: string;
  showSeparator?: boolean;
  separatorClassName?: string;
}

export default function ControlItemWrapper({
  children,
  className = "",
}: ControlItemWrapperProps) {
  return (
    <div className={`flex flex-col gap-1 p-3 ${className}`}>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

interface ControlWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function ControlWrapper({
  children,
  className = "",
}: ControlWrapperProps) {
  return <div className={`flex flex-col gap-1 ${className}`}>{children}</div>;
}
