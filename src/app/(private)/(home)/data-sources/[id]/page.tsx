"use client";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { DataSourceFeatures } from "@/features";
import { useTRPC } from "@/services/trpc/react";
import { DataSourceDashboard } from "./DataSourceDashboard";
import { DataSourceEnrichmentDashboard } from "./DataSourceEnrichmentDashboard";

export default function DataSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const trpc = useTRPC();
  const { data: dataSource, isPending } = useQuery(
    trpc.dataSource.byId.queryOptions({ dataSourceId: id })
  );

  if (isPending) {
    return (
      <div className="container">
        <h1>Loading</h1>
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

  const features = DataSourceFeatures[dataSource.config.type];
  return (
    <>
      <DataSourceDashboard dataSource={dataSource} />
      {features.enrichment && (
        <DataSourceEnrichmentDashboard dataSource={dataSource} />
      )}
    </>
  );
}
