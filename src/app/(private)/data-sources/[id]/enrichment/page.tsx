import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { createCaller } from "@/services/trpc/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import DataSourceEnrichmentForm from "./DataSourceEnrichmentForm";

export default async function DataSourceEnrichmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpcServer = await createCaller();
  const [dataSource, dataSources] = await Promise.all([
    trpcServer.dataSource.byId({ dataSourceId: id }),
    trpcServer.dataSource.listReadable(),
  ]);

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
          <BreadcrumbItem>Enrichment</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title={`Enrich ${dataSource.name}`}
        description="Add data to your CRM"
      />
      <DataSourceEnrichmentForm
        dataSource={dataSource}
        dataSources={dataSources}
      />
    </div>
  );
}
