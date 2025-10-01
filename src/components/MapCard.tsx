import { DotIcon, MapIcon } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
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
    <NextLink href={href}>
      <Card className="flex flex-col h-full overflow-hidden py-0 gap-0 shadow-lg hover:shadow-xl  bg-transparent hover:bg-accent transition-all duration-300s group">
        <CardHeader className="px-0">
          <CardTitle className="flex items-centers p-4">
            {name}
            <DotIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-normal">
              {new Date(createdAt).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
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
            <div className="flex justify-center items-center / w-full aspect-[280/125] bg-muted text-muted-foreground">
              <MapIcon size={32} />
            </div>
          )}
        </CardContent>
      </Card>
    </NextLink>
  );
}
