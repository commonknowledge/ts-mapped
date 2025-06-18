import { DotIcon, PencilIcon } from "lucide-react";
import React from "react";
import { Link } from "@/components/Link";
import { Badge } from "@/shadcn/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { DataSourceType } from "@/types";

export function DataSourceCard({
  id,
  name,
  config,
  createdAt,
  editIcon,
}: {
  id: string;
  name: string;
  config: { type: DataSourceType };
  createdAt: string;
  editIcon?: boolean;
}) {
  return (
    <Link href={`/data-sources/${id}`}>
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
            {editIcon && (
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300s flex items-center gap-2 text-base ml-auto">
                <PencilIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 h-full">
          <CardDescription className="flex items-center gap-2  ">
            <Badge variant="outline" className="text-sm text-muted-foreground ">
              {config.type}
            </Badge>
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
