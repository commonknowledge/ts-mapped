"use client";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import PageHeader from "@/components/PageHeader";
import { useTRPC } from "@/services/trpc/react";
import ConfigurationForm from "../components/ConfigurationForm";

export default function DataSourceConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const trpc = useTRPC();
  const { data: dataSource, isPending } = useQuery(
    trpc.dataSource.byId.queryOptions({ dataSourceId: id }),
  );

  if (isPending) return null;
  if (!dataSource) {
    return (
      <div className="container">
        <h1>Not found</h1>
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <PageHeader
        title={`Configure ${dataSource.name}`}
        description="Select the name and location columns in your data source to import them into Mapped"
      />
      <ConfigurationForm dataSource={dataSource} redirectToParent />
    </div>
  );
}
