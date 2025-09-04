import { Lock, Map } from "lucide-react";
import { useContext } from "react";
import Navbar from "@/components/layout/Navbar";
import { MapContext } from "@/components/Map/context/MapContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { PublicMapContext } from "../PublicMapContext";

export default function EditorNavbar() {
  const { mapId, mapName } = useContext(MapContext);
  const { publicMap } = useContext(PublicMapContext);

  return (
    <Navbar>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Maps</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Lock size={16} />
            <BreadcrumbLink href={`/map/${mapId}`}>{mapName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Map size={16} className="text-primary" />
            <BreadcrumbPage>{publicMap?.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Navbar>
  );
}
