import { MapIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import PrivateMapNavbarControls from "@/app/map/[id]/components/PrivateMapNavbarControls";
import { Link } from "@/components/Link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";

export interface MapCardInterface {
  id: string;
  createdAt: Date;
  href: string;
  name: string;
  imageUrl?: string | null | undefined;
}

export interface MapCardProps {
  map: MapCardInterface;
}

export default function MapCard({ map }: MapCardProps) {
  const { createdAt, href, name, imageUrl } = map;
  const [cardHovered, setCardHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Link href={href}>
      <Card
        className="flex flex-col h-full overflow-hidden py-0 gap-0 shadow-lg hover:shadow-xl  bg-transparent hover:bg-accent transition-all duration-300s group"
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
      >
        <CardHeader className="px-0 gap-0">
          <CardTitle className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-base truncate">{name}</span>
              <div
                className={`transition-opacity duration-150 ${cardHovered || menuOpen ? "opacity-100" : "opacity-0"}`}
                onMouseEnter={() => setCardHovered(true)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <PrivateMapNavbarControls
                  mapId={map.id}
                  onMenuToggle={(open) => setMenuOpen(open)}
                />
              </div>
            </div>

            <div className="mt-1 flex items-center">
              <span className="text-sm text-foreground font-normal">
                {new Date(createdAt).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              height={125}
              width={280}
              priority
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="flex justify-center items-center / w-full h-40 bg-muted text-muted-foreground">
              <MapIcon size={32} />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
