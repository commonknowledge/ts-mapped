"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderPinwheel } from "lucide-react";
import { use } from "react";
import { useTRPC } from "@/services/trpc/react";
import { DataSourceDashboard } from "./DataSourceDashboard";

export default function DataSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const trpc = useTRPC();
  const { data: dataSource, isPending } = useQuery(
    trpc.dataSource.byId.queryOptions(
      { dataSourceId: id },
      { refetchOnMount: "always" },
    ),
  );

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <LoaderPinwheel className="animate-spin" />
      </div>
    );
  }

  if (!dataSource) {
    return (
      <div className="container">
        <h1>Not found</h1>
      </div>
    );
  }

  return <DataSourceDashboard dataSource={dataSource} />;
}
