import { gql } from "@apollo/client";
import {
  DataSourceConfigQuery,
  DataSourceConfigQueryVariables,
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
import DataSourceConfigForm from "./DataSourceConfigForm";

export default async function DataSourceColumnsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await query<
    DataSourceConfigQuery,
    DataSourceConfigQueryVariables
  >({
    query: gql`
      query DataSourceConfig($id: String!) {
        dataSource(id: $id) {
          id
          name
          columnDefs {
            name
            type
          }
          columnsConfig {
            nameColumn
          }
          geocodingConfig
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
          <BreadcrumbItem>Columns</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title={`Configure ${result.data.dataSource.name}`}
        description="Tell us about your data to take full advantage of Mapped."
      />
      <Separator className="my-4" />
      <DataSourceConfigForm dataSource={result.data.dataSource} />
    </div>
  );
}
