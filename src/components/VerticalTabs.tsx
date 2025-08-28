"use client";

import { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { cn } from "@/shadcn/utils";

interface VerticalTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface VerticalTabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface VerticalTabsTriggerProps {
  value: string;
  icon?: LucideIcon;
  className?: string;
  label?: string;
}

interface VerticalTabsContentProps {
  value: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  header?: string;
}

/**
 * A custom vertical tabs component with right-aligned icons.
 *
 * This component provides a vertical tab interface with:
 * - Vertical layout for tab triggers
 * - Right-aligned icons for each tab
 * - Clean, modern styling
 * - Flexible content area
 *
 * Usage:
 * ```tsx
 * import { Settings, User, Bell } from "lucide-react";
 *
 * <VerticalTabs value={activeTab} onValueChange={setActiveTab}>
 *   <VerticalTabsList>
 *     <VerticalTabsTrigger value="profile" icon={User}>
 *       Profile
 *     </VerticalTabsTrigger>
 *     <VerticalTabsTrigger value="settings" icon={Settings}>
 *       Settings
 *     </VerticalTabsTrigger>
 *     <VerticalTabsTrigger value="notifications" icon={Bell}>
 *       Notifications
 *     </VerticalTabsTrigger>
 *   </VerticalTabsList>
 *   <VerticalTabsContent value="profile">Profile content</VerticalTabsContent>
 *   <VerticalTabsContent value="settings">Settings content</VerticalTabsContent>
 *   <VerticalTabsContent value="notifications">Notifications content</VerticalTabsContent>
 * </VerticalTabs>
 * ```
 */
export function VerticalTabs({
  value,
  onValueChange,
  children,
  className,
}: VerticalTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      orientation="vertical"
      className={cn("flex flex-row-reverse gap-0", className)}
    >
      {children}
    </Tabs>
  );
}

export function VerticalTabsList({
  children,
  className,
}: VerticalTabsListProps) {
  return (
    <TabsList
      className={cn(
        "flex flex-col h-fit w-fit bg-transparent  rounded-none p-0",
        className
      )}
    >
      {children}
    </TabsList>
  );
}

export function VerticalTabsTrigger({
  value,
  icon: Icon,
  label,
  className,
}: VerticalTabsTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "w-full  p-4 text-left border-none border-neutral-200",
        "data-[state=active]:bg-neutral-200 data-[state=active]:text-primary",
        "data-[state=inactive]:bg-white data-[state=inactive]:text-muted-foreground",
        "hover:bg-muted/80 hover:text-foreground",
        "transition-colors duration-200",
        "rounded-none ",

        className
      )}
    >
      {Icon && <Icon className="size-6 flex-shrink-0" />}
      <p className="font-medium">{label}</p>
    </TabsTrigger>
  );
}

export function VerticalTabsContent({
  value,
  icon: Icon,
  children,
  className,
  header,
}: VerticalTabsContentProps) {
  return (
    <TabsContent
      value={value}
      className={cn(
        "flex-1 mt-0 p-4 bg-card text-card-foreground w-full border-r border-neutral-200 overflow-y-auto",
        className
      )}
    >
      {header && (
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
          {Icon && <Icon className="size-4 flex-shrink-0" />}
          <h3 className="text-lg font-medium">{header}</h3>
        </div>
      )}
      <div className="flex flex-col gap-2 py-2">{children}</div>
    </TabsContent>
  );
}
