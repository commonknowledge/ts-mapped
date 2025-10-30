import { Lock, Map } from "lucide-react";
import { useParams } from "next/navigation";
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
import { usePublicMapStore } from "../../stores/usePublicMapStore";

export default function EditorNavbar() {
  const { id: mapId } = useParams<{ id: string }>();
  const { data: map } = useMapQuery();
  const publicMap = usePublicMapStore((s) => s.publicMap);

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
