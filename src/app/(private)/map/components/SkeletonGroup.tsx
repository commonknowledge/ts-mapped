import React from "react";
import { Skeleton } from "@/shadcn/ui/skeleton";

export default function SkeletonGroup() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full animate-shimmer" />
      <Skeleton className="h-8 w-full animate-shimmer [animation-delay:200ms]" />
      <Skeleton className="h-8 w-full animate-shimmer [animation-delay:400ms]" />
    </div>
  );
}
