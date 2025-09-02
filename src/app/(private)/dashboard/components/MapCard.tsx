import { DotIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import { ListMapsQuery } from "@/__generated__/types";
import { Link } from "@/components/Link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";

export function MapCard({
  map: { id, name, imageUrl, createdAt },
}: {
  map: NonNullable<ListMapsQuery["maps"]>[0];
}) {
  return (
    <Link href={`/map/${id}`}>
      <Card
        className="flex flex-col h-full overflow-hidden py-0 gap-0 shadow-lg hover:shadow-xl  bg-transparent hover:bg-accent transition-all duration-300s group"
        key={id}
      >
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
        {imageUrl ? (
          <CardContent className="px-0">
            <Image
              src={imageUrl}
              alt={name}
              height={125}
              width={280}
              priority
              className="w-full h-40 object-cover"
            />
          </CardContent>
        ) : (
          <CardContent className="px-0 h-full">
            <div className="h-full w-full bg-muted" />
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
