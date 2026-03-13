import { Lock } from "lucide-react";

import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
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
import { usePublicMapValue } from "../../hooks/usePublicMap";

export default function EditorNavbar() {
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);
  const publicMap = usePublicMapValue();

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
            <BreadcrumbPage>{publicMap?.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Navbar>
  );
}
