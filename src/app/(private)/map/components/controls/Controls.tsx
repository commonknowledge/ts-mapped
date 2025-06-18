import { Separator } from "@/shadcn/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import ChoroplethControl from "./ChoroplethControl";
import MarkersControl from "./MarkersControl";
import MembersControl from "./MembersControl";
import TurfControl from "./TurfControl";

export default function Controls() {
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg gap-4 absolute top-0 left-0 m-3 p-4 z-10 w-[300px]">
      <Tabs defaultValue="Layers" className="w-full">
        <TabsList>
          <TabsTrigger value="Layers">Layers</TabsTrigger>
          <TabsTrigger value="Legend">Legend</TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent
          key="Layers"
          value="Layers"
          className="flex flex-col gap-4 py-2"
        >
          <MembersControl />
          <Separator />
          <MarkersControl />
          <Separator />
          <TurfControl />
        </TabsContent>
        <TabsContent
          key="Legend"
          value="Legend"
          className="flex flex-col gap-4 py-2"
        >
          <ChoroplethControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}
