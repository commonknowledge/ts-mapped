"use client";

import React, { Fragment } from "react";
import { PublicDataSourceCard } from "./DataSourceCard";
import { Separator } from "@/shadcn/components/ui/separator";
import { Search } from "lucide-react";
import { Input } from "@/shadcn/components/ui/input";
import { Button } from "@/shadcn/components/ui/button";
import PublicDataSources from "./data/public_data_sources";

export default function PublicDataLibrary() {
  const data = Object.values(PublicDataSources());

  console.log("data:", data);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
      <div className="space-y-4 col-span-1 max-w-64">
        <div className="space-y-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search data sources..."
              className="w-full pl-8"
            />
          </div>
          <h3 className="mt-8">Categories</h3>
          <div className="w-full">
            <Button variant="outline" className="w-full justify-start mb-1">
              All
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              Turf
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              Events
            </Button>
            <Button variant="ghost" className="w-full justify-start mb-1">
              Locations
            </Button>
          </div>
        </div>

        <Separator className="md:hidden" />
      </div>

      <div className="col-span-3 grid grid-cols-1 gap-4 md:grid-cols-2 ">
        {data?.map((dataSource: any) => (
          <PublicDataSourceCard key={dataSource.name} dataSource={dataSource} />
        ))}
      </div>
    </div>
  );
}
