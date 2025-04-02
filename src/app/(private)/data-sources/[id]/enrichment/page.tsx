import { gql } from "@apollo/client";
import {
  DataSourceEnrichmentQuery,
  DataSourceEnrichmentQueryVariables,
} from "@/__generated__/types";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { query } from "@/services/ApolloClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Separator } from "@/shadcn/ui/separator";
import { DataSourceEnrichmentColumnsSchema } from "@/zod";
import DataSourceEnrichmentForm from "./DataSourceEnrichmentForm";

export default async function DataSourceEnrichmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await query<
    DataSourceEnrichmentQuery,
    DataSourceEnrichmentQueryVariables
  >({
    query: gql`
      query DataSourceEnrichment($id: String!) {
        dataSource(id: $id) {
          id
          name
          enrichmentColumns
        }
        dataSources {
          id
          name
          columnDefs {
            name
          }
        }
      }
    `,
    variables: { id },
  });

  if (!result.data.dataSource) {
    return (
      <div className="container">
        <h1>Not found</h1>
      </div>
    );
  }

  const { data: enrichmentColumns } =
    DataSourceEnrichmentColumnsSchema.safeParse(
      result.data.dataSource.enrichmentColumns,
    );
  const initialEnrichmentColumns = enrichmentColumns || [];

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/data-sources">Data sources</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href={`/data-sources/${result.data.dataSource.id}`}>
              {result.data.dataSource.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Enrichment</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title={`Enrich ${result.data.dataSource.name}`}
        description="Add data to your CRM"
      />
      <Separator className="my-4" />
      <DataSourceEnrichmentForm
        dataSource={result.data.dataSource}
        dataSources={result.data.dataSources}
        initialEnrichmentColumns={initialEnrichmentColumns}
      />
    </div>
  );
}
