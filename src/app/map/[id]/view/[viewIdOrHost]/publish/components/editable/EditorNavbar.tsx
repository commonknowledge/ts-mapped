import { Lock, Map } from "lucide-react";
import { useContext } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useMapQuery } from "@/app/map/[id]/hooks/useMapQuery";
import Navbar from "@/components/layout/Navbar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { PublicMapContext } from "../../context/PublicMapContext";

export default function EditorNavbar() {
  const { mapId } = useContext(MapContext);
  const { data: map } = useMapQuery();
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
            <BreadcrumbLink href={`/map/${mapId}`}>
              {map ? map.name : ""}
            </BreadcrumbLink>
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
