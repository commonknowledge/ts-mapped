"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/shadcn/utils";

function UnderlineTabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root className={cn("flex flex-col", className)} {...props} />
  );
}

function UnderlineTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex w-full items-center justify-start border-b border-border",
        className,
      )}
      {...props}
    />
  );
}

function UnderlineTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex flex-1 items-center justify-center px-3 py-2 text-sm font-normal text-muted-foreground whitespace-nowrap transition-colors",
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-foreground data-[state=active]:font-medium",
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent",
        "data-[state=active]:after:bg-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function UnderlineTabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export {
  UnderlineTabs,
  UnderlineTabsList,
  UnderlineTabsTrigger,
  UnderlineTabsContent,
};
