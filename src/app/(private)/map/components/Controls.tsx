import { ReactElement } from "react";
import { Separator } from "@/shadcn/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { ControlsTabProps } from "./ControlsTab";

export default function Controls({
  children,
}: {
  children: ReactElement<ControlsTabProps> | ReactElement<ControlsTabProps>[];
}) {
  const childArray = Array.isArray(children) ? children : [children];
  if (!childArray.length) {
    return null;
  }

  const tabs = childArray.map((child) => ({ label: child.props.label, child }));
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg gap-4 absolute top-0 left-0 m-3 p-4 z-10 w-[300px]">
      <Tabs defaultValue={tabs[0].label} className="w-full">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.label} value={tab.label}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Separator />
        {tabs.map((tab) => {
          return (
            <TabsContent
              key={tab.label}
              value={tab.label}
              className="flex flex-col gap-4 py-2"
            >
              {tab.child}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
