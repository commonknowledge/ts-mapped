"use client";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { useTRPC } from "@/utils/trpc";
import ConfigurationForm from "../components/ConfigurationForm";

export default function DataSourceConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const trpc = useTRPC();
  const { data: dataSource, isPending } = useQuery(
    trpc.dataSource.byId.queryOptions({ dataSourceId: id })
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
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/data-sources">Data sources</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href={`/data-sources/${dataSource.id}`}>
              {dataSource.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Config</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title={`Configure ${dataSource.name}`}
        description="Tell us about your data to take full advantage of Mapped."
      />
      <ConfigurationForm dataSource={dataSource} redirectToParent />
    </div>
  );
}
