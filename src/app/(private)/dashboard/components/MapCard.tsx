import { DotIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import { Map } from "@/__generated__/types";
import { Link } from "@/components/Link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";

export function MapCard({
  map: { id, name, imageUrl, createdAt },
}: {
  map: Map;
}) {
  return (
    <Link href={`/map/${id}`}>
      <Card
        className="flex flex-col gap-2 shadow-none bg-transparent hover:bg-accent transition-all duration-300s group"
        key={id}
      >
        <CardHeader>
          {imageUrl && (
            <CardContent>
              <Image
                src={imageUrl}
                alt={name}
                height={125}
                width={280}
                priority
              />
            </CardContent>
          )}
          <CardTitle className="flex items-centers">
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
      </Card>
    </Link>
  );
}
