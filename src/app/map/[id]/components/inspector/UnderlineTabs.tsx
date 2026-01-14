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
  const [underlineStyle, setUnderlineStyle] = React.useState({
    left: 0,
    width: 0,
  });
  const listRef = React.useRef<HTMLDivElement>(null);

  const updateUnderline = React.useCallback(() => {
    if (!listRef.current) return;

    const activeButton = listRef.current.querySelector(
      '[data-state="active"]',
    ) as HTMLButtonElement;
    if (!activeButton) return;

    const listRect = listRef.current.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setUnderlineStyle({
      left: buttonRect.left - listRect.left,
      width: buttonRect.width,
    });
  }, []);

  React.useEffect(() => {
    updateUnderline();

    // Use MutationObserver to watch for data-state changes
    const mutationObserver = new MutationObserver(updateUnderline);
    if (listRef.current) {
      mutationObserver.observe(listRef.current, {
        attributes: true,
        attributeFilter: ["data-state"],
        subtree: true,
      });
    }

    // Also use ResizeObserver for size changes
    const resizeObserver = new ResizeObserver(updateUnderline);
    if (listRef.current) {
      resizeObserver.observe(listRef.current);
    }

    window.addEventListener("resize", updateUnderline);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateUnderline);
    };
  }, [updateUnderline]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      className={cn(
        "relative inline-flex w-full items-center justify-start border-b border-border",
        className,
      )}
      {...props}
    >
      {props.children}
      <div
        className="absolute bottom-0 h-[2px] bg-foreground transition-all duration-300 ease-out pointer-events-none"
        style={{
          left: `${underlineStyle.left}px`,
          width: `${underlineStyle.width}px`,
        }}
      />
    </TabsPrimitive.List>
  );
}

function UnderlineTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex w-fit items-center justify-center py-3 h-auto text-sm font-medium text-muted-foreground whitespace-nowrap transition-colors cursor-pointer",
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        "data-[state=active]:text-foreground",
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
      className={cn(
        "flex-1 outline-none animate-in fade-in duration-300",
        className,
      )}
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
