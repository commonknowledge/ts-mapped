import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { Badge } from "@/shadcn/components/ui/badge";
import { Zap, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import mapStyles, { mapColors } from "../../map/styles";
import Image from "next/image";
import { PublicDataSource } from "@/types";

import { cn } from "@/shadcn/utils";

interface DataSourceCardProps {
  dataSource: PublicDataSource;
}

export function UserDataSourceCard({ dataSource }: DataSourceCardProps) {
  return (
    <Card
      className="flex flex-col gap-2 shadow-none bg-transparent hover:bg-accent transition-all duration-300s"
      key={dataSource.name}
    >
      <CardHeader>
        <Badge variant="outline" className="text-sm text-muted-foreground mb-2">
          {dataSource.config?.type}
        </Badge>
        <CardTitle>{dataSource.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 justify-between h-full">
        <CardDescription>{dataSource.description}</CardDescription>
        <p className="text-sm text-muted-foreground">
          Last updated: 2025-03-29
        </p>
      </CardContent>
    </Card>
  );
}

export function PublicDataSourceCard({ dataSource }: DataSourceCardProps) {
  return (
    <Card
      className="flex flex-col gap-2 shadow-none bg-transparent hover:bg-accent transition-all duration-300s"
      key={dataSource.name}
    >
      <CardHeader>
        {dataSource.image && (
          <Image
            src={dataSource.image || ""}
            alt={dataSource.name}
            height={400}
            width={400}
            className="w-full h-auto object-cover "
          />
        )}
        <CardTitle>{dataSource.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 justify-between h-full">
        <CardDescription>{dataSource.description}</CardDescription>
        <div className="flex  gap-2 justify-between">
          <div className="flex flex-col">
            <Link
              href={dataSource.url || ""}
              className="text-sm text-muted-foreground underline"
            >
              {dataSource.author}
            </Link>
          </div>
          {dataSource.type && (
            <Badge variant="outline" className="text-sm text-muted-foreground">
              {dataSource.type === "Dynamic" && (
                <Zap className="w-4 h-4 text-[#FF6B6B]" />
              )}
              {dataSource.type}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
