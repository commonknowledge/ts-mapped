import { DotIcon } from "lucide-react";
import React from "react";
import { Link } from "@/components/Link";
import { Card, CardHeader, CardTitle } from "@/shadcn/ui/card";

export function MapCard({
  id,
  name,
  createdAt,
}: {
  id: string;
  name: string;
  createdAt: string;
}) {
  return (
    <Link href={`/map/${id}`}>
      <Card
        className="flex flex-col gap-2 shadow-none bg-transparent hover:bg-accent transition-all duration-300s group"
        key={id}
      >
        <CardHeader>
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
