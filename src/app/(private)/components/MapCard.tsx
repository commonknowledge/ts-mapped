import { MapIcon, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { Link } from "@/components/Link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";

export interface MapCardInterface {
  createdAt: Date;
  href: string;
  name: string;
  imageUrl?: string | null | undefined;
}

export default function MapCard({ map }: { map: MapCardInterface }) {
  const { createdAt, href, name, imageUrl } = map;

  return (
    <Link href={href}>
      <Card className="flex flex-col h-full overflow-hidden py-0 gap-0 shadow-lg hover:shadow-xl  bg-transparent hover:bg-accent transition-all duration-300s group">
        <CardHeader className="px-0">
          <CardTitle className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-base truncate">{name}</span>
              <button
                type="button"
                aria-label="More options"
                className="p-1 rounded hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150"
              >
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-1 flex items-center gap-2">
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
